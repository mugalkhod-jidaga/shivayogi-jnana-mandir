import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { HostelRosterPage } from '@/features/hostel/HostelRosterPage';

export function HostelHomePage() {
  const { hasPermission } = usePermissions();

  if (!hasPermission('hostel_attendance:read')) {
    return <Navigate to="/hostel/overview" replace />;
  }

  return <HostelRosterPage />;
}
