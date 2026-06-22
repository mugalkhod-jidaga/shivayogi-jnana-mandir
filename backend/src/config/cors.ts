import { env } from './env';

const DEV_VITE_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

export function getAllowedCorsOrigins(): string[] {
  const configured = env.CORS_ORIGIN.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (env.NODE_ENV === 'development') {
    return [...new Set([...configured, ...DEV_VITE_ORIGINS])];
  }

  return configured;
}
