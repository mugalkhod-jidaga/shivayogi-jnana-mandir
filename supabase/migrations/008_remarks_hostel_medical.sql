-- Phase 2: student remarks, hostel, hostel attendance, basic medical records

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permissions (action, description) VALUES
  ('remarks:read', 'View student remarks'),
  ('remarks:create', 'Add student remarks'),
  ('remarks:edit', 'Edit own student remarks'),
  ('remarks:manage', 'Manage all student remarks'),
  ('hostel:read', 'View hostel blocks, rooms, and allocations'),
  ('hostel:manage', 'Manage hostel blocks, rooms, and allocations'),
  ('hostel_attendance:read', 'View hostel attendance'),
  ('hostel_attendance:record', 'Record hostel attendance'),
  ('medical:read', 'View student medical records'),
  ('medical:create', 'Add student medical records'),
  ('medical:edit', 'Edit student medical records'),
  ('exports:pdf', 'Download PDF exports')
ON CONFLICT (action) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Remark lookups
-- ---------------------------------------------------------------------------
CREATE TABLE lookup_remark_types (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(50) NOT NULL,
    labels JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, value)
);

CREATE TABLE lookup_remark_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(50) NOT NULL,
    labels JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, value)
);

CREATE TABLE student_remarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    created_by UUID REFERENCES user_profiles(id) NOT NULL,
    remark_type_id INT REFERENCES lookup_remark_types(id) NOT NULL,
    category_id INT REFERENCES lookup_remark_categories(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NULL,
    tags TEXT[] NULL,
    is_flagged BOOLEAN DEFAULT FALSE,
    follow_up_note TEXT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_student_remarks_tenant ON student_remarks (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_remarks_student ON student_remarks (student_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_remarks_type ON student_remarks (remark_type_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_student_remarks_category ON student_remarks (category_id) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Hostel
-- ---------------------------------------------------------------------------
CREATE TABLE hostel_blocks (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (tenant_id, name)
);

CREATE TABLE hostel_rooms (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    block_id INT REFERENCES hostel_blocks(id) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 1 CHECK (capacity >= 1),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (tenant_id, block_id, room_number)
);

CREATE TABLE room_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    room_id INT REFERENCES hostel_rooms(id) NOT NULL,
    allocated_from DATE NOT NULL,
    allocated_to DATE NULL,
    notes TEXT NULL,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE UNIQUE INDEX idx_room_allocations_active_student
    ON room_allocations (student_id)
    WHERE allocated_to IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_room_allocations_room ON room_allocations (room_id) WHERE deleted_at IS NULL AND allocated_to IS NULL;

-- ---------------------------------------------------------------------------
-- Hostel attendance (residential only — not school attendance)
-- ---------------------------------------------------------------------------
CREATE TABLE lookup_hostel_attendance_statuses (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(50) NOT NULL,
    labels JSONB NULL,
    counts_as_present BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, value)
);

CREATE TABLE hostel_attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    attendance_date DATE NOT NULL,
    block_id INT REFERENCES hostel_blocks(id) NULL,
    taken_by UUID REFERENCES user_profiles(id) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE UNIQUE INDEX idx_hostel_attendance_session_day_block
    ON hostel_attendance_sessions (tenant_id, attendance_date, block_id)
    WHERE deleted_at IS NULL;

CREATE TABLE hostel_attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    session_id UUID REFERENCES hostel_attendance_sessions(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    status_id INT REFERENCES lookup_hostel_attendance_statuses(id) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (session_id, student_id)
);

CREATE INDEX idx_hostel_attendance_records_student
    ON hostel_attendance_records (student_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Basic medical records
-- ---------------------------------------------------------------------------
CREATE TABLE lookup_medical_record_types (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL,
    labels JSONB NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE (tenant_id, value)
);

CREATE TABLE student_medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    student_id UUID REFERENCES students(id) NOT NULL,
    record_type_id INT REFERENCES lookup_medical_record_types(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    recorded_on DATE NOT NULL,
    is_ongoing BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES user_profiles(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_student_medical_records_student
    ON student_medical_records (student_id, recorded_on DESC)
    WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------------------
-- Seed lookups + permissions for existing tenants
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    v_tenant RECORD;
    v_super_admin_id INT;
    v_clerk_id INT;
    v_finance_id INT;
    v_warden_id INT;
BEGIN
    FOR v_tenant IN SELECT id FROM tenants WHERE deleted_at IS NULL
    LOOP
        INSERT INTO lookup_remark_types (tenant_id, value, labels) VALUES
            (v_tenant.id, 'Positive', '{"en":"Positive","kn":"ಸಕಾರಾತ್ಮಕ"}'::jsonb),
            (v_tenant.id, 'Negative', '{"en":"Negative","kn":"ಋಣಾತ್ಮಕ"}'::jsonb),
            (v_tenant.id, 'Observation', '{"en":"Observation","kn":"ವೀಕ್ಷಣೆ"}'::jsonb)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        INSERT INTO lookup_remark_categories (tenant_id, value, labels) VALUES
            (v_tenant.id, 'Academic', '{"en":"Academic","kn":"ಶೈಕ್ಷಣಿಕ"}'::jsonb),
            (v_tenant.id, 'Behavior', '{"en":"Behavior","kn":"ವರ್ತನೆ"}'::jsonb),
            (v_tenant.id, 'Hostel', '{"en":"Hostel","kn":"ವಸತಿ"}'::jsonb),
            (v_tenant.id, 'Discipline', '{"en":"Discipline","kn":"ಶಿಸ್ತು"}'::jsonb),
            (v_tenant.id, 'Health', '{"en":"Health","kn":"ಆರೋಗ್ಯ"}'::jsonb)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        INSERT INTO lookup_hostel_attendance_statuses (tenant_id, value, labels, counts_as_present) VALUES
            (v_tenant.id, 'Present', '{"en":"Present","kn":"ಹಾಜರು"}'::jsonb, TRUE),
            (v_tenant.id, 'Absent', '{"en":"Absent","kn":"ಗೈರುಹಾಜರು"}'::jsonb, FALSE),
            (v_tenant.id, 'On Leave', '{"en":"On Leave","kn":"ರಜೆಯಲ್ಲಿ"}'::jsonb, FALSE),
            (v_tenant.id, 'Late', '{"en":"Late","kn":"ತಡವಾಗಿ"}'::jsonb, TRUE)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        INSERT INTO lookup_medical_record_types (tenant_id, value, labels) VALUES
            (v_tenant.id, 'Allergy', '{"en":"Allergy","kn":"ಅಲರ್ಜಿ"}'::jsonb),
            (v_tenant.id, 'Chronic Condition', '{"en":"Chronic Condition","kn":"ದೀರ್ಘಕಾಲಿಕ ಸ್ಥಿತಿ"}'::jsonb),
            (v_tenant.id, 'Vaccination', '{"en":"Vaccination","kn":"ಲಸಿಕೆ"}'::jsonb),
            (v_tenant.id, 'Incident', '{"en":"Incident","kn":"ಘಟನೆ"}'::jsonb),
            (v_tenant.id, 'Medication', '{"en":"Medication","kn":"ಔಷಧ"}'::jsonb)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        SELECT id INTO v_super_admin_id FROM roles WHERE tenant_id = v_tenant.id AND name = 'Super Admin';
        SELECT id INTO v_clerk_id FROM roles WHERE tenant_id = v_tenant.id AND name = 'Admissions Clerk';
        SELECT id INTO v_finance_id FROM roles WHERE tenant_id = v_tenant.id AND name = 'Finance';
        SELECT id INTO v_warden_id FROM roles WHERE tenant_id = v_tenant.id AND name = 'Teacher/Warden';

        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_super_admin_id, id FROM permissions
        WHERE action IN (
            'remarks:read', 'remarks:create', 'remarks:edit', 'remarks:manage',
            'hostel:read', 'hostel:manage',
            'hostel_attendance:read', 'hostel_attendance:record',
            'medical:read', 'medical:create', 'medical:edit',
            'exports:pdf'
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_clerk_id, id FROM permissions
        WHERE action IN (
            'remarks:read', 'remarks:create', 'remarks:edit',
            'hostel:read', 'hostel_attendance:read',
            'medical:read', 'medical:create', 'medical:edit',
            'exports:pdf'
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_finance_id, id FROM permissions
        WHERE action IN (
            'remarks:read', 'remarks:create', 'remarks:edit',
            'hostel:read', 'hostel_attendance:read',
            'medical:read', 'medical:create',
            'exports:pdf'
        )
        ON CONFLICT DO NOTHING;

        INSERT INTO role_permissions (role_id, permission_id)
        SELECT v_warden_id, id FROM permissions
        WHERE action IN (
            'remarks:read', 'remarks:create',
            'hostel:read', 'hostel:manage',
            'hostel_attendance:read', 'hostel_attendance:record',
            'medical:read', 'medical:create',
            'exports:pdf'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Extend tenant bootstrap trigger
-- ---------------------------------------------------------------------------
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
