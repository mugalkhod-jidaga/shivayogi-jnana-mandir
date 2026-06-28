-- Academic placement, identity fields, emergency contacts, standard-scoped RBAC foundation

CREATE TABLE lookup_academic_standards (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

CREATE TABLE lookup_sections (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

CREATE TABLE lookup_academic_years (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    label VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, label)
);

CREATE TABLE lookup_languages (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

ALTER TABLE students
    ADD COLUMN admission_date DATE,
    ADD COLUMN mother_tongue_id INT REFERENCES lookup_languages(id),
    ADD COLUMN aadhaar_number VARCHAR(12);

CREATE UNIQUE INDEX idx_students_tenant_aadhaar
    ON students (tenant_id, aadhaar_number)
    WHERE aadhaar_number IS NOT NULL AND deleted_at IS NULL;

UPDATE students SET admission_date = created_at::date WHERE admission_date IS NULL;
ALTER TABLE students ALTER COLUMN admission_date SET NOT NULL;

CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    academic_year_id INT REFERENCES lookup_academic_years(id) NOT NULL,
    standard_id INT REFERENCES lookup_academic_standards(id) NOT NULL,
    section_id INT REFERENCES lookup_sections(id),
    roll_number VARCHAR(20),
    previous_school VARCHAR(255),
    last_class_studied VARCHAR(100),
    is_current BOOLEAN DEFAULT TRUE,
    enrolled_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE UNIQUE INDEX idx_student_enrollments_one_current
    ON student_enrollments (student_id)
    WHERE is_current = TRUE AND deleted_at IS NULL;

CREATE INDEX idx_student_enrollments_standard
    ON student_enrollments (standard_id)
    WHERE deleted_at IS NULL AND is_current = TRUE;

CREATE TABLE student_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_student_emergency_contacts_student
    ON student_emergency_contacts (student_id)
    WHERE deleted_at IS NULL;

CREATE TABLE user_standard_assignments (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
    standard_id INT REFERENCES lookup_academic_standards(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, standard_id)
);

-- Seed new lookup data for all existing tenants
DO $$
DECLARE
    v_tenant RECORD;
    v_year_start DATE;
    v_year_end DATE;
    v_year_label VARCHAR(20);
    v_unassigned_id INT;
BEGIN
    v_year_start := make_date(
        CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 6
            THEN EXTRACT(YEAR FROM CURRENT_DATE)::INT
            ELSE EXTRACT(YEAR FROM CURRENT_DATE)::INT - 1
        END,
        6, 1
    );
    v_year_end := (v_year_start + INTERVAL '1 year' - INTERVAL '1 day')::DATE;
    v_year_label := to_char(v_year_start, 'YYYY') || '-' || to_char(v_year_end, 'YY');

    FOR v_tenant IN SELECT id FROM tenants WHERE deleted_at IS NULL
    LOOP
        INSERT INTO lookup_academic_standards (tenant_id, value, sort_order) VALUES
            (v_tenant.id, '1', 1), (v_tenant.id, '2', 2), (v_tenant.id, '3', 3),
            (v_tenant.id, '4', 4), (v_tenant.id, '5', 5), (v_tenant.id, '6', 6),
            (v_tenant.id, '7', 7), (v_tenant.id, '8', 8), (v_tenant.id, '9', 9),
            (v_tenant.id, '10', 10), (v_tenant.id, 'Unassigned', 99)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        INSERT INTO lookup_sections (tenant_id, value, is_active) VALUES
            (v_tenant.id, 'A', FALSE), (v_tenant.id, 'B', FALSE)
        ON CONFLICT (tenant_id, value) DO NOTHING;

        INSERT INTO lookup_languages (tenant_id, value) VALUES
            (v_tenant.id, 'Kannada'), (v_tenant.id, 'Telugu'), (v_tenant.id, 'Hindi'),
            (v_tenant.id, 'Tamil'), (v_tenant.id, 'Urdu'), (v_tenant.id, 'Marathi'),
            (v_tenant.id, 'English'), (v_tenant.id, 'Other')
        ON CONFLICT (tenant_id, value) DO NOTHING;

        INSERT INTO lookup_academic_years (tenant_id, label, start_date, end_date, is_current)
        VALUES (v_tenant.id, v_year_label, v_year_start, v_year_end, TRUE)
        ON CONFLICT (tenant_id, label) DO NOTHING;

        SELECT id INTO v_unassigned_id
        FROM lookup_academic_standards
        WHERE tenant_id = v_tenant.id AND value = 'Unassigned'
        LIMIT 1;

        IF v_unassigned_id IS NOT NULL THEN
            INSERT INTO student_enrollments (
                student_id, academic_year_id, standard_id, is_current, enrolled_at
            )
            SELECT
                s.id,
                ay.id,
                v_unassigned_id,
                TRUE,
                COALESCE(s.admission_date, s.created_at::date)
            FROM students s
            CROSS JOIN LATERAL (
                SELECT id FROM lookup_academic_years
                WHERE tenant_id = v_tenant.id AND is_current = TRUE
                LIMIT 1
            ) ay
            WHERE s.tenant_id = v_tenant.id
              AND s.deleted_at IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM student_enrollments e
                  WHERE e.student_id = s.id AND e.is_current = TRUE AND e.deleted_at IS NULL
              );
        END IF;
    END LOOP;
END $$;

-- Extend tenant bootstrap trigger for new tenants
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

  INSERT INTO lookup_document_types (tenant_id, value) VALUES
    (NEW.id, 'Aadhaar Card'), (NEW.id, 'Income Certificate'), (NEW.id, 'BPL Card'),
    (NEW.id, 'Birth Certificate'), (NEW.id, 'Caste Certificate'), (NEW.id, 'School Leaving Certificate')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_academic_standards (tenant_id, value, sort_order) VALUES
    (NEW.id, '1', 1), (NEW.id, '2', 2), (NEW.id, '3', 3), (NEW.id, '4', 4),
    (NEW.id, '5', 5), (NEW.id, '6', 6), (NEW.id, '7', 7), (NEW.id, '8', 8),
    (NEW.id, '9', 9), (NEW.id, '10', 10), (NEW.id, 'Unassigned', 99)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_sections (tenant_id, value, is_active) VALUES
    (NEW.id, 'A', FALSE), (NEW.id, 'B', FALSE)
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_languages (tenant_id, value) VALUES
    (NEW.id, 'Kannada'), (NEW.id, 'Telugu'), (NEW.id, 'Hindi'), (NEW.id, 'Tamil'),
    (NEW.id, 'Urdu'), (NEW.id, 'Marathi'), (NEW.id, 'English'), (NEW.id, 'Other')
  ON CONFLICT (tenant_id, value) DO NOTHING;

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
