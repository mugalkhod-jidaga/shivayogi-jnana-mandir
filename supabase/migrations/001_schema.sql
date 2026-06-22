-- Divine Trust ERP — Phase 1 schema
-- See PROJECT_CONTEXT.md Section 4

CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'Active',
    must_reset_password BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (tenant_id, phone_number)
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    UNIQUE (tenant_id, name)
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    action VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE lookup_blood_groups (
    id SERIAL PRIMARY KEY,
    value VARCHAR(5) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE lookup_admission_categories (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

CREATE TABLE lookup_document_types (
    id SERIAL PRIMARY KEY,
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    value VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, value)
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id) NOT NULL,
    admission_number VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    dob DATE NOT NULL,
    gender VARCHAR(20) DEFAULT 'Male',
    photo_url TEXT NULL,
    blood_group_id INT REFERENCES lookup_blood_groups(id),
    admission_category_id INT REFERENCES lookup_admission_categories(id),
    medical_alerts TEXT,
    status VARCHAR(50) DEFAULT 'Active',
    status_reason TEXT NULL,
    status_changed_at TIMESTAMP NULL,
    created_by UUID REFERENCES user_profiles(id),
    updated_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE (tenant_id, admission_number)
);

CREATE TABLE student_family_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE UNIQUE,
    father_name VARCHAR(100),
    mother_name VARCHAR(100),
    guardian_name VARCHAR(100),
    parent_status VARCHAR(50) NOT NULL,
    annual_income NUMERIC,
    primary_contact VARCHAR(20) NOT NULL,
    house_details VARCHAR(255),
    village_town VARCHAR(150) NOT NULL,
    taluk_mandal VARCHAR(150) NOT NULL,
    district VARCHAR(150) NOT NULL,
    state VARCHAR(150) DEFAULT 'Karnataka',
    pincode VARCHAR(10) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type_id INT REFERENCES lookup_document_types(id) NOT NULL,
    file_url TEXT NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INT,
    status VARCHAR(50) DEFAULT 'Pending Review',
    expiry_date DATE NULL,
    uploaded_by UUID REFERENCES user_profiles(id),
    verified_by UUID REFERENCES user_profiles(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INT REFERENCES tenants(id),
    user_id UUID REFERENCES user_profiles(id),
    entity_type VARCHAR(100),
    entity_id UUID,
    action_type VARCHAR(50),
    metadata JSONB NULL,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
