-- Karnataka social category codes for caste/income RD validation (sc, st, cat_*, gm)

DO $$
DECLARE
  v_tenant RECORD;
  v_old_sc INT;
  v_old_st INT;
  v_old_obc INT;
  v_old_gen INT;
  v_new_sc INT;
  v_new_st INT;
  v_new_gm INT;
  v_new_cat1 INT;
BEGIN
  FOR v_tenant IN SELECT id FROM tenants WHERE deleted_at IS NULL
  LOOP
    INSERT INTO lookup_social_categories (tenant_id, value, labels) VALUES
      (v_tenant.id, 'sc', '{"en":"Scheduled Caste (SC)","kn":"ಪಂಚಮ ವರ್ಗ (SC)"}'::jsonb),
      (v_tenant.id, 'st', '{"en":"Scheduled Tribe (ST)","kn":"ಪ್ರಬಲ ವರ್ಗ (ST)"}'::jsonb),
      (v_tenant.id, 'cat_1', '{"en":"Category 1","kn":"ವರ್ಗ 1"}'::jsonb),
      (v_tenant.id, 'cat_2a', '{"en":"Category 2A","kn":"ವರ್ಗ 2A"}'::jsonb),
      (v_tenant.id, 'cat_2b', '{"en":"Category 2B","kn":"ವರ್ಗ 2B"}'::jsonb),
      (v_tenant.id, 'cat_3a', '{"en":"Category 3A","kn":"ವರ್ಗ 3A"}'::jsonb),
      (v_tenant.id, 'cat_3b', '{"en":"Category 3B","kn":"ವರ್ಗ 3B"}'::jsonb),
      (v_tenant.id, 'gm', '{"en":"General Merit (GM)","kn":"ಸಾಮಾನ್ಯ ಮೆರಿಟ್ (GM)"}'::jsonb)
    ON CONFLICT (tenant_id, value) DO NOTHING;

    SELECT id INTO v_old_sc FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'SC' LIMIT 1;
    SELECT id INTO v_old_st FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'ST' LIMIT 1;
    SELECT id INTO v_old_obc FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'OBC' LIMIT 1;
    SELECT id INTO v_old_gen FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'General' LIMIT 1;

    SELECT id INTO v_new_sc FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'sc' LIMIT 1;
    SELECT id INTO v_new_st FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'st' LIMIT 1;
    SELECT id INTO v_new_gm FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'gm' LIMIT 1;
    SELECT id INTO v_new_cat1 FROM lookup_social_categories
      WHERE tenant_id = v_tenant.id AND value = 'cat_1' LIMIT 1;

    IF v_old_sc IS NOT NULL AND v_new_sc IS NOT NULL THEN
      UPDATE student_social_details SET social_category_id = v_new_sc
        WHERE social_category_id = v_old_sc;
    END IF;
    IF v_old_st IS NOT NULL AND v_new_st IS NOT NULL THEN
      UPDATE student_social_details SET social_category_id = v_new_st
        WHERE social_category_id = v_old_st;
    END IF;
    IF v_old_obc IS NOT NULL AND v_new_cat1 IS NOT NULL THEN
      UPDATE student_social_details SET social_category_id = v_new_cat1
        WHERE social_category_id = v_old_obc;
    END IF;
    IF v_old_gen IS NOT NULL AND v_new_gm IS NOT NULL THEN
      UPDATE student_social_details SET social_category_id = v_new_gm
        WHERE social_category_id = v_old_gen;
    END IF;

    UPDATE lookup_social_categories SET is_active = FALSE
      WHERE tenant_id = v_tenant.id AND value IN ('SC', 'ST', 'OBC', 'General');
  END LOOP;
END $$;
