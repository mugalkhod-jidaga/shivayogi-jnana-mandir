import { ArrowUpCircle, BarChart3, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModuleNav } from '@/components/module-ui/ModuleNav';
import { usePermissions } from '@/hooks/usePermissions';

const tabs = [
  { to: '/students', labelKey: 'nav.directory', icon: Users, end: true, permission: null },
  { to: '/students/reports', labelKey: 'nav.reports', icon: BarChart3, end: false, permission: null },
  {
    to: '/students/promotions',
    labelKey: 'nav.promotions',
    icon: ArrowUpCircle,
    end: false,
    permission: 'students:promote',
  },
] as const;

export function StudentsModuleNav() {
  const { t } = useTranslation('students');
  const { hasPermission } = usePermissions();

  return (
    <ModuleNav
      theme="indigo"
      tabs={tabs
        .filter((tab) => !tab.permission || hasPermission(tab.permission))
        .map(({ to, labelKey, icon, end }) => ({
          to,
          label: t(labelKey),
          icon,
          end,
        }))}
    />
  );
}
