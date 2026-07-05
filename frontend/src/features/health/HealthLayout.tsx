import { Outlet } from 'react-router-dom';
import { HealthModuleNav } from '@/features/health/components/HealthModuleNav';

export function HealthLayout() {
  return (
    <div className="space-y-6">
      <HealthModuleNav />
      <Outlet />
    </div>
  );
}
