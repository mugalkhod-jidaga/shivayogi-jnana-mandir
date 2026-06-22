import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

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
      'Content-Type': 'application/json',
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

  const blood = await api(token, '/lookups/blood-groups');
  const bloodData = blood.body.data as unknown[] | undefined;
  console.log('GET /lookups/blood-groups →', blood.status, `count=${bloodData?.length}`);

  const categories = await api(token, '/lookups/admission-categories');
  const catData = categories.body.data as { value: string }[] | undefined;
  console.log(
    'GET /lookups/admission-categories →',
    categories.status,
    catData?.map((c) => c.value).join(', '),
  );

  const docTypes = await api(token, '/lookups/document-types');
  const docData = docTypes.body.data as { value: string }[] | undefined;
  console.log(
    'GET /lookups/document-types →',
    docTypes.status,
    `count=${docData?.length}`,
  );

  const testCategory = `Test Category ${Date.now()}`;
  const created = await api(token, '/lookups/admission-categories', {
    method: 'POST',
    body: JSON.stringify({ value: testCategory }),
  });
  console.log('POST /lookups/admission-categories →', created.status, created.body);

  const createdData = created.body.data as { id?: number } | undefined;
  if (createdData?.id) {
    const deactivated = await api(token, `/lookups/admission-categories/${createdData.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
    });
    console.log('PATCH deactivate →', deactivated.status, deactivated.body);
  }

  if (!blood.body.success || !categories.body.success || !docTypes.body.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
