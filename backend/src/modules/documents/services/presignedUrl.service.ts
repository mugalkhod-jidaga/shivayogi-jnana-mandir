import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

function getR2Client(): S3Client {
  const { CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY, CLOUDFLARE_R2_ENDPOINT } = env;
  if (!CLOUDFLARE_R2_ACCESS_KEY || !CLOUDFLARE_R2_SECRET_KEY || !CLOUDFLARE_R2_ENDPOINT) {
    throw new AppError(503, 'File storage is not configured. Set Cloudflare R2 environment variables.');
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

function getBucketName(): string {
  if (!env.CLOUDFLARE_R2_BUCKET_NAME) {
    throw new AppError(503, 'CLOUDFLARE_R2_BUCKET_NAME is not configured');
  }
  return env.CLOUDFLARE_R2_BUCKET_NAME;
}

export async function getUploadUrl(
  tenantId: number,
  studentId: string,
  filename: string,
  kind: 'documents' | 'avatar',
) {
  const key = `tenant_${tenantId}/student_${studentId}/${kind}/${randomUUID()}_${filename}`;
  const command = new PutObjectCommand({ Bucket: getBucketName(), Key: key });
  const uploadUrl = await getSignedUrl(getR2Client(), command, { expiresIn: 900 });
  return { uploadUrl, key };
}
