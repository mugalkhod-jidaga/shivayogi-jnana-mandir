import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/locales/en/common.json';
import enStudents from '@/locales/en/students.json';
import knCommon from '@/locales/kn/common.json';
import knStudents from '@/locales/kn/students.json';

export const SUPPORTED_LOCALES = ['en', 'kn'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon, students: enStudents },
      kn: { common: knCommon, students: knStudents },
    },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: ['common', 'students'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'locale',
      caches: ['localStorage'],
    },
  });

export default i18n;

export function getApiLocale(): AppLocale {
  const lang = i18n.language?.split('-')[0];
  return lang === 'kn' ? 'kn' : 'en';
}
