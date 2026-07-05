import { Router } from 'express';
import { roleRoutes } from '../modules/auth/routes/role.routes';
import { userRoutes } from '../modules/auth/routes/user.routes';
import { documentRoutes } from '../modules/documents/routes/document.routes';
import { studentDocumentRoutes } from '../modules/documents/routes/studentDocument.routes';
import { exportRoutes } from '../modules/exports/routes/export.routes';
import { remarkRoutes, studentRemarkRoutes } from '../modules/remarks/routes/remark.routes';
import { studentRoutes } from '../modules/students/routes/student.routes';
import { lookupRoutes } from '../modules/system/routes/lookup.routes';
import { migrationRoutes } from '../modules/system/routes/migration.routes';
import {
  auditLogRoutes,
  dashboardRoutes,
} from '../modules/system/routes/dashboard.routes';
import { hostelRoutes } from '../modules/hostel/routes/hostel.routes';
import { hostelAttendanceRoutes } from '../modules/hostel/routes/hostelAttendance.routes';
import { medicalRoutes, studentMedicalRoutes } from '../modules/medical/routes/medical.routes';
import { healthRoutes } from '../modules/health/routes/health.routes';

export const v1Router = Router();

v1Router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

v1Router.use('/users', userRoutes);
v1Router.use('/roles', roleRoutes);
v1Router.use('/lookups', lookupRoutes);
v1Router.use('/students', studentRoutes);
v1Router.use('/students/:studentId/documents', studentDocumentRoutes);
v1Router.use('/students/:studentId/remarks', studentRemarkRoutes);
v1Router.use('/students/:studentId/medical-records', studentMedicalRoutes);
v1Router.use('/documents', documentRoutes);
v1Router.use('/remarks', remarkRoutes);
v1Router.use('/hostel', hostelRoutes);
v1Router.use('/hostel-attendance', hostelAttendanceRoutes);
v1Router.use('/medical-records', medicalRoutes);
v1Router.use('/health', healthRoutes);
v1Router.use('/exports', exportRoutes);
v1Router.use('/migration', migrationRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/audit-logs', auditLogRoutes);
