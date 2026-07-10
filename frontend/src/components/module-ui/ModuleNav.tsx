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
  className?: string;
};

export function ModuleNav({ tabs, theme = 'indigo', className }: ModuleNavProps) {
  const styles = MODULE_NAV_THEMES[theme];

  return (
    <nav
      className={cn(
        '-mx-1 overflow-x-auto rounded-xl border p-1.5 shadow-sm [scrollbar-width:thin]',
        styles.nav,
        className,
      )}
    >
      <div className="flex w-max min-w-full gap-1">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all sm:px-4',
                isActive ? styles.active : styles.inactive,
              )
            }
          >
            <Icon className="size-4 shrink-0" strokeWidth={2.25} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
