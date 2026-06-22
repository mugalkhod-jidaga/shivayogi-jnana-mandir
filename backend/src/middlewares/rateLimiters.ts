import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const loginLimiter = rateLimit({
  windowMs: 60_000,
  max: env.RATE_LIMIT_LOGIN_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, try again shortly.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Upload rate limit exceeded.' },
});

export const defaultLimiter = rateLimit({
  windowMs: 60_000,
  max: env.RATE_LIMIT_DEFAULT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, try again shortly.' },
});
