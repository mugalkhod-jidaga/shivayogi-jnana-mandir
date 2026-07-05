/**
 * Removes every student (and related records) for a tenant.
 * Preserves tenants, lookups, roles, staff, hostel structure, and medicine catalog.
 *
 * Usage:
 *   npm run purge:students -- --confirm
 *
 * Requires backend/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 * Optional: BOOTSTRAP_TENANT_ID (default 1)
 */
import 'dotenv/config';

import { supabase } from '../src/config/supabase';

const TENANT_ID = Number(process.env.BOOTSTRAP_TENANT_ID ?? 1);
const confirmed = process.argv.includes('--confirm');

async function countStudents(): Promise<number> {
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', TENANT_ID);

  if (error) throw error;
  return count ?? 0;
}

async function deleteByTenant(table: string): Promise<number> {
  const { data, error } = await supabase.from(table).delete().eq('tenant_id', TENANT_ID).select('id');

  if (error) throw new Error(`${table}: ${error.message}`);
  return data?.length ?? 0;
}

async function main(): Promise<void> {
  if (!confirmed) {
    console.error('Refusing to run without --confirm');
    console.error('  npm run purge:students -- --confirm');
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

  const before = await countStudents();
  console.log(`Tenant: ${tenant.name} (id=${TENANT_ID})`);
  console.log(`Students before purge: ${before}`);

  if (before === 0) {
    console.log('Nothing to delete.');
    return;
  }

  const steps: [string, () => Promise<number>][] = [
    ['health_visit_attachments', () => deleteByTenant('health_visit_attachments')],
    ['health_visit_medicines', () => deleteByTenant('health_visit_medicines')],
    ['health_visits', () => deleteByTenant('health_visits')],
    ['hostel_attendance_records', () => deleteByTenant('hostel_attendance_records')],
    ['room_allocations', () => deleteByTenant('room_allocations')],
    ['student_remarks', () => deleteByTenant('student_remarks')],
    ['student_medical_records', () => deleteByTenant('student_medical_records')],
    ['students', () => deleteByTenant('students')],
  ];

  for (const [table, run] of steps) {
    const removed = await run();
    console.log(`  deleted ${removed} row(s) from ${table}`);
  }

  const { error: seqError } = await supabase
    .from('tenant_admission_sequences')
    .update({ next_number: 1, updated_at: new Date().toISOString() })
    .eq('tenant_id', TENANT_ID);

  if (seqError) {
    console.warn(`Warning: could not reset admission sequence: ${seqError.message}`);
  } else {
    console.log('  reset tenant_admission_sequences.next_number → 1');
  }

  const after = await countStudents();
  console.log(`Students after purge: ${after}`);
  console.log('Done. R2 document files (if any) were not removed from storage.');
}

main().catch((err) => {
  console.error('Purge failed:', err);
  process.exit(1);
});
