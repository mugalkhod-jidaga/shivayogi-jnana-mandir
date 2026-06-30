-- SATS ID, social/caste details, SJM admission sequence, previous school address, lookup i18n labels

CREATE TABLE tenant_admission_sequences (
    tenant_id INT PRIMARY KEY REFERENCES tenants(id) NOT NULL,
    prefix VARCHAR(10) NOT NULL DEFAULT 'SJM',
    next_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE students
    ADD COLUMN sats_id VARCHAR(9),
    ADD COLUMN sats_transfer_status VARCHAR(50) DEFAULT 'Pending';

CREATE UNIQUE INDEX idx_students_tenant_sats
    ON students (tenant_id, sats_id)
    WHERE sats_id IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE lookup_religions (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL,
    labels JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

CREATE TABLE lookup_social_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(50) NOT NULL,
    labels JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

CREATE TABLE student_social_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE NOT NULL,
    religion_id INT REFERENCES lookup_religions(id),
    social_category_id INT REFERENCES lookup_social_categories(id),
    caste VARCHAR(100),
    sub_caste VARCHAR(100),
    rd_number VARCHAR(50),
    rd_number_secondary VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE student_enrollments
    ADD COLUMN previous_school_address TEXT;

-- Multilingual labels on existing tenant lookups (English canonical value preserved)
ALTER TABLE lookup_admission_categories ADD COLUMN IF NOT EXISTS labels JSONB;
ALTER TABLE lookup_document_types ADD COLUMN IF NOT EXISTS labels JSONB;
ALTER TABLE lookup_academic_standards ADD COLUMN IF NOT EXISTS labels JSONB;
ALTER TABLE lookup_sections ADD COLUMN IF NOT EXISTS labels JSONB;
ALTER TABLE lookup_languages ADD COLUMN IF NOT EXISTS labels JSONB;

UPDATE lookup_admission_categories SET labels = jsonb_build_object('en', value, 'kn', value) WHERE labels IS NULL;
UPDATE lookup_document_types SET labels = jsonb_build_object('en', value, 'kn', value) WHERE labels IS NULL;
UPDATE lookup_academic_standards SET labels = jsonb_build_object('en', value, 'kn', value) WHERE labels IS NULL;
UPDATE lookup_sections SET labels = jsonb_build_object('en', value, 'kn', value) WHERE labels IS NULL;
UPDATE lookup_languages SET labels = jsonb_build_object('en', value, 'kn', value) WHERE labels IS NULL;

DO $$
DECLARE
    v_tenant RECORD;
    v_max_num INT;
BEGIN
    FOR v_tenant IN SELECT id FROM tenants WHERE deleted_at IS NULL
    LOOP
        INSERT INTO lookup_religions (tenant_id, value, labels) VALUES
            (v_tenant.id, 'Hindu', '{"en":"Hindu","kn":"ಹಿಂದೂ"}'::jsonb),
            (v_tenant.id, 'Muslim', '{"en":"Muslim","kn":"ಮುಸ್ಲಿಂ"}'::jsonb),
            (v_tenant.id, 'Christian', '{"en":"Christian","kn":"ಕ್ರಿಶ್ಚಿಯನ್"}'::jsonb),
            (v_tenant.id, 'Jain', '{"en":"Jain","kn":"ಜೈನ"}'::jsonb),
            (v_tenant.id, 'Buddhist', '{"en":"Buddhist","kn":"ಬೌದ್ಧ"}'::jsonb),
            (v_tenant.id, 'Sikh', '{"en":"Sikh","kn":"ಸಿಖ್"}'::jsonb),
            (v_tenant.id, 'Other', '{"en":"Other","kn":"ಇತರೆ"}'::jsonb)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        INSERT INTO lookup_social_categories (tenant_id, value, labels) VALUES
            (v_tenant.id, 'SC', '{"en":"SC","kn":"ಪಂಚಮ ವರ್ಗ"}'::jsonb),
            (v_tenant.id, 'ST', '{"en":"ST","kn":"ಪ್ರಬಲ ವರ್ಗ"}'::jsonb),
            (v_tenant.id, 'OBC', '{"en":"OBC","kn":"ಇತರೆ ಹಿಂದುಳಿದ ವರ್ಗ"}'::jsonb),
            (v_tenant.id, 'General', '{"en":"General","kn":"ಸಾಮಾನ್ಯ"}'::jsonb)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        SELECT COALESCE(MAX(
            NULLIF(regexp_replace(admission_number, '^SJM', ''), '')::INT
        ), 0) INTO v_max_num
        FROM students
        WHERE tenant_id = v_tenant.id
          AND admission_number ~ '^SJM[0-9]+$';

        INSERT INTO tenant_admission_sequences (tenant_id, prefix, next_number)
        VALUES (v_tenant.id, 'SJM', GREATEST(v_max_num + 1, 1))
        ON CONFLICT (tenant_id) DO UPDATE
        SET next_number = GREATEST(
            tenant_admission_sequences.next_number,
            EXCLUDED.next_number
        );
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION allocate_admission_number(p_tenant_id INT)
RETURNS TEXT AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_num INT;
    v_formatted TEXT;
BEGIN
    INSERT INTO tenant_admission_sequences (tenant_id, prefix, next_number)
    VALUES (p_tenant_id, 'SJM', 1)
    ON CONFLICT (tenant_id) DO NOTHING;

    UPDATE tenant_admission_sequences
    SET next_number = next_number + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = p_tenant_id
    RETURNING prefix, next_number - 1 INTO v_prefix, v_num;

    v_formatted := v_prefix || lpad(v_num::TEXT, 5, '0');
    RETURN v_formatted;
END;
$$ LANGUAGE plpgsql;

-- Extend tenant bootstrap for religions, social categories, admission sequence
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
     'documents:upload', 'documents:view', 'documents:download', 'documents:verify');

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_finance_id, id FROM permissions WHERE action IN
    ('students:read', 'students:view_sensitive_data', 'documents:view', 'documents:download', 'documents:verify');

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_warden_id, id FROM permissions WHERE action IN ('students:read');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
