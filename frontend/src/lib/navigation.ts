import {
  BedDouble,
  FileText,
  LayoutDashboard,
  List,
  MessageSquare,
  ScrollText,
  Upload,
  UserCog,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type NavItem = {
  labelKey: string;
  href: string;
  permission: string;
  icon: typeof Users;
};

export const NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.dashboard', href: '/', permission: 'dashboard:view', icon: LayoutDashboard },
  { labelKey: 'nav.students', href: '/students', permission: 'students:read', icon: Users },
  { labelKey: 'nav.remarks', href: '/remarks', permission: 'remarks:read', icon: MessageSquare },
  { labelKey: 'nav.hostel', href: '/hostel', permission: 'hostel:read', icon: BedDouble },
  { labelKey: 'nav.documents', href: '/documents', permission: 'documents:view', icon: FileText },
  { labelKey: 'nav.import', href: '/import', permission: 'students:create', icon: Upload },
  { labelKey: 'nav.staff', href: '/staff', permission: 'system:manage_roles', icon: UserCog },
  { labelKey: 'nav.lookups', href: '/lookups', permission: 'system:manage_lookups', icon: List },
  { labelKey: 'nav.auditLogs', href: '/audit-logs', permission: 'audit_logs:view', icon: ScrollText },
];

export function useNavItems() {
  const { t } = useTranslation();
  return NAV_ITEMS.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }));
}

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

export function getNavItemForPath(pathname: string, items: { href: string; label: string }[]) {
  if (pathname === '/') {
    return items.find((item) => item.href === '/');
  }
  return items.find((item) => item.href !== '/' && pathname.startsWith(item.href));
}
