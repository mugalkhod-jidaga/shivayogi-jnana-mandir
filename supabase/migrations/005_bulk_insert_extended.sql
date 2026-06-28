-- Extend bulk insert for academic placement, identity, and emergency contacts

CREATE OR REPLACE FUNCTION bulk_insert_students(
  p_tenant_id INT,
  p_created_by UUID,
  p_students JSONB
) RETURNS JSONB AS $$
DECLARE
  v_student JSONB;
  v_student_id UUID;
  v_count INT := 0;
BEGIN
  FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
  LOOP
    INSERT INTO students (
      tenant_id, admission_number, first_name, last_name, dob,
      gender, blood_group_id, admission_category_id,
      admission_date, mother_tongue_id, aadhaar_number,
      created_by, updated_by
    ) VALUES (
      p_tenant_id,
      v_student->>'admission_number', v_student->>'first_name', v_student->>'last_name',
      (v_student->>'dob')::DATE, COALESCE(v_student->>'gender', 'Male'),
      (v_student->>'blood_group_id')::INT, (v_student->>'admission_category_id')::INT,
      COALESCE((v_student->>'admission_date')::DATE, CURRENT_DATE),
      (v_student->>'mother_tongue_id')::INT,
      v_student->>'aadhaar_number',
      p_created_by, p_created_by
    ) RETURNING id INTO v_student_id;

    INSERT INTO student_family_details (
      student_id, father_name, mother_name, parent_status,
      primary_contact, village_town, taluk_mandal, district, pincode
    ) VALUES (
      v_student_id,
      v_student->>'father_name', v_student->>'mother_name',
      COALESCE(v_student->>'parent_status', 'Both Alive'),
      v_student->>'primary_contact',
      v_student->>'village_town', v_student->>'taluk_mandal',
      v_student->>'district', v_student->>'pincode'
    );

    INSERT INTO student_enrollments (
      student_id, academic_year_id, standard_id, section_id,
      roll_number, previous_school, last_class_studied, is_current, enrolled_at
    ) VALUES (
      v_student_id,
      (v_student->>'academic_year_id')::INT,
      (v_student->>'standard_id')::INT,
      (v_student->>'section_id')::INT,
      v_student->>'roll_number',
      v_student->>'previous_school',
      v_student->>'last_class_studied',
      TRUE,
      COALESCE((v_student->>'admission_date')::DATE, CURRENT_DATE)
    );

    IF v_student->>'emergency_contact_name' IS NOT NULL THEN
      INSERT INTO student_emergency_contacts (
        student_id, contact_name, relationship, phone_number
      ) VALUES (
        v_student_id,
        v_student->>'emergency_contact_name',
        COALESCE(v_student->>'emergency_contact_relationship', 'Emergency'),
        v_student->>'emergency_contact_phone'
      );
    END IF;

    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'inserted', v_count);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'inserted_before_failure', v_count);
END;
$$ LANGUAGE plpgsql;
