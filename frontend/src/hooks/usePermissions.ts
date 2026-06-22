import { useCallback, useMemo } from 'react';
import { useMe } from '@/hooks/useMe';

export function usePermissions() {
  const { data: me } = useMe();

  const permissions = useMemo(() => new Set(me?.permissions ?? []), [me?.permissions]);

  const hasPermission = useCallback(
    (permission: string) => permissions.has(permission),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (...required: string[]) => required.some((permission) => permissions.has(permission)),
    [permissions],
  );

  return { permissions, hasPermission, hasAnyPermission };
}
