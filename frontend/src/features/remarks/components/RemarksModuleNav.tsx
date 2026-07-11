import { BarChart3, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModuleNav } from '@/components/module-ui/ModuleNav';

export function RemarksModuleNav() {
  const { t } = useTranslation('remarks');

  return (
    <ModuleNav
      theme="saffron"
      tabs={[
        { to: '/remarks', label: t('nav.log'), icon: List, end: true },
        { to: '/remarks/reports', label: t('nav.reports'), icon: BarChart3 },
      ]}
    />
  );
}
