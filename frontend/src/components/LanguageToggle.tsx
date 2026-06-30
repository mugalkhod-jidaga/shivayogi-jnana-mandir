import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { lookupKeys } from '@/hooks/useLookups';
import { SUPPORTED_LOCALES, type AppLocale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();

  const current = (i18n.language?.split('-')[0] ?? 'en') as AppLocale;

  const changeLanguage = async (locale: AppLocale) => {
    await i18n.changeLanguage(locale);
    void queryClient.invalidateQueries({ queryKey: lookupKeys.all });
  };

  return (
    <div className="flex rounded-md border p-0.5 text-xs">
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className={cn(
            'rounded px-2 py-1 font-medium transition-colors',
            current === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => void changeLanguage(locale)}
        >
          {t(`language.${locale}`)}
        </button>
      ))}
    </div>
  );
}
