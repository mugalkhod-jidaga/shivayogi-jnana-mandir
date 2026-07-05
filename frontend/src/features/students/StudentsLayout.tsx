import { Outlet } from 'react-router-dom';
import { StudentsModuleNav } from '@/features/students/components/StudentsModuleNav';

export function StudentsLayout() {
  return (
    <div className="space-y-6">
      <StudentsModuleNav />
      <Outlet />
    </div>
  );
}
