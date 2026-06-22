import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  LayoutDashboard,
  List,
  ScrollText,
  Upload,
  UserCog,
  Users,
} from 'lucide-react';

export type NavItem = {
  label: string;
  href: string;
  permission: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', permission: 'dashboard:view', icon: LayoutDashboard },
  { label: 'Students', href: '/students', permission: 'students:read', icon: Users },
  { label: 'Documents', href: '/documents', permission: 'documents:view', icon: FileText },
  { label: 'Bulk Import', href: '/import', permission: 'students:create', icon: Upload },
  { label: 'Staff', href: '/staff', permission: 'system:manage_roles', icon: UserCog },
  { label: 'Lookups', href: '/lookups', permission: 'system:manage_lookups', icon: List },
  { label: 'Audit Logs', href: '/audit-logs', permission: 'audit_logs:view', icon: ScrollText },
];

export function getFirstPermittedPath(
  hasPermission: (permission: string) => boolean,
): string | null {
  for (const item of NAV_ITEMS) {
    if (hasPermission(item.permission)) {
      return item.href;
    }
  }
  return null;
}

export function getNavItemForPath(pathname: string): NavItem | undefined {
  if (pathname === '/') {
    return NAV_ITEMS.find((item) => item.href === '/');
  }
  return NAV_ITEMS.find((item) => item.href !== '/' && pathname.startsWith(item.href));
}
