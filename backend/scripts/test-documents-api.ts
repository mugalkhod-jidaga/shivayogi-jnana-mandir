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

  const docTypes = await api(token, '/lookups/document-types');
  const docTypeId = (docTypes.body.data as { id: number }[])?.[0]?.id;
  if (!docTypeId) throw new Error('No document types found');

  const created = await api(token, '/students', {
    method: 'POST',
    body: JSON.stringify({
      admissionNumber: `DOC-${suffix}`,
      firstName: 'Doc',
      lastName: 'Test',
      dob: '2011-01-01',
      familyDetails: {
        parentStatus: 'Both Alive',
        primaryContact: '+919911223344',
        villageTown: 'Village',
        talukMandal: 'Taluk',
        district: 'District',
        pincode: '560001',
      },
    }),
  });

  const studentId = (created.body.data as { id?: string })?.id;
  if (!studentId) {
    console.error('Failed to create student', created.body);
    process.exit(1);
  }

  console.log('Student created:', studentId);

  const presign = await api(token, `/students/${studentId}/documents/presign`, {
    method: 'POST',
    body: JSON.stringify({
      filename: 'test-aadhaar.pdf',
      documentTypeId: docTypeId,
      mimeType: 'application/pdf',
    }),
  });
  console.log('POST presign →', presign.status, presign.body);

  const presignData = presign.body.data as { uploadUrl?: string; key?: string } | undefined;
  if (!presignData?.uploadUrl || !presignData?.key) {
    process.exit(1);
  }

  const fileBytes = Buffer.from('%PDF-1.4 test document content');
  const uploadRes = await fetch(presignData.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: fileBytes,
  });
  console.log('R2 PUT →', uploadRes.status, uploadRes.statusText);
  if (!uploadRes.ok) {
    console.error('R2 upload failed — check CLOUDFLARE_R2_* env vars and bucket permissions');
    process.exit(1);
  }

  const confirm = await api(token, `/students/${studentId}/documents/confirm`, {
    method: 'POST',
    body: JSON.stringify({
      key: presignData.key,
      documentTypeId: docTypeId,
      originalFilename: 'test-aadhaar.pdf',
      mimeType: 'application/pdf',
      fileSize: fileBytes.length,
    }),
  });
  console.log('POST confirm →', confirm.status, confirm.body);

  const documentId = (confirm.body.data as { id?: string })?.id;
  if (!documentId) process.exit(1);

  const list = await api(token, `/students/${studentId}/documents`);
  console.log('GET documents →', list.status, `count=${(list.body.data as unknown[])?.length}`);

  const download = await api(token, `/documents/${documentId}/download`);
  console.log('GET download →', download.status, 'hasUrl=', !!(download.body.data as { downloadUrl?: string })?.downloadUrl);

  const verified = await api(token, `/documents/${documentId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'Verified' }),
  });
  console.log('PATCH verify →', verified.status, (verified.body.data as { status?: string })?.status);

  if (!confirm.body.success || !download.body.success) {
    process.exit(1);
  }

  console.log('Documents module test passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
