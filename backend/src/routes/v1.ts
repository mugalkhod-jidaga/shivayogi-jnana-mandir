import { Router } from 'express';
import { userRoutes } from '../modules/auth/routes/user.routes';

export const v1Router = Router();

v1Router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

v1Router.use('/users', userRoutes);
