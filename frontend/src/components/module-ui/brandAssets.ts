/** Brand assets under frontend/public/assets */

export type ResponsiveImage = {
  /** Fallback src (smallest jpeg) */
  src: string;
  srcSetWebp: string;
  srcSetJpeg: string;
  sizes: string;
};

function responsive(
  baseName: string,
  widths: number[],
  sizes: string,
): ResponsiveImage {
  const webp = widths.map((w) => `/assets/optimized/${baseName}-${w}.webp ${w}w`).join(', ');
  const jpeg = widths.map((w) => `/assets/optimized/${baseName}-${w}.jpg ${w}w`).join(', ');
  return {
    src: `/assets/optimized/${baseName}-${widths[0]}.jpg`,
    srcSetWebp: webp,
    srcSetJpeg: jpeg,
    sizes,
  };
}

export const BRAND = {
  logo: '/assets/logo.png',
  favicon: '/favicon.png',
  /** Designed wide institutional banner (Kannada title + Guruji + students) */
  banner: '/assets/optimized/banner-1024.jpg',
  /** Cap at 1024w — login/dashboard don't need 1600px for a background strip */
  bannerImage: responsive('banner', [640, 1024], '(max-width: 640px) 100vw, 1024px'),
} as const;

/**
 * Module photo banners — optimized webp/jpeg variants under /assets/optimized.
 * Dashboard / Hostel / Login use BRAND.bannerImage (designed strip).
 */
export const MODULE_BANNER_IMAGES = {
  temple: BRAND.bannerImage,
  students: responsive('students-guruji', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
  health: responsive('students-pooja', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
  documents: responsive('hero-campus', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
  staff: responsive('hero-slider', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
  remarks: responsive('hero-gallery', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
  import: responsive('hero-campus', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
  audit: responsive('hero-slider', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
  lookups: responsive('hero-gallery', [640, 1024], '(max-width: 768px) 100vw, 1024px'),
} as const;

export type ModuleBannerKey = keyof typeof MODULE_BANNER_IMAGES;

/** Modules that use the designed brand banner (already has Kannada title) */
export const BRAND_BANNER_MODULES: ReadonlySet<ModuleBannerKey> = new Set(['temple']);

export function resolveBannerImage(
  module: ModuleBannerKey,
  imageSrc?: string | ResponsiveImage,
): ResponsiveImage | { src: string } {
  if (imageSrc && typeof imageSrc === 'object' && 'srcSetWebp' in imageSrc) {
    return imageSrc;
  }
  if (typeof imageSrc === 'string') {
    return { src: imageSrc };
  }
  return MODULE_BANNER_IMAGES[module] ?? MODULE_BANNER_IMAGES.temple;
}
