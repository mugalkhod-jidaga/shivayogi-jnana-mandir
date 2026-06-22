import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { getAllowedCorsOrigins } from './config/cors';
import { globalErrorHandler } from './middlewares/globalErrorHandler';
import { defaultLimiter } from './middlewares/rateLimiters';
import { v1Router } from './routes/v1';

export const app = express();

const allowedOrigins = getAllowedCorsOrigins();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin ?? true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(defaultLimiter);
app.use('/api/v1', v1Router);
app.use(globalErrorHandler);
