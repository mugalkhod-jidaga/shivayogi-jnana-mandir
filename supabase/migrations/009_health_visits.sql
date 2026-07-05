-- Phase 2+: Health / Infirmary visit tracking (integrated from student-tracker)

-- ---------------------------------------------------------------------------
-- Lookups (global + tenant-scoped)
-- ---------------------------------------------------------------------------
CREATE TABLE lookup_health_severities (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    value VARCHAR(50) NOT NULL,
    labels JSONB NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE lookup_health_issue_types (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL,
    labels JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, value)
);

CREATE TABLE lookup_medicine_food_timings (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    value VARCHAR(80) NOT NULL,
    labels JSONB NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE lookup_medicine_dose_units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    value VARCHAR(80) NOT NULL,
    dose_group VARCHAR(30) NOT NULL,
    labels JSONB NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE lookup_medicine_schedule_presets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    value VARCHAR(80) NOT NULL,
    labels JSONB NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO lookup_health_severities (code, value, labels, sort_order) VALUES
    ('normal', 'Normal', '{"en":"Normal","kn":"ಸಾಮಾನ್ಯ"}'::jsonb, 1),
    ('medium', 'Medium', '{"en":"Medium","kn":"ಮಧ್ಯಮ"}'::jsonb, 2),
    ('urgent', 'Urgent', '{"en":"Urgent","kn":"ತುರ್ತು"}'::jsonb, 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lookup_medicine_food_timings (code, value, labels, sort_order) VALUES
    ('before_food', 'Before food', '{"en":"Before food","kn":"ಆಹಾರಕ್ಕೂ ಮುಂಚೆ"}'::jsonb, 1),
    ('after_food', 'After food', '{"en":"After food","kn":"ಆಹಾರದ ನಂತರ"}'::jsonb, 2),
    ('with_food', 'With food', '{"en":"With food","kn":"ಆಹಾರದ ಜೊತೆ"}'::jsonb, 3),
    ('empty_stomach', 'Empty stomach', '{"en":"Empty stomach","kn":"ಖಾಲಿ ಹೊಟ್ಟೆ"}'::jsonb, 4),
    ('not_applicable', 'Not applicable', '{"en":"Not applicable (cream/bandage)","kn":"ಅನ್ವಯಿಸುವುದಿಲ್ಲ"}'::jsonb, 5)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lookup_medicine_dose_units (code, value, dose_group, labels, sort_order) VALUES
    ('tablet', 'Tablet(s)', 'Oral', '{"en":"Tablet(s)","kn":"ಗುಳಿಗೆ"}'::jsonb, 1),
    ('capsule', 'Capsule(s)', 'Oral', '{"en":"Capsule(s)","kn":"ಕ್ಯಾಪ್ಸುಲ್"}'::jsonb, 2),
    ('sachet', 'Sachet', 'Oral', '{"en":"Sachet","kn":"ಸachet"}'::jsonb, 3),
    ('ml', 'ml (millilitre)', 'Liquid', '{"en":"ml","kn":"ml"}'::jsonb, 4),
    ('tsp', 'Teaspoon', 'Liquid', '{"en":"Teaspoon","kn":"ಚಮಚ"}'::jsonb, 5),
    ('spoon', 'Spoon', 'Liquid', '{"en":"Spoon","kn":"ಚಮಚ"}'::jsonb, 6),
    ('drops', 'Drops', 'Liquid', '{"en":"Drops","kn":" ಹನಿಗಳು"}'::jsonb, 7),
    ('apply', 'Apply (thin layer)', 'Topical', '{"en":"Apply","kn":"ಅಳವಡಿಸಿ"}'::jsonb, 8),
    ('tube', 'Tube', 'Topical', '{"en":"Tube","kn":"ಟ್ಯೂಬ್"}'::jsonb, 9),
    ('gel', 'Gel', 'Topical', '{"en":"Gel","kn":"ಜೆಲ್"}'::jsonb, 10),
    ('cream', 'Cream', 'Topical', '{"en":"Cream","kn":"ಕ್ರೀಮ್"}'::jsonb, 11),
    ('bandage', 'Bandage / dressing', 'Topical', '{"en":"Bandage","kn":"ಬ್ಯಾಂಡೇಜ್"}'::jsonb, 12),
    ('puff', 'Puff (inhaler)', 'Other', '{"en":"Puff","kn":"Puff"}'::jsonb, 13),
    ('as_directed', 'As directed', 'Other', '{"en":"As directed","kn":"ನಿರ್ದೇಶಿಸಿದಂತೆ"}'::jsonb, 14)
ON CONFLICT (code) DO NOTHING;

INSERT INTO lookup_medicine_schedule_presets (code, value, labels, sort_order) VALUES
    ('once_morning', 'Once (morning)', '{"en":"Once (morning)","kn":"ಒಮ್ಮೆ (ಬೆಳಿಗ್ಗೆ)"}'::jsonb, 1),
    ('twice_daily', 'Twice daily', '{"en":"Twice daily","kn":"ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ"}'::jsonb, 2),
    ('thrice_daily', 'Thrice daily', '{"en":"Thrice daily","kn":"ದಿನಕ್ಕೆ ಮೂರು ಬಾರಿ"}'::jsonb, 3),
    ('as_needed', 'As needed (SOS)', '{"en":"As needed (SOS)","kn":"ಅಗತ್ಯವಿದ್ದಾಗ"}'::jsonb, 4),
    ('custom', 'Custom', '{"en":"Custom","kn":"ಕಸ್ಟಮ್"}'::jsonb, 5)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Student health status extension
-- ---------------------------------------------------------------------------
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'healthy'
        CHECK (health_status IN ('healthy', 'sick', 'recovering'));

-- ---------------------------------------------------------------------------
-- Health visits (infirmary records)
-- ---------------------------------------------------------------------------
CREATE TABLE health_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    visit_date DATE NOT NULL,
    issue_type VARCHAR(500) NOT NULL,
    symptoms TEXT NOT NULL,
    severity_id INT REFERENCES lookup_health_severities(id) NOT NULL,
    treated_by VARCHAR(255) NULL,
    notes TEXT NULL,
    temperature VARCHAR(20) NULL,
    blood_pressure VARCHAR(20) NULL,
    oxygen_level VARCHAR(20) NULL,
    created_by UUID REFERENCES user_profiles(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_health_visits_tenant ON health_visits (tenant_id, visit_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_health_visits_student ON health_visits (student_id, visit_date DESC) WHERE deleted_at IS NULL;

CREATE TABLE health_visit_medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    health_visit_id UUID REFERENCES health_visits(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    medicine_name VARCHAR(255) NOT NULL,
    dose_amount VARCHAR(20) NOT NULL,
    dose_unit_id INT REFERENCES lookup_medicine_dose_units(id) NOT NULL,
    treatment_doses VARCHAR(100) NULL,
    food_timing_id INT REFERENCES lookup_medicine_food_timings(id) NOT NULL,
    schedule JSONB NOT NULL DEFAULT '{"morning":false,"noon":false,"evening":false,"night":false}'::jsonb,
    schedule_preset_id INT REFERENCES lookup_medicine_schedule_presets(id) NOT NULL,
    medicine_notes TEXT NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_health_visit_medicines_visit ON health_visit_medicines (health_visit_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_health_visit_medicines_student ON health_visit_medicines (student_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Seed issue types + permissions for existing tenants
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_tenant RECORD;
BEGIN
    FOR v_tenant IN SELECT id FROM tenants WHERE deleted_at IS NULL
    LOOP
        INSERT INTO lookup_health_issue_types (tenant_id, value, labels) VALUES
            (v_tenant.id, 'Fever', '{"en":"Fever","kn":"ಜ್ವರ"}'::jsonb),
            (v_tenant.id, 'Illness/Weakness', '{"en":"Illness/Weakness","kn":"ಅಸ್ವಸ್ಥತೆ"}'::jsonb),
            (v_tenant.id, 'Cough', '{"en":"Cough","kn":"ಕೆಮ್ಮು"}'::jsonb),
            (v_tenant.id, 'Cold', '{"en":"Cold","kn":"ಸಂಬಂಧಿತ"}'::jsonb),
            (v_tenant.id, 'Stomach pain', '{"en":"Stomach pain","kn":"ಹೊಟ್ಟೆ ನೋವು"}'::jsonb),
            (v_tenant.id, 'Injury/fall', '{"en":"Injury/fall","kn":"ಗಾಯ/ಬೀಳುವಿಕೆ"}'::jsonb),
            (v_tenant.id, 'Head Injury', '{"en":"Head Injury","kn":"ತಲೆ ಗಾಯ"}'::jsonb),
            (v_tenant.id, 'Wound', '{"en":"Wound","kn":"ಗಾಯ"}'::jsonb),
            (v_tenant.id, 'Scabies', '{"en":"Scabies","kn":"Scabies"}'::jsonb),
            (v_tenant.id, 'Itching', '{"en":"Itching","kn":"ನೊಂದು"}'::jsonb),
            (v_tenant.id, 'Food poisoning', '{"en":"Food poisoning","kn":"ಆಹಾರ ವಿಷ"}'::jsonb),
            (v_tenant.id, 'Loose Motion', '{"en":"Loose Motion","kn":"ವಿರೇಚನ"}'::jsonb),
            (v_tenant.id, 'Asthma', '{"en":"Asthma","kn":"ಆಸ್ತಮಾ"}'::jsonb),
            (v_tenant.id, 'Throat infection', '{"en":"Throat infection","kn":"ಗಂಟಲು ಸೋಂಕು"}'::jsonb)
        ON CONFLICT (tenant_id, value) DO NOTHING;
    END LOOP;
END $$;

-- Extend tenant bootstrap trigger with health issue types
CREATE OR REPLACE FUNCTION seed_default_tenant_data()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_id INT; v_clerk_id INT; v_finance_id INT; v_warden_id INT;
  v_year_start DATE;
  v_year_end DATE;
  v_year_label VARCHAR(20);
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
    (NEW.id, 'Medication', '{"en":"Medication","kn":"ಔಷಧ"}'::jsonb)
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
