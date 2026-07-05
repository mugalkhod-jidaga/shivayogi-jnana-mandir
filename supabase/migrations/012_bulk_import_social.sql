-- Bulk import: optional blood group / admission category; SATS + social details

-- Ensure 2026-27 academic year exists for existing tenants
DO $$
DECLARE
  v_tenant RECORD;
BEGIN
  FOR v_tenant IN SELECT id FROM tenants WHERE deleted_at IS NULL
  LOOP
    INSERT INTO lookup_academic_years (tenant_id, label, start_date, end_date, is_current)
    VALUES (v_tenant.id, '2026-27', DATE '2026-06-01', DATE '2027-05-31', TRUE)
    ON CONFLICT (tenant_id, label) DO NOTHING;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION bulk_insert_students(
  p_tenant_id INT,
  p_created_by UUID,
  p_students JSONB
) RETURNS JSONB AS $$
DECLARE
  v_student JSONB;
  v_student_id UUID;
  v_count INT := 0;
  v_blood_group_id INT;
  v_admission_category_id INT;
  v_social_category_id INT;
BEGIN
  FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    v_blood_group_id := NULLIF(NULLIF(v_student->>'blood_group_id', ''), 'null')::INT;
    v_admission_category_id := NULLIF(NULLIF(v_student->>'admission_category_id', ''), 'null')::INT;
    v_social_category_id := NULLIF(NULLIF(v_student->>'social_category_id', ''), 'null')::INT;

    INSERT INTO students (
      tenant_id, admission_number, first_name, last_name, dob,
      gender, blood_group_id, admission_category_id,
      admission_date, mother_tongue_id, aadhaar_number, sats_id,
      created_by, updated_by
    ) VALUES (
      p_tenant_id,
      v_student->>'admission_number', v_student->>'first_name', v_student->>'last_name',
      (v_student->>'dob')::DATE, COALESCE(v_student->>'gender', 'Male'),
      v_blood_group_id, v_admission_category_id,
      COALESCE((v_student->>'admission_date')::DATE, CURRENT_DATE),
      NULLIF(NULLIF(v_student->>'mother_tongue_id', ''), 'null')::INT,
      NULLIF(TRIM(v_student->>'aadhaar_number'), ''),
      NULLIF(TRIM(v_student->>'sats_id'), ''),
      p_created_by, p_created_by
    ) RETURNING id INTO v_student_id;

    INSERT INTO student_family_details (
      student_id, father_name, mother_name, parent_status,
      primary_contact, village_town, taluk_mandal, district, pincode, state
    ) VALUES (
      v_student_id,
      NULLIF(v_student->>'father_name', ''), NULLIF(v_student->>'mother_name', ''),
      COALESCE(v_student->>'parent_status', 'Both Alive'),
      v_student->>'primary_contact',
      v_student->>'village_town', v_student->>'taluk_mandal',
      v_student->>'district', v_student->>'pincode',
      COALESCE(NULLIF(v_student->>'state', ''), 'Karnataka')
    );

    INSERT INTO student_enrollments (
      student_id, academic_year_id, standard_id, section_id,
      roll_number, previous_school, last_class_studied, is_current, enrolled_at
    ) VALUES (
      v_student_id,
      (v_student->>'academic_year_id')::INT,
      (v_student->>'standard_id')::INT,
      NULLIF(NULLIF(v_student->>'section_id', ''), 'null')::INT,
      v_student->>'roll_number',
      NULLIF(v_student->>'previous_school', ''),
      NULLIF(v_student->>'last_class_studied', ''),
      TRUE,
      COALESCE((v_student->>'admission_date')::DATE, CURRENT_DATE)
    );

    IF v_student->>'emergency_contact_name' IS NOT NULL
       AND TRIM(v_student->>'emergency_contact_name') <> '' THEN
      INSERT INTO student_emergency_contacts (
        student_id, contact_name, relationship, phone_number
      ) VALUES (
        v_student_id,
        v_student->>'emergency_contact_name',
        COALESCE(v_student->>'emergency_contact_relationship', 'Emergency'),
        v_student->>'emergency_contact_phone'
      );
    END IF;

    IF v_social_category_id IS NOT NULL
       OR COALESCE(NULLIF(TRIM(v_student->>'caste'), ''), '') <> ''
       OR COALESCE(NULLIF(TRIM(v_student->>'rd_number'), ''), '') <> ''
       OR COALESCE(NULLIF(TRIM(v_student->>'rd_number_secondary'), ''), '') <> '' THEN
      INSERT INTO student_social_details (
        student_id, social_category_id, caste, rd_number, rd_number_secondary
      ) VALUES (
        v_student_id,
        v_social_category_id,
        NULLIF(TRIM(v_student->>'caste'), ''),
        NULLIF(TRIM(v_student->>'rd_number'), ''),
        NULLIF(TRIM(v_student->>'rd_number_secondary'), '')
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'inserted', v_count);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'inserted_before_failure', v_count);
END;
$$ LANGUAGE plpgsql;
