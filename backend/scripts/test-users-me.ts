import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';

const phone = process.env.BOOTSTRAP_ADMIN_PHONE;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const port = process.env.PORT ?? '4000';

async function main(): Promise<void> {
  if (!phone || !password || !supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BOOTSTRAP_ADMIN_PHONE, and BOOTSTRAP_ADMIN_PASSWORD in backend/.env',
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    phone,
    password,
  });

  if (signInError || !sessionData.session?.access_token) {
    throw new Error(`Sign-in failed: ${signInError?.message ?? 'no access token'}`);
  }

  const token = sessionData.session.access_token;
  console.log('Sign-in OK');

  const healthRes = await fetch(`http://localhost:${port}/api/v1/health`);
  const health = await healthRes.json();
  console.log('GET /health →', healthRes.status, health);

  const meRes = await fetch(`http://localhost:${port}/api/v1/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meBody = await meRes.json();
  console.log('GET /users/me →', meRes.status, JSON.stringify(meBody, null, 2));

  if (!meRes.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
