import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { getFirstPermittedPath } from '@/lib/navigation';

type RequirePermissionProps = {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
  redirect?: boolean;
};

export function RequirePermission({
  permission,
  children,
  fallback = null,
  redirect = false,
}: RequirePermissionProps) {
  const { hasPermission } = usePermissions();

  if (hasPermission(permission)) {
    return children;
  }

  if (redirect) {
    const fallbackPath = getFirstPermittedPath(hasPermission);
    return <Navigate to={fallbackPath ?? '/login'} replace />;
  }

  return fallback;
}
