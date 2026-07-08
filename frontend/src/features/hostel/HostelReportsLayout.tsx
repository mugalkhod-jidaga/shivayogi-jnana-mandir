import { Outlet } from 'react-router-dom';
import { HostelDateBlockFilters } from '@/features/hostel/components/HostelDateBlockFilters';

export function HostelReportsLayout() {
  return (
    <div className="space-y-6">
      <HostelDateBlockFilters idPrefix="hostel-reports" />
      <Outlet />
    </div>
  );
}
