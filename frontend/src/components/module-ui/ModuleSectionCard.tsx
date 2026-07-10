import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ModuleSectionCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function ModuleSectionCard({
  title,
  description,
  icon,
  children,
  className,
  headerClassName,
}: ModuleSectionCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
        className,
      )}
    >
      <div
        className={cn(
          'border-b bg-gradient-to-r from-slate-50/90 via-transparent to-sky-50/60 px-5 py-4 dark:from-slate-950/25 dark:to-sky-950/20',
          headerClassName,
        )}
      >
        <div className="flex items-start gap-3">
          {icon}
          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
