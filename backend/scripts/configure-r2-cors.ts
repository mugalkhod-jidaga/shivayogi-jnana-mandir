import 'dotenv/config';

import { GetBucketCorsCommand, PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

function getClient(): S3Client {
  const {
    CLOUDFLARE_R2_ACCESS_KEY,
    CLOUDFLARE_R2_SECRET_KEY,
    CLOUDFLARE_R2_ENDPOINT,
    CLOUDFLARE_R2_BUCKET_NAME,
  } = process.env;

  if (!CLOUDFLARE_R2_ACCESS_KEY || !CLOUDFLARE_R2_SECRET_KEY || !CLOUDFLARE_R2_ENDPOINT) {
    throw new Error('Missing CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY, or CLOUDFLARE_R2_ENDPOINT');
  }

  if (!CLOUDFLARE_R2_BUCKET_NAME) {
    throw new Error('Missing CLOUDFLARE_R2_BUCKET_NAME');
  }

  return new S3Client({
    region: 'auto',
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: CLOUDFLARE_R2_SECRET_KEY,
    },
    endpoint: CLOUDFLARE_R2_ENDPOINT,
  });
}

function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const devDefaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
  ];

  return [...new Set([...fromEnv, ...devDefaults])];
}

async function main(): Promise<void> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
  const client = getClient();
  const allowedOrigins = getAllowedOrigins();

  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'HEAD'],
        AllowedOrigins: allowedOrigins,
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: corsConfiguration,
    }),
  );

  const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));

  console.log(`R2 CORS configured for bucket: ${bucket}`);
  console.log('Allowed origins:', allowedOrigins.join(', '));
  console.log('Current CORS rules:', JSON.stringify(current.CORSRules, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
