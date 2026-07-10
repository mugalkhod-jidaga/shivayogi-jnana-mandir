import {
  BarChart3,
  BedDouble,
  Building2,
  CalendarCheck,
  ClipboardList,
  LayoutDashboard,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/hostel', labelKey: 'tabs.roster', icon: ClipboardList, end: true },
  { to: '/hostel/overview', labelKey: 'tabs.overview', icon: LayoutDashboard, end: false },
  { to: '/hostel/setup', labelKey: 'tabs.setup', icon: Building2, end: false },
  { to: '/hostel/allocations', labelKey: 'tabs.allocations', icon: BedDouble, end: false },
  { to: '/hostel/attendance', labelKey: 'tabs.attendance', icon: CalendarCheck, end: false },
  { to: '/hostel/reports', labelKey: 'tabs.reports', icon: BarChart3, end: false },
] as const;

export function HostelModuleNav() {
  const { t } = useTranslation('hostel');

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-orange-200/50 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-indigo-50/80 p-1.5 shadow-sm dark:border-orange-900/30 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-indigo-950/30">
      {tabs.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all sm:flex-none sm:px-4',
              isActive
                ? 'bg-white text-orange-900 shadow-md ring-1 ring-orange-200/80 dark:bg-orange-950/60 dark:text-orange-100 dark:ring-orange-800/50'
                : 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5',
            )
          }
        >
          <Icon className="size-4 shrink-0" strokeWidth={2.25} />
          <span className="hidden sm:inline">{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
