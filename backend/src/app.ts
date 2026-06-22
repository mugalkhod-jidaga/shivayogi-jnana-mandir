import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { defaultLimiter } from './middlewares/rateLimiters';
import { v1Router } from './routes/v1';

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(defaultLimiter);
app.use('/api/v1', v1Router);
app.use(globalErrorHandler);
