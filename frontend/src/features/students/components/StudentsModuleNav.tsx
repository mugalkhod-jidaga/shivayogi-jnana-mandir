import { BarChart3, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModuleNav } from '@/components/module-ui/ModuleNav';

const tabs = [
  { to: '/students', labelKey: 'nav.directory', icon: Users, end: true },
  { to: '/students/reports', labelKey: 'nav.reports', icon: BarChart3, end: false },
] as const;

export function StudentsModuleNav() {
  const { t } = useTranslation('students');

  return (
    <ModuleNav
      theme="indigo"
      tabs={tabs.map(({ to, labelKey, icon, end }) => ({
        to,
        label: t(labelKey),
        icon,
        end,
      }))}
    />
  );
}
