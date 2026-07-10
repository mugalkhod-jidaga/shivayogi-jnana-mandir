/** Shared accent palette — warm saffron, dignified indigo, fresh sky, growth emerald */
export const MODULE_ACCENTS = {
  saffron: {
    ring: 'ring-orange-200/80 dark:ring-orange-900/50',
    icon: 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-orange-200/50',
    card: 'border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50/80 dark:from-orange-950/40 dark:to-amber-950/20 dark:border-orange-900/40',
    bar: 'bg-gradient-to-r from-orange-400 to-amber-500',
  },
  indigo: {
    ring: 'ring-indigo-200/80 dark:ring-indigo-900/50',
    icon: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-200/50',
    card: 'border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50/80 dark:from-indigo-950/40 dark:to-violet-950/20 dark:border-indigo-900/40',
    bar: 'bg-gradient-to-r from-indigo-500 to-violet-600',
  },
  sky: {
    ring: 'ring-sky-200/80 dark:ring-sky-900/50',
    icon: 'bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-sky-200/50',
    card: 'border-sky-200/60 bg-gradient-to-br from-sky-50 to-cyan-50/80 dark:from-sky-950/40 dark:to-cyan-950/20 dark:border-sky-900/40',
    bar: 'bg-gradient-to-r from-sky-500 to-cyan-500',
  },
  emerald: {
    ring: 'ring-emerald-200/80 dark:ring-emerald-900/50',
    icon: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-200/50',
    card: 'border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/20 dark:border-emerald-900/40',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  },
  rose: {
    ring: 'ring-rose-200/80 dark:ring-rose-900/50',
    icon: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-200/50',
    card: 'border-rose-200/60 bg-gradient-to-br from-rose-50 to-pink-50/80 dark:from-rose-950/40 dark:to-pink-950/20 dark:border-rose-900/40',
    bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
  },
} as const;

export type ModuleAccent = keyof typeof MODULE_ACCENTS;
