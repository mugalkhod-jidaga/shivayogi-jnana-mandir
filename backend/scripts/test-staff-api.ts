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

  const roles = await api(token, '/roles');
  console.log('GET /roles →', roles.status, roles.body);

  const users = await api(token, '/users?page=1&limit=20');
  const usersData = users.body.data as unknown[] | undefined;
  const usersMeta = users.body.meta as { total?: number } | undefined;
  console.log('GET /users →', users.status, `count=${usersData?.length}`, 'total=', usersMeta?.total);

  const me = await api(token, '/users/me');
  const meData = me.body.data as { id?: string } | undefined;
  const adminId = meData?.id;
  if (adminId) {
    const detail = await api(token, `/users/${adminId}`);
    const detailData = detail.body.data as { firstName?: string } | undefined;
    console.log('GET /users/:id →', detail.status, detailData?.firstName);
  }

  if (!roles.body.success || !users.body.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
