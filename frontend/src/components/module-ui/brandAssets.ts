/** Brand assets under frontend/public/assets */
export const BRAND = {
  logo: '/assets/logo.png',
  favicon: '/favicon.png',
} as const;

/**
 * Module photo banners — prefer web-sized images (~200–700KB).
 * Note: /assets/banner.jpg is ~50MB and is intentionally not used until compressed.
 */
export const MODULE_BANNER_IMAGES = {
  temple: '/assets/hero-temple.jpg',
  students: '/assets/students-guruji.jpg',
  health: '/assets/students-pooja.jpg',
  documents: '/assets/hero-campus.jpg',
  staff: '/assets/hero-slider.jpg',
  remarks: '/assets/hero-gallery.jpg',
  import: '/assets/hero-campus.jpg',
  audit: '/assets/hero-slider.jpg',
  lookups: '/assets/hero-gallery.jpg',
} as const;

export type ModuleBannerKey = keyof typeof MODULE_BANNER_IMAGES;
