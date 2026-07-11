import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BRAND,
  BRAND_BANNER_MODULES,
  resolveBannerImage,
  type ModuleBannerKey,
  type ResponsiveImage,
} from '@/components/module-ui/brandAssets';
import { MODULE_GRADIENTS } from '@/components/module-ui/moduleGradients';
import { cn } from '@/lib/utils';

type ModuleHeroBannerProps = {
  title?: string;
  description?: string;
  tagline?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  className?: string;
  /** Module key — picks gradient + photo banner */
  module?: ModuleBannerKey;
  gradientClassName?: string;
  imageSrc?: string | ResponsiveImage;
  logoSrc?: string;
  /** Replaces the default brand logo square (e.g. student photo / initials). */
  logoSlot?: ReactNode;
  showInstitution?: boolean;
  /**
   * `brand` = designed institutional banner (lighter overlay, taller crop).
   * `photo` = regular photo with stronger color wash.
   * Auto-detected when image is BRAND.banner.
   */
  variant?: 'photo' | 'brand';
};

function BannerPicture({
  image,
  alt,
  className,
  priority,
}: {
  image: ResponsiveImage | { src: string };
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const isResponsive = 'srcSetWebp' in image;
  if (!isResponsive) {
    return (
      <img
        src={image.src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
      />
    );
  }

  return (
    <picture>
      <source type="image/webp" srcSet={image.srcSetWebp} sizes={image.sizes} />
      <source type="image/jpeg" srcSet={image.srcSetJpeg} sizes={image.sizes} />
      <img
        src={image.src}
        alt={alt}
        className={className}
        sizes={image.sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
      />
    </picture>
  );
}

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
  logoSlot,
  showInstitution,
  variant,
}: ModuleHeroBannerProps) {
  const { t } = useTranslation();
  const gradient = gradientClassName ?? MODULE_GRADIENTS[module];
  const photo = resolveBannerImage(module, imageSrc);
  const photoSrc = photo.src;
  const isBrandBanner =
    variant === 'brand' ||
    photoSrc.includes('/banner-') ||
    photoSrc === BRAND.banner ||
    (variant !== 'photo' && BRAND_BANNER_MODULES.has(module));
  const showName = showInstitution ?? !isBrandBanner;
  const showLogoBox = Boolean(Icon || logoSlot);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10 text-white shadow-lg',
        isBrandBanner
          ? 'min-h-[120px] sm:aspect-[5/1] sm:min-h-[180px] md:min-h-[220px]'
          : 'min-h-[100px] sm:min-h-[120px]',
        className,
      )}
    >
      <BannerPicture
        image={photo}
        alt={isBrandBanner ? t('appName') : ''}
        priority={module === 'temple'}
        className={cn(
          'absolute inset-0 size-full',
          isBrandBanner
            ? 'object-cover object-center sm:object-contain bg-[#5c0a1a]'
            : 'object-cover',
        )}
      />
      {isBrandBanner ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/20 sm:from-black/45 sm:via-black/15 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/15" />
        </>
      ) : (
        <>
          <div className={cn('absolute inset-0 bg-gradient-to-br opacity-85', gradient)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-black/10" />
        </>
      )}

      <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-6">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {showLogoBox && (
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 shadow-md ring-1 ring-white/40 sm:size-14">
              {logoSlot ?? (
                <img
                  src={logoSrc}
                  alt={t('appName')}
                  className="size-full object-contain p-1.5"
                  width={48}
                  height={48}
                />
              )}
            </div>
          )}
          <div className="min-w-0">
            {showName && (
              <p className="text-[10px] font-semibold tracking-[0.14em] text-amber-100/95 sm:text-xs">
                {t('appName')}
              </p>
            )}
            <div className={cn('flex items-center gap-2', showName && 'mt-0.5 sm:mt-1')}>
              <h1 className="text-xl font-bold tracking-tight drop-shadow-sm sm:text-2xl">{title}</h1>
              {Icon && (
                <span className="hidden rounded-lg bg-white/15 p-1.5 backdrop-blur-sm sm:inline-flex">
                  <Icon className="size-4 text-white/90" strokeWidth={2.25} />
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 hidden max-w-xl text-sm text-white/90 drop-shadow-sm sm:block">
                {description}
              </p>
            )}
            {tagline && (
              <p className="mt-1 hidden text-xs font-medium uppercase tracking-wider text-amber-50/85 sm:mt-2 sm:block">
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
