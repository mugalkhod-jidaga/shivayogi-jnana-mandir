import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND, MODULE_BANNER_IMAGES, type ModuleBannerKey } from '@/components/module-ui/brandAssets';
import { MODULE_GRADIENTS } from '@/components/module-ui/moduleGradients';
import { cn } from '@/lib/utils';

type ModuleHeroBannerProps = {
  title: string;
  description: string;
  tagline?: string;
  icon: LucideIcon;
  children?: ReactNode;
  className?: string;
  /** Module key — picks gradient + photo banner */
  module?: ModuleBannerKey;
  gradientClassName?: string;
  imageSrc?: string;
  logoSrc?: string;
  showInstitution?: boolean;
};

export function ModuleHeroBanner({
  title,
  description,
  tagline,
  icon: Icon,
  children,
  className,
  module = 'temple',
  gradientClassName,
  imageSrc,
  logoSrc = BRAND.logo,
  showInstitution = true,
}: ModuleHeroBannerProps) {
  const { t } = useTranslation();
  const gradient = gradientClassName ?? MODULE_GRADIENTS[module];
  const photo = imageSrc ?? MODULE_BANNER_IMAGES[module] ?? MODULE_BANNER_IMAGES.temple;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 text-white shadow-lg',
        className,
      )}
    >
      <img
        src={photo}
        alt=""
        className="absolute inset-0 size-full object-cover"
        loading="eager"
        decoding="async"
      />
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-85', gradient)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/10" />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-1.5 shadow-md ring-1 ring-white/40">
            <img
              src={logoSrc}
              alt={t('appName')}
              className="size-full object-contain"
              width={48}
              height={48}
            />
          </div>
          <div className="min-w-0">
            {showInstitution && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-100/95">
                {t('appName')}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight drop-shadow-sm">{title}</h1>
              <span className="hidden rounded-lg bg-white/15 p-1.5 backdrop-blur-sm sm:inline-flex">
                <Icon className="size-4 text-white/90" strokeWidth={2.25} />
              </span>
            </div>
            <p className="mt-1 max-w-xl text-sm text-white/90 drop-shadow-sm">{description}</p>
            {tagline && (
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-amber-50/85">
                {tagline}
              </p>
            )}
          </div>
        </div>
        {children && <div className="relative shrink-0">{children}</div>}
      </div>
    </div>
  );
}
