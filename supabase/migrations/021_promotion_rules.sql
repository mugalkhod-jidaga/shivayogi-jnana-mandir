-- Promotion rules v2 (supersedes the body of promote_students from 018).
--
--   1. Standard step: target standard must be exactly source + 1 (by sort_order).
--   2. Year step:     students are taken from the academic year immediately
--                     BEFORE the target year (2025-26 target => 2024-25 source).
--   3. Only Active students are ever promoted.
--   4. Final standard (highest active sort_order < 99): no target standard;
--      students who are not held back become Alumni.
--
-- Years are ordered by the 4-digit start year parsed from `label` ("2024-25"),
-- NOT by id or start_date — ids are not chronological and some start_date
-- values are unreliable.
--
-- Source students are selected by the academic year of their enrollment,
-- not by `is_current`, so historical batches (is_current = false) still work.
--
-- Safe to re-run: all CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION academic_year_start(p_label TEXT) RETURNS INT AS $$
  SELECT NULLIF(substring(p_label from '^\s*(\d{4})'), '')::int;
$$ LANGUAGE sql IMMUTABLE;

-- Single source of truth for the year/standard rules. Raises on any violation.
CREATE OR REPLACE FUNCTION promotion_context(
  p_tenant_id INT,
  p_target_academic_year_id INT,
  p_source_standard_id INT,
  p_target_standard_id INT,
  OUT o_source_year_ids INT[],
  OUT o_source_year_label TEXT,
  OUT o_target_year_label TEXT,
  OUT o_target_year_num INT,
  OUT o_target_year_start DATE,
  OUT o_is_final BOOLEAN,
  OUT o_expected_target_standard_id INT
) AS $$
DECLARE
  v_source_sort INT;
  v_final_sort INT;
BEGIN
  SELECT label, start_date INTO o_target_year_label, o_target_year_start
  FROM lookup_academic_years
  WHERE id = p_target_academic_year_id AND tenant_id = p_tenant_id;

  IF o_target_year_label IS NULL THEN
    RAISE EXCEPTION 'Invalid target academic year for this tenant';
  END IF;

  o_target_year_num := academic_year_start(o_target_year_label);
  IF o_target_year_num IS NULL THEN
    RAISE EXCEPTION 'Academic year label "%" is not in YYYY-YY format', o_target_year_label;
  END IF;

  SELECT array_agg(id), min(label) INTO o_source_year_ids, o_source_year_label
  FROM lookup_academic_years
  WHERE tenant_id = p_tenant_id
    AND academic_year_start(label) = o_target_year_num - 1;

  IF o_source_year_ids IS NULL THEN
    RAISE EXCEPTION 'No academic year exists immediately before % to promote from', o_target_year_label;
  END IF;

  SELECT sort_order INTO v_source_sort
  FROM lookup_academic_standards
  WHERE id = p_source_standard_id AND tenant_id = p_tenant_id;

  IF v_source_sort IS NULL THEN
    RAISE EXCEPTION 'Invalid source standard for this tenant';
  END IF;
  IF v_source_sort >= 99 THEN
    RAISE EXCEPTION 'Students in the Unassigned standard cannot be promoted';
  END IF;

  SELECT max(sort_order) INTO v_final_sort
  FROM lookup_academic_standards
  WHERE tenant_id = p_tenant_id AND is_active AND sort_order < 99;

  o_is_final := v_source_sort >= v_final_sort;

  IF o_is_final THEN
    o_expected_target_standard_id := NULL;
  ELSE
    SELECT id INTO o_expected_target_standard_id
    FROM lookup_academic_standards
    WHERE tenant_id = p_tenant_id AND is_active
      AND sort_order = v_source_sort + 1 AND sort_order < 99
    ORDER BY id
    LIMIT 1;

    IF o_expected_target_standard_id IS NULL THEN
      RAISE EXCEPTION 'No standard exists immediately after the source standard';
    END IF;

    IF p_target_standard_id IS NOT NULL AND p_target_standard_id <> o_expected_target_standard_id THEN
      RAISE EXCEPTION 'Target standard must be the standard immediately after the source standard';
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Students eligible for a (source standard -> target year) promotion.
CREATE OR REPLACE FUNCTION promotion_candidates(
  p_tenant_id INT,
  p_target_academic_year_id INT,
  p_source_standard_id INT
) RETURNS JSONB AS $$
DECLARE
  v_ctx RECORD;
  v_students JSONB;
BEGIN
  SELECT * INTO v_ctx
  FROM promotion_context(p_tenant_id, p_target_academic_year_id, p_source_standard_id, NULL);

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'admissionNumber', s.admission_number,
        'firstName', s.first_name,
        'lastName', s.last_name,
        'rollNumber', e.roll_number
      )
      ORDER BY e.roll_number NULLS LAST, s.first_name
    ),
    '[]'::jsonb
  ) INTO v_students
  FROM student_enrollments e
  JOIN students s ON s.id = e.student_id
  WHERE e.academic_year_id = ANY (v_ctx.o_source_year_ids)
    AND e.standard_id = p_source_standard_id
    AND e.deleted_at IS NULL
    AND s.tenant_id = p_tenant_id
    AND s.deleted_at IS NULL
    AND s.status = 'Active'
    AND NOT EXISTS (
      SELECT 1
      FROM student_enrollments e2
      JOIN lookup_academic_years y2 ON y2.id = e2.academic_year_id
      WHERE e2.student_id = e.student_id
        AND e2.deleted_at IS NULL
        AND academic_year_start(y2.label) >= v_ctx.o_target_year_num
    );

  RETURN jsonb_build_object(
    'success', true,
    'sourceAcademicYearLabel', v_ctx.o_source_year_label,
    'targetAcademicYearLabel', v_ctx.o_target_year_label,
    'isFinalStandard', v_ctx.o_is_final,
    'expectedTargetStandardId', v_ctx.o_expected_target_standard_id,
    'students', v_students
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION promote_students(
  p_tenant_id INT,
  p_target_academic_year_id INT,
  p_source_standard_id INT,
  p_target_standard_id INT,                          -- NULL only when the source is the final standard
  p_student_ids JSONB DEFAULT NULL,
  p_exclude_student_ids JSONB DEFAULT '[]'::jsonb,
  p_holdback_student_ids JSONB DEFAULT '[]'::jsonb,
  p_dry_run BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  v_ctx RECORD;
  v_enrollment RECORD;
  v_is_holdback BOOLEAN;
  v_new_standard_id INT;
  v_enrollment_type VARCHAR(20);
  v_promoted INT := 0;
  v_repeated INT := 0;
  v_graduated INT := 0;
  v_skipped JSONB := '[]'::jsonb;
  v_affected JSONB := '[]'::jsonb;
BEGIN
  SELECT * INTO v_ctx
  FROM promotion_context(p_tenant_id, p_target_academic_year_id, p_source_standard_id, p_target_standard_id);

  IF NOT v_ctx.o_is_final AND p_target_standard_id IS NULL THEN
    RAISE EXCEPTION 'Target standard is required';
  END IF;

  FOR v_enrollment IN
    SELECT e.id AS enrollment_id, e.student_id,
           e.roll_number, e.previous_school, e.previous_school_address, e.last_class_studied,
           s.status
    FROM student_enrollments e
    JOIN students s ON s.id = e.student_id
    WHERE e.academic_year_id = ANY (v_ctx.o_source_year_ids)
      AND e.standard_id = p_source_standard_id
      AND e.deleted_at IS NULL
      AND s.tenant_id = p_tenant_id
      AND s.deleted_at IS NULL
      -- Default population is Active only; an explicit list may name inactive
      -- students, who are then reported as skipped below.
      AND (s.status = 'Active' OR p_student_ids IS NOT NULL)
      AND (
        p_student_ids IS NULL
        OR e.student_id::text IN (SELECT jsonb_array_elements_text(p_student_ids))
      )
      AND NOT (
        e.student_id::text IN (SELECT jsonb_array_elements_text(COALESCE(p_exclude_student_ids, '[]'::jsonb)))
      )
    ORDER BY e.roll_number NULLS LAST, e.enrolled_at
  LOOP
    IF v_enrollment.status <> 'Active' THEN
      v_skipped := v_skipped || jsonb_build_object(
        'studentId', v_enrollment.student_id,
        'reason', 'Student status is ' || v_enrollment.status || ', not Active'
      );
      CONTINUE;
    END IF;

    -- Idempotency / no going backwards: skip if the student already has any
    -- enrollment in the target year or later.
    IF EXISTS (
      SELECT 1
      FROM student_enrollments e2
      JOIN lookup_academic_years y2 ON y2.id = e2.academic_year_id
      WHERE e2.student_id = v_enrollment.student_id
        AND e2.deleted_at IS NULL
        AND academic_year_start(y2.label) >= v_ctx.o_target_year_num
    ) THEN
      v_skipped := v_skipped || jsonb_build_object(
        'studentId', v_enrollment.student_id,
        'reason', 'Already enrolled in the target academic year or later'
      );
      CONTINUE;
    END IF;

    v_is_holdback := v_enrollment.student_id::text IN (
      SELECT jsonb_array_elements_text(COALESCE(p_holdback_student_ids, '[]'::jsonb))
    );

    -- Final standard, not held back: graduate to Alumni (no new enrollment).
    IF v_ctx.o_is_final AND NOT v_is_holdback THEN
      IF NOT p_dry_run THEN
        UPDATE students
        SET status = 'Alumni',
            status_reason = 'Completed final standard',
            status_changed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_enrollment.student_id;
      END IF;

      v_graduated := v_graduated + 1;
      v_affected := v_affected || jsonb_build_object(
        'studentId', v_enrollment.student_id,
        'enrollmentType', 'ALUMNI',
        'standardId', p_source_standard_id
      );
      CONTINUE;
    END IF;

    v_new_standard_id := CASE WHEN v_is_holdback THEN p_source_standard_id ELSE v_ctx.o_expected_target_standard_id END;
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
        TRUE, v_enrollment_type, v_ctx.o_target_year_start
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
    'graduated', v_graduated,
    'skipped', v_skipped,
    'affected', v_affected
  );
EXCEPTION WHEN OTHERS THEN
  -- Implicit savepoint (see 003_bulk_insert_rpc.sql) — no explicit ROLLBACK.
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
