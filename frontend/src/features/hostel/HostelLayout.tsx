import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/hostel', end: true, labelKey: 'tabs.roster' },
  { to: '/hostel/overview', end: false, labelKey: 'tabs.overview' },
  { to: '/hostel/setup', end: false, labelKey: 'tabs.setup' },
  { to: '/hostel/allocations', end: false, labelKey: 'tabs.allocations' },
  { to: '/hostel/attendance', end: false, labelKey: 'tabs.attendance' },
  { to: '/hostel/reports', end: false, labelKey: 'tabs.reports' },
] as const;

export function HostelLayout() {
  const { t } = useTranslation('hostel');

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      <nav className="flex flex-wrap gap-2 border-b">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
