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
  const suffix = Date.now();

  const categories = await api(token, '/lookups/admission-categories');
  const catData = categories.body.data as { id: number }[] | undefined;
  const categoryId = catData?.[0]?.id;

  const blood = await api(token, '/lookups/blood-groups');
  const bloodData = blood.body.data as { id: number }[] | undefined;
  const bloodGroupId = bloodData?.[0]?.id;

  const created = await api(token, '/students', {
    method: 'POST',
    body: JSON.stringify({
      admissionNumber: `ADM-${suffix}`,
      firstName: 'Test',
      lastName: 'Student',
      dob: '2010-05-15',
      gender: 'Male',
      bloodGroupId,
      admissionCategoryId: categoryId,
      familyDetails: {
        fatherName: 'Father Name',
        motherName: 'Mother Name',
        parentStatus: 'Both Alive',
        primaryContact: '+919988776655',
        villageTown: 'Test Village',
        talukMandal: 'Test Taluk',
        district: 'Test District',
        pincode: '560001',
      },
    }),
  });

  console.log('POST /students →', created.status, created.body);

  const createdData = created.body.data as { id?: string; admissionNumber?: string } | undefined;
  if (!createdData?.id) {
    process.exit(1);
  }

  const list = await api(token, '/students?search=ADM-');
  console.log('GET /students →', list.status, 'total=', (list.body.meta as { total?: number })?.total);

  const detail = await api(token, `/students/${createdData.id}`);
  const detailData = detail.body.data as { familyDetails?: unknown } | undefined;
  console.log('GET /students/:id →', detail.status, 'hasFamily=', !!detailData?.familyDetails);

  const updated = await api(token, `/students/${createdData.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ medicalAlerts: 'No known allergies' }),
  });
  console.log('PATCH /students/:id →', updated.status);

  const deactivated = await api(token, `/students/${createdData.id}/deactivate`, {
    method: 'PATCH',
    body: JSON.stringify({ statusReason: 'Test cleanup', status: 'Discontinued' }),
  });
  console.log('PATCH /students/:id/deactivate →', deactivated.status);

  if (!created.body.success || !detail.body.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
