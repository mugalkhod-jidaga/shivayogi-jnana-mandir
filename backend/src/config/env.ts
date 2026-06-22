import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  RATE_LIMIT_DEFAULT_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_LOGIN_MAX: z.coerce.number().int().positive().default(5),
  CLOUDFLARE_R2_ACCESS_KEY: z.string().optional(),
  CLOUDFLARE_R2_SECRET_KEY: z.string().optional(),
  CLOUDFLARE_R2_ENDPOINT: z.string().optional(),
  CLOUDFLARE_R2_BUCKET_NAME: z.string().optional(),
});

export const env = envSchema.parse(process.env);
