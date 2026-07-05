import { Activity, BarChart3, HeartPulse, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/health', labelKey: 'nav.dashboard', icon: Activity, end: true, permission: 'medical:read' },
  {
    to: '/health/record-visit',
    labelKey: 'nav.recordVisit',
    icon: HeartPulse,
    end: false,
    permission: 'medical:create',
  },
  { to: '/health/recent', labelKey: 'nav.recentVisits', icon: History, end: false, permission: 'medical:read' },
  { to: '/health/reports', labelKey: 'nav.reports', icon: BarChart3, end: false, permission: 'medical:read' },
] as const;

export function HealthModuleNav() {
  const { t } = useTranslation('health');
  const { hasPermission } = usePermissions();

  const visibleTabs = tabs.filter((tab) => hasPermission(tab.permission));

  return (
    <nav className="flex flex-wrap gap-1 rounded-lg border bg-muted/30 p-1">
      {visibleTabs.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:flex-none sm:px-4',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            )
          }
        >
          <Icon className="size-4 shrink-0" />
          {t(labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
