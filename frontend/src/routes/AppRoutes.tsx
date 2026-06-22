import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AuditLogsPage } from '@/features/audit/AuditLogsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { ImportPage } from '@/features/import/ImportPage';
import { LookupsPage } from '@/features/lookups/LookupsPage';
import { StaffPage } from '@/features/staff/StaffPage';
import { StudentsPage } from '@/features/students/StudentsPage';
import { PermissionRoute } from '@/routes/PermissionRoute';
import { ProtectedRoute, PublicOnlyRoute } from '@/routes/ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<Layout />}>
          <Route
            index
            element={
              <PermissionRoute permission="dashboard:view">
                <DashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/students"
            element={
              <PermissionRoute permission="students:read">
                <StudentsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PermissionRoute permission="documents:view">
                <DocumentsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/import"
            element={
              <PermissionRoute permission="students:create">
                <ImportPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <PermissionRoute permission="system:manage_roles">
                <StaffPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/lookups"
            element={
              <PermissionRoute permission="system:manage_lookups">
                <LookupsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <PermissionRoute permission="audit_logs:view">
                <AuditLogsPage />
              </PermissionRoute>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
