import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enAudit from '@/locales/en/audit.json';
import enAuth from '@/locales/en/auth.json';
import enCommon from '@/locales/en/common.json';
import enDashboard from '@/locales/en/dashboard.json';
import enDocuments from '@/locales/en/documents.json';
import enImport from '@/locales/en/import.json';
import enLookups from '@/locales/en/lookups.json';
import enStaff from '@/locales/en/staff.json';
import enStudents from '@/locales/en/students.json';
import enRemarks from '@/locales/en/remarks.json';
import enHostel from '@/locales/en/hostel.json';
import enMedical from '@/locales/en/medical.json';
import enHealth from '@/locales/en/health.json';
import knAudit from '@/locales/kn/audit.json';
import knAuth from '@/locales/kn/auth.json';
import knCommon from '@/locales/kn/common.json';
import knDashboard from '@/locales/kn/dashboard.json';
import knDocuments from '@/locales/kn/documents.json';
import knImport from '@/locales/kn/import.json';
import knLookups from '@/locales/kn/lookups.json';
import knStaff from '@/locales/kn/staff.json';
import knStudents from '@/locales/kn/students.json';
import knRemarks from '@/locales/kn/remarks.json';
import knHostel from '@/locales/kn/hostel.json';
import knMedical from '@/locales/kn/medical.json';
import knHealth from '@/locales/kn/health.json';

export const SUPPORTED_LOCALES = ['en', 'kn'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

const namespaces = [
  'common',
  'students',
  'auth',
  'dashboard',
  'staff',
  'lookups',
  'documents',
  'import',
  'audit',
  'remarks',
  'hostel',
  'medical',
  'health',
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        students: enStudents,
        auth: enAuth,
        dashboard: enDashboard,
        staff: enStaff,
        lookups: enLookups,
        documents: enDocuments,
        import: enImport,
        audit: enAudit,
        remarks: enRemarks,
        hostel: enHostel,
        medical: enMedical,
        health: enHealth,
      },
      kn: {
        common: knCommon,
        students: knStudents,
        auth: knAuth,
        dashboard: knDashboard,
        staff: knStaff,
        lookups: knLookups,
        documents: knDocuments,
        import: knImport,
        audit: knAudit,
        remarks: knRemarks,
        hostel: knHostel,
        medical: knMedical,
        health: knHealth,
      },
    },
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LOCALES],
    ns: [...namespaces],
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
