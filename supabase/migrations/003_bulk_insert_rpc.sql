-- Bulk student + family insert for CSV migration
-- See PROJECT_CONTEXT.md Section 8.3

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
      gender, blood_group_id, admission_category_id, created_by, updated_by
    ) VALUES (
      p_tenant_id,
      v_student->>'admission_number', v_student->>'first_name', v_student->>'last_name',
      (v_student->>'dob')::DATE, COALESCE(v_student->>'gender', 'Male'),
      (v_student->>'blood_group_id')::INT, (v_student->>'admission_category_id')::INT,
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

    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('success', true, 'inserted', v_count);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'inserted_before_failure', v_count);
END;
$$ LANGUAGE plpgsql;
