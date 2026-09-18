-- Batch year-end promotion: advance every currently-enrolled active student
-- in one standard to the next academic year (either the next standard, or
-- the same standard again for explicit holdbacks/repeats).
--
-- Mirrors the bulk_insert_students RPC pattern already used for CSV import:
-- a single Postgres function so the whole batch is atomic (the EXCEPTION
-- block acts as an implicit savepoint — no explicit ROLLBACK, see 003).
--
-- Safe to re-run: CREATE OR REPLACE, permission insert is ON CONFLICT DO
-- NOTHING, role grant backfill is ON CONFLICT DO NOTHING.

INSERT INTO permissions (action, description) VALUES
  ('students:promote', 'Run year-end batch promotion (advance students to the next academic year/standard)')
ON CONFLICT (action) DO NOTHING;

-- Backfill the new permission onto Super Admin for tenants that already
-- exist (new tenants get it automatically — the tenant trigger grants
-- Super Admin every row currently in `permissions`).
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.action = 'students:promote'
WHERE r.name = 'Super Admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE OR REPLACE FUNCTION promote_students(
  p_tenant_id INT,
  p_target_academic_year_id INT,
  p_source_standard_id INT,
  p_target_standard_id INT,
  p_student_ids JSONB DEFAULT NULL,          -- explicit inclusion list of student UUIDs; NULL = every eligible student in p_source_standard_id
  p_exclude_student_ids JSONB DEFAULT '[]'::jsonb,   -- skip entirely (handle separately later)
  p_holdback_student_ids JSONB DEFAULT '[]'::jsonb,  -- repeat p_source_standard_id instead of advancing, enrollment_type = REPEATED
  p_dry_run BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  v_target_year_start DATE;
  v_enrollment RECORD;
  v_is_holdback BOOLEAN;
  v_new_standard_id INT;
  v_enrollment_type VARCHAR(20);
  v_promoted INT := 0;
  v_repeated INT := 0;
  v_skipped JSONB := '[]'::jsonb;
  v_affected JSONB := '[]'::jsonb;
BEGIN
  SELECT start_date INTO v_target_year_start
  FROM lookup_academic_years
  WHERE id = p_target_academic_year_id AND tenant_id = p_tenant_id;

  IF v_target_year_start IS NULL THEN
    RAISE EXCEPTION 'Invalid target academic year for this tenant';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM lookup_academic_standards
    WHERE id = p_source_standard_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Invalid source standard for this tenant';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM lookup_academic_standards
    WHERE id = p_target_standard_id AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Invalid target standard for this tenant';
  END IF;

  FOR v_enrollment IN
    SELECT e.id AS enrollment_id, e.student_id, e.academic_year_id,
           e.roll_number, e.previous_school, e.previous_school_address, e.last_class_studied,
           s.status
    FROM student_enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE e.is_current = TRUE
      AND e.deleted_at IS NULL
      AND e.standard_id = p_source_standard_id
      AND s.tenant_id = p_tenant_id
      AND s.deleted_at IS NULL
      AND (
        p_student_ids IS NULL
        OR e.student_id::text IN (SELECT jsonb_array_elements_text(p_student_ids))
      )
      AND NOT (
        e.student_id::text IN (SELECT jsonb_array_elements_text(COALESCE(p_exclude_student_ids, '[]'::jsonb)))
      )
    ORDER BY e.roll_number NULLS LAST, e.enrolled_at
  LOOP
    -- Defensive: skip departed students even if they were explicitly listed.
    IF v_enrollment.status <> 'Active' THEN
      v_skipped := v_skipped || jsonb_build_object(
        'studentId', v_enrollment.student_id,
        'reason', 'Student status is ' || v_enrollment.status || ', not Active'
      );
      CONTINUE;
    END IF;

    -- Idempotency: already enrolled in the target year (e.g. batch re-run).
    IF v_enrollment.academic_year_id = p_target_academic_year_id THEN
      v_skipped := v_skipped || jsonb_build_object(
        'studentId', v_enrollment.student_id,
        'reason', 'Already enrolled in the target academic year'
      );
      CONTINUE;
    END IF;

    v_is_holdback := v_enrollment.student_id::text IN (
      SELECT jsonb_array_elements_text(COALESCE(p_holdback_student_ids, '[]'::jsonb))
    );
    v_new_standard_id := CASE WHEN v_is_holdback THEN p_source_standard_id ELSE p_target_standard_id END;
    v_enrollment_type := CASE WHEN v_is_holdback THEN 'REPEATED' ELSE 'PROMOTED' END;

    IF NOT p_dry_run THEN
      UPDATE student_enrollments
      SET is_current = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = v_enrollment.enrollment_id;

      INSERT INTO student_enrollments (
        student_id, academic_year_id, standard_id, section_id, roll_number,
        previous_school, previous_school_address, last_class_studied,
        is_current, enrollment_type, enrolled_at
      ) VALUES (
        v_enrollment.student_id, p_target_academic_year_id, v_new_standard_id, NULL,
        v_enrollment.roll_number, v_enrollment.previous_school,
        v_enrollment.previous_school_address, v_enrollment.last_class_studied,
        TRUE, v_enrollment_type, v_target_year_start
      );
    END IF;

    IF v_is_holdback THEN
      v_repeated := v_repeated + 1;
    ELSE
      v_promoted := v_promoted + 1;
    END IF;

    v_affected := v_affected || jsonb_build_object(
      'studentId', v_enrollment.student_id,
      'enrollmentType', v_enrollment_type,
      'standardId', v_new_standard_id
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'dryRun', p_dry_run,
    'promoted', v_promoted,
    'repeated', v_repeated,
    'skipped', v_skipped,
    'affected', v_affected
  );
EXCEPTION WHEN OTHERS THEN
  -- Implicit savepoint (see 003_bulk_insert_rpc.sql) — no explicit ROLLBACK.
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
