/** Brand assets under frontend/public/assets */
export const BRAND = {
  logo: '/assets/logo.png',
  favicon: '/favicon.png',
  /** Designed wide institutional banner (Kannada title + Guruji + students) */
  banner: '/assets/banner.jpg',
} as const;

/**
 * Module photo banners — prefer web-sized images (~200–700KB).
 * Dashboard / Hostel / Login use BRAND.banner (designed strip).
 */
export const MODULE_BANNER_IMAGES = {
  temple: BRAND.banner,
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

/** Modules that use the designed brand banner (already has Kannada title) */
export const BRAND_BANNER_MODULES: ReadonlySet<ModuleBannerKey> = new Set(['temple']);
