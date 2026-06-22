import 'dotenv/config';

import { supabase } from '../src/config/supabase';

const TENANT_ID = Number(process.env.BOOTSTRAP_TENANT_ID ?? 1);
const ADMIN_PHONE = process.env.BOOTSTRAP_ADMIN_PHONE;
const ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const ADMIN_FIRST_NAME = process.env.BOOTSTRAP_ADMIN_FIRST_NAME ?? 'Admin';
const ADMIN_LAST_NAME = process.env.BOOTSTRAP_ADMIN_LAST_NAME ?? 'User';

async function bootstrap(): Promise<void> {
  if (!ADMIN_PHONE || !ADMIN_PASSWORD) {
    throw new Error(
      'Set BOOTSTRAP_ADMIN_PHONE and BOOTSTRAP_ADMIN_PASSWORD in backend/.env before running.',
    );
  }

  const { data: authUser, error } = await supabase.auth.admin.createUser({
    phone: ADMIN_PHONE,
    password: ADMIN_PASSWORD,
    phone_confirm: true,
  });
  if (error) throw error;

  const { data: role, error: roleError } = await supabase
    .from('roles')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('name', 'Super Admin')
    .single();

  if (roleError || !role) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw new Error('Super Admin role not found — run tenant INSERT and migrations first');
  }

  const { error: profileError } = await supabase.from('user_profiles').insert({
    id: authUser.user.id,
    tenant_id: TENANT_ID,
    first_name: ADMIN_FIRST_NAME,
    last_name: ADMIN_LAST_NAME,
    phone_number: ADMIN_PHONE,
    must_reset_password: true,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw profileError;
  }

  const { error: userRoleError } = await supabase
    .from('user_roles')
    .insert({ user_id: authUser.user.id, role_id: role.id });

  if (userRoleError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw userRoleError;
  }

  console.log('Bootstrap complete. Share the temp password with the admin out of band.');
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
