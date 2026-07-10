import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type ModuleHeroBannerProps = {
  title: string;
  description: string;
  tagline?: string;
  icon: LucideIcon;
  children?: ReactNode;
  className?: string;
  gradientClassName?: string;
};

export function ModuleHeroBanner({
  title,
  description,
  tagline,
  icon: Icon,
  children,
  className,
  gradientClassName = 'from-orange-500 via-amber-500 to-indigo-600 border-orange-200/60 dark:border-orange-900/40',
}: ModuleHeroBannerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-white shadow-lg',
        gradientClassName,
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 size-48 rounded-full bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-sm">
            <Icon className="size-7" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <Sparkles className="size-5 text-white/80" />
            </div>
            <p className="mt-1 max-w-xl text-sm text-white/90">{description}</p>
            {tagline && (
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-white/75">
                {tagline}
              </p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
