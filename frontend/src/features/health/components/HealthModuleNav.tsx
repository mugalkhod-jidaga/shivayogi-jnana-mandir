import { Activity, BarChart3, HeartPulse, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModuleNav } from '@/components/module-ui/ModuleNav';
import { usePermissions } from '@/hooks/usePermissions';

const tabs = [
  { to: '/health', labelKey: 'nav.dashboard', icon: Activity, end: true, permission: 'medical:read' },
  {
    to: '/health/record-visit',
    labelKey: 'nav.recordVisit',
    icon: HeartPulse,
    end: false,
    permission: 'medical:create',
  },
  {
    to: '/health/visits',
    labelKey: 'nav.visits',
    icon: History,
    end: false,
    permission: 'medical:read',
  },
  {
    to: '/health/reports',
    labelKey: 'nav.reports',
    icon: BarChart3,
    end: false,
    permission: 'medical:read',
  },
] as const;

export function HealthModuleNav() {
  const { t } = useTranslation('health');
  const { hasPermission } = usePermissions();

  const visibleTabs = tabs
    .filter((tab) => hasPermission(tab.permission))
    .map(({ to, labelKey, icon, end }) => ({
      to,
      label: t(labelKey),
      icon,
      end,
    }));

  return <ModuleNav theme="teal" tabs={visibleTabs} />;
}
