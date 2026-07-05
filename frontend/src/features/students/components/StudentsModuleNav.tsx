import { BarChart3, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { to: '/students', labelKey: 'nav.directory', icon: Users, end: true },
  { to: '/students/reports', labelKey: 'nav.reports', icon: BarChart3, end: false },
] as const;

export function StudentsModuleNav() {
  const { t } = useTranslation('students');

  return (
    <nav className="flex gap-1 rounded-lg border bg-muted/30 p-1">
      {tabs.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors sm:flex-none',
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
