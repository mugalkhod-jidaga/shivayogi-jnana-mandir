import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { MODULE_NAV_THEMES, type ModuleNavTheme } from '@/components/module-ui/moduleGradients';
import { cn } from '@/lib/utils';

export type ModuleNavTab = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type ModuleNavProps = {
  tabs: ModuleNavTab[];
  theme?: ModuleNavTheme;
  hideLabelsOnMobile?: boolean;
  className?: string;
};

export function ModuleNav({
  tabs,
  theme = 'indigo',
  hideLabelsOnMobile = false,
  className,
}: ModuleNavProps) {
  const styles = MODULE_NAV_THEMES[theme];

  return (
    <nav
      className={cn(
        'flex flex-wrap gap-1 rounded-xl border p-1.5 shadow-sm',
        styles.nav,
        className,
      )}
    >
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all sm:flex-none sm:px-4',
              isActive ? styles.active : styles.inactive,
            )
          }
        >
          <Icon className="size-4 shrink-0" strokeWidth={2.25} />
          <span className={cn(hideLabelsOnMobile && 'hidden sm:inline')}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
