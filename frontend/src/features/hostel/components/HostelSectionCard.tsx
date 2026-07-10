import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type HostelSectionCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function HostelSectionCard({
  title,
  description,
  icon,
  children,
  className,
  headerClassName,
}: HostelSectionCardProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
        className,
      )}
    >
      <div
        className={cn(
          'border-b bg-gradient-to-r from-orange-50/90 via-transparent to-indigo-50/60 px-5 py-4 dark:from-orange-950/25 dark:to-indigo-950/20',
          headerClassName,
        )}
      >
        <div className="flex items-center gap-3">
          {icon}
          <div>
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
