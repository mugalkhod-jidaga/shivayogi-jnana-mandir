import { BedDouble, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { HostelModuleNav } from '@/features/hostel/components/HostelModuleNav';

export function HostelLayout() {
  const { t } = useTranslation('hostel');

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-500 via-amber-500 to-indigo-600 p-6 text-white shadow-lg dark:border-orange-900/40">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 size-48 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-sm">
              <BedDouble className="size-7" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <Sparkles className="size-5 text-amber-200" />
              </div>
              <p className="mt-1 max-w-xl text-sm text-orange-50/95">{t('description')}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-amber-100/90">
                {t('hero.tagline')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <HostelModuleNav />
      <Outlet />
    </div>
  );
}
