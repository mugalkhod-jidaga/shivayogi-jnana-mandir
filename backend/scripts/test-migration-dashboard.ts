import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const port = process.env.PORT ?? '4000';
const base = `http://localhost:${port}/api/v1`;

async function api(token: string, path: string, init?: RequestInit) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

async function main(): Promise<void> {
  if (!phone || !password || !supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required env vars in backend/.env');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ phone, password });
  if (error || !data.session?.access_token) {
    throw new Error(`Sign-in failed: ${error?.message}`);
  }

  const token = data.session.access_token;
  const suffix = Date.now();
  const csvPath = join(__dirname, 'fixtures', 'sample-students.csv');
  let csv = readFileSync(csvPath, 'utf8');
  csv = csv.replace(/MIG-001/g, `MIG-${suffix}-001`).replace(/MIG-002/g, `MIG-${suffix}-002`);

  const form = new FormData();
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'students.csv');

  const parseRes = await fetch(`${base}/migration/parse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const parseBody = (await parseRes.json()) as Record<string, unknown>;
  console.log('POST /migration/parse →', parseRes.status, parseBody);

  const parseData = parseBody.data as {
    validRows?: number;
    preview?: Record<string, unknown>[];
  } | undefined;

  if (!parseData?.preview?.length) {
    process.exit(1);
  }

  const commit = await api(token, '/migration/commit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students: parseData.preview }),
  });
  console.log('POST /migration/commit →', commit.status, commit.body);

  const summary = await api(token, '/dashboard/summary');
  console.log('GET /dashboard/summary →', summary.status, summary.body);

  const compliance = await api(token, '/dashboard/compliance-report');
  const complianceData = compliance.body.data as unknown[] | undefined;
  console.log('GET /dashboard/compliance-report →', compliance.status, `rows=${complianceData?.length}`);

  const audit = await api(token, '/audit-logs?page=1&limit=5');
  console.log('GET /audit-logs →', audit.status, 'total=', (audit.body.meta as { total?: number })?.total);

  if (!parseBody.success || !commit.body.success || !summary.body.success) {
    process.exit(1);
  }

  console.log('Migration + dashboard test passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
