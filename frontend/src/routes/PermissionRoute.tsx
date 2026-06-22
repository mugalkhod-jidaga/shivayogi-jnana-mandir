import type { ReactNode } from 'react';
import { RequirePermission } from '@/components/RequirePermission';

type PermissionRouteProps = {
  permission: string;
  children: ReactNode;
};

export function PermissionRoute({ permission, children }: PermissionRouteProps) {
  return (
    <RequirePermission permission={permission} redirect>
      {children}
    </RequirePermission>
  );
}
