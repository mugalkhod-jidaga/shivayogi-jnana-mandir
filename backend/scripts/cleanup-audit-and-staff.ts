/**
 * Purges audit logs and removes all staff except the bootstrap admin.
 *
 * Usage:
 *   npm run cleanup:audit-staff -- --confirm
 *
 * Keeps user with phone +919980201998 (or KEEP_ADMIN_PHONE env override).
 * Requires backend/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import 'dotenv/config';

import { supabase } from '../src/config/supabase';

const TENANT_ID = Number(process.env.BOOTSTRAP_TENANT_ID ?? 1);
const KEEP_ADMIN_PHONE = process.env.KEEP_ADMIN_PHONE ?? '+919980201998';
const confirmed = process.argv.includes('--confirm');

async function reassignUserRefs(fromUserId: string, toUserId: string): Promise<void> {
  const tables: { table: string; columns: string[] }[] = [
    { table: 'students', columns: ['created_by', 'updated_by'] },
    { table: 'student_documents', columns: ['uploaded_by', 'verified_by'] },
    { table: 'student_remarks', columns: ['created_by'] },
    { table: 'student_medical_records', columns: ['created_by'] },
    { table: 'health_visits', columns: ['created_by'] },
    { table: 'hostel_attendance_sessions', columns: ['created_by'] },
    { table: 'hostel_attendance_records', columns: ['taken_by'] },
  ];

  for (const { table, columns } of tables) {
    for (const column of columns) {
      const { error } = await supabase
        .from(table)
        .update({ [column]: toUserId })
        .eq(column, fromUserId);

      if (error && !error.message.includes('does not exist')) {
        console.warn(`  warn: ${table}.${column}: ${error.message}`);
      }
    }
  }
}

async function removeStaffUser(userId: string, adminId: string): Promise<void> {
  await reassignUserRefs(userId, adminId);

  await supabase.from('user_roles').delete().eq('user_id', userId);
  await supabase.from('user_standard_assignments').delete().eq('user_id', userId);

  const now = new Date().toISOString();
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ deleted_at: now, status: 'Inactive', updated_at: now })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to soft-delete profile ${userId}: ${profileError.message}`);
  }

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.warn(`  warn: auth delete ${userId}: ${authError.message}`);
  }
}

async function main(): Promise<void> {
  if (!confirmed) {
    console.error('Refusing to run without --confirm');
    console.error('  npm run cleanup:audit-staff -- --confirm');
    process.exit(1);
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('id', TENANT_ID)
    .is('deleted_at', null)
    .single();

  if (tenantError || !tenant) {
    throw new Error(`Tenant ${TENANT_ID} not found`);
  }

  console.log(`Tenant: ${tenant.name} (id=${TENANT_ID})`);
  console.log(`Keeping admin phone: ${KEEP_ADMIN_PHONE}`);

  const { data: admin, error: adminError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, phone_number')
    .eq('tenant_id', TENANT_ID)
    .eq('phone_number', KEEP_ADMIN_PHONE)
    .is('deleted_at', null)
    .maybeSingle();

  if (adminError) throw adminError;
  if (!admin) {
    throw new Error(`Admin user with phone ${KEEP_ADMIN_PHONE} not found`);
  }

  console.log(`Admin: ${admin.first_name} ${admin.last_name ?? ''} (${admin.id})`);

  const { count: auditBefore, error: auditCountError } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID);

  if (auditCountError) throw auditCountError;

  const { error: auditDeleteError } = await supabase
    .from('audit_logs')
    .delete()
    .eq('tenant_id', TENANT_ID);

  if (auditDeleteError) throw auditDeleteError;
  console.log(`Deleted ${auditBefore ?? 0} audit log row(s)`);

  const { data: staff, error: staffError } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, phone_number')
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null)
    .neq('id', admin.id);

  if (staffError) throw staffError;

  const toRemove = staff ?? [];
  console.log(`Removing ${toRemove.length} staff member(s)…`);

  for (const member of toRemove) {
    console.log(`  - ${member.first_name} ${member.last_name ?? ''} (${member.phone_number})`);
    await removeStaffUser(member.id, admin.id);
  }

  const { count: staffAfter, error: staffAfterError } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID)
    .is('deleted_at', null);

  if (staffAfterError) throw staffAfterError;

  console.log(`Active staff remaining: ${staffAfter ?? 0}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
