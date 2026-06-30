export type PdfLocale = 'en' | 'kn';

type PdfLabelSet = {
  generated: string;
  studentList: string;
  studentProfile: string;
  remarks: string;
  search: string;
  admissionNumber: string;
  name: string;
  standard: string;
  status: string;
  gender: string;
  dob: string;
  section: string;
  rollNumber: string;
  date: string;
  student: string;
  type: string;
  title: string;
  category: string;
};

const LABELS: Record<PdfLocale, PdfLabelSet> = {
  en: {
    generated: 'Generated',
    studentList: 'Student List',
    studentProfile: 'Student Profile',
    remarks: 'Student Remarks',
    search: 'Search',
    admissionNumber: 'Admission #',
    name: 'Name',
    standard: 'Standard',
    status: 'Status',
    gender: 'Gender',
    dob: 'DOB',
    section: 'Section',
    rollNumber: 'Roll #',
    date: 'Date',
    student: 'Student',
    type: 'Type',
    title: 'Title',
    category: 'Category',
  },
  kn: {
    generated: 'ರಚಿಸಿದ ಸಮಯ',
    studentList: 'ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ',
    studentProfile: 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್',
    remarks: 'ವಿದ್ಯಾರ್ಥಿ ಟಿಪ್ಪಣಿಗಳು',
    search: 'ಹುಡುಕಾಟ',
    admissionNumber: 'ಪ್ರವೇಶ ಸಂಖ್ಯೆ',
    name: 'ಹೆಸರು',
    standard: 'ತರಗತಿ',
    status: 'ಸ್ಥಿತಿ',
    gender: 'ಲಿಂಗ',
    dob: 'ಜನ್ಮ ದಿನಾಂಕ',
    section: 'ವಿಭಾಗ',
    rollNumber: 'ರೋಲ್ ಸಂಖ್ಯೆ',
    date: 'ದಿನಾಂಕ',
    student: 'ವಿದ್ಯಾರ್ಥಿ',
    type: 'ಪ್ರಕಾರ',
    title: 'ಶೀರ್ಷಿಕೆ',
    category: 'ವರ್ಗ',
  },
};

export function pdfLocaleFromHeader(acceptLanguage?: string): PdfLocale {
  const lang = acceptLanguage?.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
  return lang === 'kn' ? 'kn' : 'en';
}

export function pdfLabels(locale: PdfLocale): PdfLabelSet {
  return LABELS[locale];
}
