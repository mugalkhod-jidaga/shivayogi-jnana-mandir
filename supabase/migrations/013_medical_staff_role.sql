-- Medical Staff role: infirmary-only access (nurse / doctor)

CREATE OR REPLACE FUNCTION assign_medical_staff_role(p_tenant_id INT)
RETURNS VOID AS $$
DECLARE
  v_medical_id INT;
BEGIN
  INSERT INTO roles (tenant_id, name)
  VALUES (p_tenant_id, 'Medical Staff')
  ON CONFLICT (tenant_id, name) DO NOTHING;

  SELECT id INTO v_medical_id
  FROM roles
  WHERE tenant_id = p_tenant_id AND name = 'Medical Staff';

  IF v_medical_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT v_medical_id, p.id
  FROM permissions p
  WHERE p.action IN (
    'medical:read',
    'medical:create',
    'medical:edit'
  )
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Existing tenants
SELECT assign_medical_staff_role(id) FROM tenants;

-- New tenants (runs after seed_default_tenant_data)
CREATE OR REPLACE FUNCTION trg_assign_medical_staff_role()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM assign_medical_staff_role(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_medical_staff_role ON tenants;
CREATE TRIGGER trg_tenant_medical_staff_role
AFTER INSERT ON tenants
FOR EACH ROW EXECUTE FUNCTION trg_assign_medical_staff_role();
