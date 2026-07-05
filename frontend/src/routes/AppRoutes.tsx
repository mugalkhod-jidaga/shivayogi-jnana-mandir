import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AuditLogsPage } from '@/features/audit/AuditLogsPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DocumentQueuePage } from '@/features/documents/DocumentQueuePage';
import { ImportPage } from '@/features/import/ImportPage';
import { HostelAttendanceMarkPage } from '@/features/hostel/HostelAttendanceMarkPage';
import { HostelAttendancePage } from '@/features/hostel/HostelAttendancePage';
import { HostelPage } from '@/features/hostel/HostelPage';
import { LookupsPage } from '@/features/lookups/LookupsPage';
import { MedicalRecordsPage } from '@/features/medical/MedicalRecordsPage';
import { RecordVisitPage } from '@/features/health/RecordVisitPage';
import { RecentVisitsPage } from '@/features/health/RecentVisitsPage';
import { HealthDashboardPage } from '@/features/health/HealthDashboardPage';
import { StudentHealthProfilePage } from '@/features/health/StudentHealthProfilePage';
import { RemarksPage } from '@/features/remarks/RemarksPage';
import { StaffPage } from '@/features/staff/StaffPage';
import { StudentDetailPage } from '@/features/students/StudentDetailPage';
import { StudentFormPage } from '@/features/students/StudentFormPage';
import { StudentListPage } from '@/features/students/StudentListPage';
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
            path="/students/new"
            element={
              <PermissionRoute permission="students:create">
                <StudentFormPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/students/:id/edit"
            element={
              <PermissionRoute permission="students:edit">
                <StudentFormPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <PermissionRoute permission="students:read">
                <StudentDetailPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/students"
            element={
              <PermissionRoute permission="students:read">
                <StudentListPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/remarks"
            element={
              <PermissionRoute permission="remarks:read">
                <RemarksPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/health/record-visit"
            element={
              <PermissionRoute permission="medical:create">
                <RecordVisitPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/health/dashboard"
            element={
              <PermissionRoute permission="medical:read">
                <HealthDashboardPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/health/students/:studentId"
            element={
              <PermissionRoute permission="medical:read">
                <StudentHealthProfilePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/health/recent"
            element={
              <PermissionRoute permission="medical:read">
                <RecentVisitsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/health"
            element={<Navigate to="/health/dashboard" replace />}
          />
          <Route
            path="/medical-records"
            element={
              <PermissionRoute permission="medical:read">
                <MedicalRecordsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/hostel/attendance/:sessionId"
            element={
              <PermissionRoute permission="hostel_attendance:record">
                <HostelAttendanceMarkPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/hostel/attendance"
            element={
              <PermissionRoute permission="hostel_attendance:read">
                <HostelAttendancePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/hostel"
            element={
              <PermissionRoute permission="hostel:read">
                <HostelPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <PermissionRoute permission="documents:view">
                <DocumentQueuePage />
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
