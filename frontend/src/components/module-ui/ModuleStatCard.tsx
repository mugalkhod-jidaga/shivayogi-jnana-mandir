import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULE_ACCENTS, type ModuleAccent } from '@/components/module-ui/moduleTheme';

type ModuleStatCardProps = {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
  accent?: ModuleAccent;
  className?: string;
};

export function ModuleStatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = 'indigo',
  className,
}: ModuleStatCardProps) {
  const theme = MODULE_ACCENTS[accent];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md',
        theme.card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl shadow-md',
            theme.icon,
          )}
        >
          <Icon className="size-5" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
}
