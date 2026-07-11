-- Phase 2: medicine catalog, visit attachments, catalog seed

CREATE TABLE medicine_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    name VARCHAR(255) NOT NULL,
    normalized_name VARCHAR(255) NOT NULL,
    issue_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_dose_amount VARCHAR(20) NULL,
    default_dose_unit_id INT REFERENCES lookup_medicine_dose_units(id) NULL,
    default_food_timing_id INT REFERENCES lookup_medicine_food_timings(id) NULL,
    default_schedule JSONB NULL,
    default_schedule_preset_id INT REFERENCES lookup_medicine_schedule_presets(id) NULL,
    use_count INT NOT NULL DEFAULT 0,
    is_custom BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (tenant_id, normalized_name)
);

CREATE INDEX idx_medicine_catalog_tenant_use ON medicine_catalog (tenant_id, use_count DESC)
    WHERE deleted_at IS NULL;

CREATE TABLE health_visit_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    health_visit_id UUID REFERENCES health_visits(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NULL,
    size_bytes INT NULL,
    upload_status VARCHAR(20) NOT NULL DEFAULT 'synced'
        CHECK (upload_status IN ('pending', 'synced', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_health_visit_attachments_visit ON health_visit_attachments (health_visit_id)
    WHERE deleted_at IS NULL;

-- Seed common medicines per tenant (lookup IDs resolved by code at runtime in DO block)
DO $$
DECLARE
    v_tenant RECORD;
    v_tablet_id INT;
    v_ml_id INT;
    v_apply_id INT;
    v_after_food_id INT;
    v_before_food_id INT;
    v_not_applicable_id INT;
    v_twice_id INT;
    v_thrice_id INT;
    v_as_needed_id INT;
BEGIN
    SELECT id INTO v_tablet_id FROM lookup_medicine_dose_units WHERE code = 'tablet';
    SELECT id INTO v_ml_id FROM lookup_medicine_dose_units WHERE code = 'ml';
    SELECT id INTO v_apply_id FROM lookup_medicine_dose_units WHERE code = 'apply';
    SELECT id INTO v_after_food_id FROM lookup_medicine_food_timings WHERE code = 'after_food';
    SELECT id INTO v_before_food_id FROM lookup_medicine_food_timings WHERE code = 'before_food';
    SELECT id INTO v_not_applicable_id FROM lookup_medicine_food_timings WHERE code = 'not_applicable';
    SELECT id INTO v_twice_id FROM lookup_medicine_schedule_presets WHERE code = 'twice_daily';
    SELECT id INTO v_thrice_id FROM lookup_medicine_schedule_presets WHERE code = 'thrice_daily';
    SELECT id INTO v_as_needed_id FROM lookup_medicine_schedule_presets WHERE code = 'as_needed';

    FOR v_tenant IN SELECT id FROM tenants WHERE deleted_at IS NULL
    LOOP
        INSERT INTO medicine_catalog (
            tenant_id, name, normalized_name, issue_types,
            default_dose_amount, default_dose_unit_id, default_food_timing_id,
            default_schedule, default_schedule_preset_id, use_count, is_custom
        ) VALUES
            (v_tenant.id, 'Paracetamol 500mg', 'paracetamol 500mg', '["Fever","Head Injury","Injury/fall"]'::jsonb,
             '1', v_tablet_id, v_after_food_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
            (v_tenant.id, 'Ibuprofen 400mg', 'ibuprofen 400mg', '["Fever","Injury/fall","Wound"]'::jsonb,
             '1', v_tablet_id, v_after_food_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
            (v_tenant.id, 'ORS', 'ors', '["Loose Motion","Food poisoning","Illness/Weakness"]'::jsonb,
             '200', v_ml_id, v_after_food_id, '{"morning":true,"noon":true,"evening":true,"night":false}'::jsonb, v_thrice_id, 0, FALSE),
            (v_tenant.id, 'Cough syrup', 'cough syrup', '["Cough","Cold","Throat infection"]'::jsonb,
             '5', v_ml_id, v_after_food_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
            (v_tenant.id, 'Antiseptic cream', 'antiseptic cream', '["Wound","Injury/fall","Scabies","Itching"]'::jsonb,
             '1', v_apply_id, v_not_applicable_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
            (v_tenant.id, 'Antacid', 'antacid', '["Stomach pain","Food poisoning"]'::jsonb,
             '1', v_tablet_id, v_before_food_id, '{"morning":false,"noon":false,"evening":false,"night":false}'::jsonb, v_as_needed_id, 0, FALSE)
        ON CONFLICT (tenant_id, normalized_name) DO NOTHING;
    END LOOP;
END $$;

-- Extend tenant bootstrap with medicine catalog seed
CREATE OR REPLACE FUNCTION seed_default_tenant_data()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_id INT; v_clerk_id INT; v_finance_id INT; v_warden_id INT;
  v_year_start DATE;
  v_year_end DATE;
  v_year_label VARCHAR(20);
  v_tablet_id INT;
  v_ml_id INT;
  v_apply_id INT;
  v_after_food_id INT;
  v_before_food_id INT;
  v_not_applicable_id INT;
  v_twice_id INT;
  v_thrice_id INT;
  v_as_needed_id INT;
BEGIN
  INSERT INTO lookup_admission_categories (tenant_id, value) VALUES
    (NEW.id, 'Orphan'), (NEW.id, 'Single Parent'), (NEW.id, 'BPL'), (NEW.id, 'Destitute')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  UPDATE lookup_admission_categories
  SET labels = jsonb_build_object('en', value, 'kn', value)
  WHERE tenant_id = NEW.id AND labels IS NULL;

  INSERT INTO lookup_document_types (tenant_id, value) VALUES
    (NEW.id, 'Aadhaar Card'), (NEW.id, 'Income Certificate'), (NEW.id, 'BPL Card'),
    (NEW.id, 'Birth Certificate'), (NEW.id, 'Caste Certificate'), (NEW.id, 'School Leaving Certificate')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  UPDATE lookup_document_types
  SET labels = jsonb_build_object('en', value, 'kn', value)
  WHERE tenant_id = NEW.id AND labels IS NULL;

  INSERT INTO lookup_academic_standards (tenant_id, value, sort_order) VALUES
    (NEW.id, '1', 1), (NEW.id, '2', 2), (NEW.id, '3', 3), (NEW.id, '4', 4),
    (NEW.id, '5', 5), (NEW.id, '6', 6), (NEW.id, '7', 7), (NEW.id, '8', 8),
    (NEW.id, '9', 9), (NEW.id, '10', 10), (NEW.id, 'Unassigned', 99)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  UPDATE lookup_academic_standards
  SET labels = jsonb_build_object('en', value, 'kn', value)
  WHERE tenant_id = NEW.id AND labels IS NULL;

  INSERT INTO lookup_sections (tenant_id, value, is_active) VALUES
    (NEW.id, 'A', FALSE), (NEW.id, 'B', FALSE)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_languages (tenant_id, value) VALUES
    (NEW.id, 'Kannada'), (NEW.id, 'Telugu'), (NEW.id, 'Hindi'), (NEW.id, 'Tamil'),
    (NEW.id, 'Urdu'), (NEW.id, 'Marathi'), (NEW.id, 'English'), (NEW.id, 'Other')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  UPDATE lookup_languages
  SET labels = jsonb_build_object('en', value, 'kn', value)
  WHERE tenant_id = NEW.id AND labels IS NULL;

  INSERT INTO lookup_religions (tenant_id, value, labels) VALUES
    (NEW.id, 'Hindu', '{"en":"Hindu","kn":"ಹಿಂದೂ"}'::jsonb),
    (NEW.id, 'Muslim', '{"en":"Muslim","kn":"ಮುಸ್ಲಿಂ"}'::jsonb),
    (NEW.id, 'Christian', '{"en":"Christian","kn":"ಕ್ರಿಶ್ಚಿಯನ್"}'::jsonb),
    (NEW.id, 'Jain', '{"en":"Jain","kn":"ಜೈನ"}'::jsonb),
    (NEW.id, 'Buddhist', '{"en":"Buddhist","kn":"ಬೌದ್ಧ"}'::jsonb),
    (NEW.id, 'Sikh', '{"en":"Sikh","kn":"ಸಿಖ್"}'::jsonb),
    (NEW.id, 'Other', '{"en":"Other","kn":"ಇತರೆ"}'::jsonb)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_social_categories (tenant_id, value, labels) VALUES
    (NEW.id, 'SC', '{"en":"SC","kn":"ಪಂಚಮ ವರ್ಗ"}'::jsonb),
    (NEW.id, 'ST', '{"en":"ST","kn":"ಪ್ರಬಲ ವರ್ಗ"}'::jsonb),
    (NEW.id, 'OBC', '{"en":"OBC","kn":"ಇತರೆ ಹಿಂದುಳಿದ ವರ್ಗ"}'::jsonb),
    (NEW.id, 'General', '{"en":"General","kn":"ಸಾಮಾನ್ಯ"}'::jsonb)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_remark_types (tenant_id, value, labels) VALUES
    (NEW.id, 'Positive', '{"en":"Positive","kn":"ಸಕಾರಾತ್ಮಕ"}'::jsonb),
    (NEW.id, 'Negative', '{"en":"Negative","kn":"ಋಣಾತ್ಮಕ"}'::jsonb),
    (NEW.id, 'Observation', '{"en":"Observation","kn":"ವೀಕ್ಷಣೆ"}'::jsonb)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_remark_categories (tenant_id, value, labels) VALUES
    (NEW.id, 'Academic', '{"en":"Academic","kn":"ಶೈಕ್ಷಣಿಕ"}'::jsonb),
    (NEW.id, 'Behavior', '{"en":"Behavior","kn":"ವರ್ತನೆ"}'::jsonb),
    (NEW.id, 'Hostel', '{"en":"Hostel","kn":"ವಸತಿ"}'::jsonb),
    (NEW.id, 'Discipline', '{"en":"Discipline","kn":"ಶಿಸ್ತು"}'::jsonb),
    (NEW.id, 'Health', '{"en":"Health","kn":"ಆರೋಗ್ಯ"}'::jsonb)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_hostel_attendance_statuses (tenant_id, value, labels, counts_as_present) VALUES
    (NEW.id, 'Present', '{"en":"Present","kn":"ಹಾಜರು"}'::jsonb, TRUE),
    (NEW.id, 'Absent', '{"en":"Absent","kn":"ಗೈರುಹಾಜರು"}'::jsonb, FALSE),
    (NEW.id, 'On Leave', '{"en":"On Leave","kn":"ರಜೆಯಲ್ಲಿ"}'::jsonb, FALSE),
    (NEW.id, 'Late', '{"en":"Late","kn":"ತಡವಾಗಿ"}'::jsonb, TRUE)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_medical_record_types (tenant_id, value, labels) VALUES
    (NEW.id, 'Allergy', '{"en":"Allergy","kn":"ಅಲರ್ಜಿ"}'::jsonb),
    (NEW.id, 'Chronic Condition', '{"en":"Chronic Condition","kn":"ದೀರ್ಘಕಾಲಿಕ ಸ್ಥಿತಿ"}'::jsonb),
    (NEW.id, 'Vaccination', '{"en":"Vaccination","kn":"ಲಸಿಕೆ"}'::jsonb),
    (NEW.id, 'Incident', '{"en":"Incident","kn":"ಘಟನೆ"}'::jsonb),
    (NEW.id, 'Medication', '{"en":"Medication","kn":"ಔಷಧ"}'::jsonb),
    (NEW.id, 'Eye test', '{"en":"Eye test","kn":"ಕಣ್ಣಿನ ಪರೀಕ್ಷೆ"}'::jsonb)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_health_issue_types (tenant_id, value, labels) VALUES
    (NEW.id, 'Fever', '{"en":"Fever","kn":"ಜ್ವರ"}'::jsonb),
    (NEW.id, 'Illness/Weakness', '{"en":"Illness/Weakness","kn":"ಅಸ್ವಸ್ಥತೆ"}'::jsonb),
    (NEW.id, 'Cough', '{"en":"Cough","kn":"ಕೆಮ್ಮು"}'::jsonb),
    (NEW.id, 'Cold', '{"en":"Cold","kn":"ಸಂಬಂಧಿತ"}'::jsonb),
    (NEW.id, 'Stomach pain', '{"en":"Stomach pain","kn":"ಹೊಟ್ಟೆ ನೋವು"}'::jsonb),
    (NEW.id, 'Injury/fall', '{"en":"Injury/fall","kn":"ಗಾಯ/ಬೀಳುವಿಕೆ"}'::jsonb),
    (NEW.id, 'Head Injury', '{"en":"Head Injury","kn":"ತಲೆ ಗಾಯ"}'::jsonb),
    (NEW.id, 'Wound', '{"en":"Wound","kn":"ಗಾಯ"}'::jsonb),
    (NEW.id, 'Scabies', '{"en":"Scabies","kn":"Scabies"}'::jsonb),
    (NEW.id, 'Itching', '{"en":"Itching","kn":"ನೊಂದು"}'::jsonb),
    (NEW.id, 'Food poisoning', '{"en":"Food poisoning","kn":"ಆಹಾರ ವಿಷ"}'::jsonb),
    (NEW.id, 'Loose Motion', '{"en":"Loose Motion","kn":"ವಿರೇಚನ"}'::jsonb),
    (NEW.id, 'Asthma', '{"en":"Asthma","kn":"ಆಸ್ತಮಾ"}'::jsonb),
    (NEW.id, 'Throat infection', '{"en":"Throat infection","kn":"ಗಂಟಲು ಸೋಂಕು"}'::jsonb)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  SELECT id INTO v_tablet_id FROM lookup_medicine_dose_units WHERE code = 'tablet';
  SELECT id INTO v_ml_id FROM lookup_medicine_dose_units WHERE code = 'ml';
  SELECT id INTO v_apply_id FROM lookup_medicine_dose_units WHERE code = 'apply';
  SELECT id INTO v_after_food_id FROM lookup_medicine_food_timings WHERE code = 'after_food';
  SELECT id INTO v_before_food_id FROM lookup_medicine_food_timings WHERE code = 'before_food';
  SELECT id INTO v_not_applicable_id FROM lookup_medicine_food_timings WHERE code = 'not_applicable';
  SELECT id INTO v_twice_id FROM lookup_medicine_schedule_presets WHERE code = 'twice_daily';
  SELECT id INTO v_thrice_id FROM lookup_medicine_schedule_presets WHERE code = 'thrice_daily';
  SELECT id INTO v_as_needed_id FROM lookup_medicine_schedule_presets WHERE code = 'as_needed';

  INSERT INTO medicine_catalog (
    tenant_id, name, normalized_name, issue_types,
    default_dose_amount, default_dose_unit_id, default_food_timing_id,
    default_schedule, default_schedule_preset_id, use_count, is_custom
  ) VALUES
    (NEW.id, 'Paracetamol 500mg', 'paracetamol 500mg', '["Fever","Head Injury","Injury/fall"]'::jsonb,
     '1', v_tablet_id, v_after_food_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
    (NEW.id, 'Ibuprofen 400mg', 'ibuprofen 400mg', '["Fever","Injury/fall","Wound"]'::jsonb,
     '1', v_tablet_id, v_after_food_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
    (NEW.id, 'ORS', 'ors', '["Loose Motion","Food poisoning","Illness/Weakness"]'::jsonb,
     '200', v_ml_id, v_after_food_id, '{"morning":true,"noon":true,"evening":true,"night":false}'::jsonb, v_thrice_id, 0, FALSE),
    (NEW.id, 'Cough syrup', 'cough syrup', '["Cough","Cold","Throat infection"]'::jsonb,
     '5', v_ml_id, v_after_food_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
    (NEW.id, 'Antiseptic cream', 'antiseptic cream', '["Wound","Injury/fall","Scabies","Itching"]'::jsonb,
     '1', v_apply_id, v_not_applicable_id, '{"morning":true,"noon":false,"evening":true,"night":false}'::jsonb, v_twice_id, 0, FALSE),
    (NEW.id, 'Antacid', 'antacid', '["Stomach pain","Food poisoning"]'::jsonb,
     '1', v_tablet_id, v_before_food_id, '{"morning":false,"noon":false,"evening":false,"night":false}'::jsonb, v_as_needed_id, 0, FALSE)
  ON CONFLICT (tenant_id, normalized_name) DO NOTHING;

  INSERT INTO tenant_admission_sequences (tenant_id, prefix, next_number)
  VALUES (NEW.id, 'SJM', 1)
  ON CONFLICT (tenant_id) DO NOTHING;

  v_year_start := make_date(
    CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 6
      THEN EXTRACT(YEAR FROM CURRENT_DATE)::INT
      ELSE EXTRACT(YEAR FROM CURRENT_DATE)::INT - 1
    END,
    6, 1
  );
  v_year_end := (v_year_start + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
  v_year_label := to_char(v_year_start, 'YYYY') || '-' || to_char(v_year_end, 'YY');

  INSERT INTO lookup_academic_years (tenant_id, label, start_date, end_date, is_current)
  VALUES (NEW.id, v_year_label, v_year_start, v_year_end, TRUE)
  ON CONFLICT (tenant_id, label) DO NOTHING;

  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Super Admin') RETURNING id INTO v_super_admin_id;
  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Admissions Clerk') RETURNING id INTO v_clerk_id;
  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Finance') RETURNING id INTO v_finance_id;
  INSERT INTO roles (tenant_id, name) VALUES (NEW.id, 'Teacher/Warden') RETURNING id INTO v_warden_id;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_super_admin_id, id FROM permissions;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_clerk_id, id FROM permissions WHERE action IN
    ('students:read', 'students:create', 'students:edit', 'students:view_sensitive_data',
     'documents:upload', 'documents:view', 'documents:download', 'documents:verify',
     'remarks:read', 'remarks:create', 'remarks:edit',
     'hostel:read', 'hostel_attendance:read',
     'medical:read', 'medical:create', 'medical:edit', 'exports:pdf');

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_finance_id, id FROM permissions WHERE action IN
    ('students:read', 'students:view_sensitive_data', 'documents:view', 'documents:download', 'documents:verify',
     'remarks:read', 'remarks:create', 'remarks:edit',
     'hostel:read', 'hostel_attendance:read',
     'medical:read', 'medical:create', 'exports:pdf');

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_warden_id, id FROM permissions WHERE action IN
    ('students:read',
     'remarks:read', 'remarks:create',
     'hostel:read', 'hostel:manage',
     'hostel_attendance:read', 'hostel_attendance:record',
     'medical:read', 'medical:create', 'exports:pdf');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
