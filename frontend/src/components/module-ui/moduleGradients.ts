/** Hero banner gradient presets per module */
export const MODULE_GRADIENTS = {
  temple: 'from-orange-500 via-amber-500 to-indigo-600 border-orange-200/60 dark:border-orange-900/40',
  students: 'from-indigo-600 via-violet-600 to-sky-500 border-indigo-200/60 dark:border-indigo-900/40',
  health: 'from-teal-600 via-emerald-600 to-cyan-500 border-teal-200/60 dark:border-teal-900/40',
  documents: 'from-blue-600 via-indigo-600 to-violet-500 border-blue-200/60 dark:border-blue-900/40',
  staff: 'from-violet-600 via-purple-600 to-fuchsia-500 border-violet-200/60 dark:border-violet-900/40',
  remarks: 'from-amber-500 via-orange-500 to-rose-500 border-amber-200/60 dark:border-amber-900/40',
  import: 'from-emerald-600 via-teal-600 to-cyan-500 border-emerald-200/60 dark:border-emerald-900/40',
  audit: 'from-slate-600 via-gray-600 to-zinc-600 border-slate-200/60 dark:border-slate-800/40',
  lookups: 'from-rose-500 via-pink-500 to-fuchsia-500 border-rose-200/60 dark:border-rose-900/40',
} as const;

export type ModuleGradient = keyof typeof MODULE_GRADIENTS;

export const MODULE_NAV_THEMES = {
  saffron: {
    nav: 'border-orange-200/50 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-indigo-50/80 dark:border-orange-900/30 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-indigo-950/30',
    active:
      'bg-white text-orange-900 shadow-md ring-1 ring-orange-200/80 dark:bg-orange-950/60 dark:text-orange-100 dark:ring-orange-800/50',
    inactive: 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5',
  },
  indigo: {
    nav: 'border-indigo-200/50 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-sky-50/80 dark:border-indigo-900/30 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-sky-950/30',
    active:
      'bg-white text-indigo-900 shadow-md ring-1 ring-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-100 dark:ring-indigo-800/50',
    inactive: 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5',
  },
  teal: {
    nav: 'border-teal-200/50 bg-gradient-to-r from-teal-50/80 via-emerald-50/50 to-cyan-50/80 dark:border-teal-900/30 dark:from-teal-950/30 dark:via-emerald-950/20 dark:to-cyan-950/30',
    active:
      'bg-white text-teal-900 shadow-md ring-1 ring-teal-200/80 dark:bg-teal-950/60 dark:text-teal-100 dark:ring-teal-800/50',
    inactive: 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5',
  },
  violet: {
    nav: 'border-violet-200/50 bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-fuchsia-50/80 dark:border-violet-900/30 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/30',
    active:
      'bg-white text-violet-900 shadow-md ring-1 ring-violet-200/80 dark:bg-violet-950/60 dark:text-violet-100 dark:ring-violet-800/50',
    inactive: 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5',
  },
  slate: {
    nav: 'border-slate-200/50 bg-gradient-to-r from-slate-50/80 via-gray-50/50 to-zinc-50/80 dark:border-slate-800/30 dark:from-slate-950/30 dark:via-gray-950/20 dark:to-zinc-950/30',
    active:
      'bg-white text-slate-900 shadow-md ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-700/50',
    inactive: 'text-muted-foreground hover:bg-white/70 hover:text-foreground dark:hover:bg-white/5',
  },
} as const;

export type ModuleNavTheme = keyof typeof MODULE_NAV_THEMES;
