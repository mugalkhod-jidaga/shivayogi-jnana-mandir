-- Global permissions + blood groups; tenant trigger for lookups, roles, RBAC
-- See PROJECT_CONTEXT.md Section 10

INSERT INTO permissions (action, description) VALUES
  ('students:read', 'View basic student profiles'),
  ('students:create', 'Create new student records'),
  ('students:edit', 'Edit basic student profiles'),
  ('students:soft_delete', 'Deactivate student records'),
  ('students:view_sensitive_data', 'View family income and guardian details'),
  ('documents:upload', 'Upload verification documents'),
  ('documents:view', 'View uploaded documents'),
  ('documents:download', 'Download documents'),
  ('documents:verify', 'Approve or reject documents'),
  ('audit_logs:view', 'View system audit trails'),
  ('system:manage_roles', 'Create and manage staff accounts'),
  ('system:manage_lookups', 'Manage dropdown lists'),
  ('dashboard:view', 'View KPI dashboard')
ON CONFLICT (action) DO NOTHING;

INSERT INTO lookup_blood_groups (value) VALUES
  ('O+'), ('O-'), ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-')
ON CONFLICT (value) DO NOTHING;

DROP TRIGGER IF EXISTS trg_seed_tenant_lookups ON tenants;
DROP FUNCTION IF EXISTS seed_default_tenant_lookups();

CREATE OR REPLACE FUNCTION seed_default_tenant_data()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_id INT; v_clerk_id INT; v_finance_id INT; v_warden_id INT;
BEGIN
  INSERT INTO lookup_admission_categories (tenant_id, value) VALUES
    (NEW.id, 'Orphan'), (NEW.id, 'Single Parent'), (NEW.id, 'BPL'), (NEW.id, 'Destitute')
  ON CONFLICT (tenant_id, value) DO NOTHING;

  INSERT INTO lookup_document_types (tenant_id, value) VALUES
    (NEW.id, 'Aadhaar Card'), (NEW.id, 'Income Certificate'), (NEW.id, 'BPL Card'),
    (NEW.id, 'Birth Certificate'), (NEW.id, 'Caste Certificate'), (NEW.id, 'School Leaving Certificate')
  ON CONFLICT (tenant_id, value) DO NOTHING;

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

CREATE TRIGGER trg_seed_tenant_data
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION seed_default_tenant_data();
