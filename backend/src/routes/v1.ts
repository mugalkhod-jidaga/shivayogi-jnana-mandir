import { Router } from 'express';
import { roleRoutes } from '../modules/auth/routes/role.routes';
import { userRoutes } from '../modules/auth/routes/user.routes';
import { documentRoutes } from '../modules/documents/routes/document.routes';
import { studentDocumentRoutes } from '../modules/documents/routes/studentDocument.routes';
import { studentRoutes } from '../modules/students/routes/student.routes';
import { lookupRoutes } from '../modules/system/routes/lookup.routes';

export const v1Router = Router();

v1Router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

v1Router.use('/users', userRoutes);
v1Router.use('/roles', roleRoutes);
v1Router.use('/lookups', lookupRoutes);
v1Router.use('/students', studentRoutes);
v1Router.use('/students/:studentId/documents', studentDocumentRoutes);
v1Router.use('/documents', documentRoutes);
