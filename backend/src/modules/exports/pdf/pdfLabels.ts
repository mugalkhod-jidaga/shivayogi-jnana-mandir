export type PdfLocale = 'en' | 'kn';

type PdfLabelSet = {
  generated: string;
  studentList: string;
  studentProfile: string;
  studentProfileSubtitle: string;
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
  socialCategory: string;
  noPhoto: string;
  sections: {
    basic: string;
    academic: string;
    emergency: string;
    social: string;
    family: string;
    health: string;
  };
  motherTongue: string;
  bloodGroup: string;
  admissionDate: string;
  aadhaarNumber: string;
  satsId: string;
  satsTransferStatus: string;
  statusReason: string;
  academicYear: string;
  previousSchool: string;
  previousSchoolAddress: string;
  lastClassStudied: string;
  relationship: string;
  phone: string;
  religion: string;
  caste: string;
  subCaste: string;
  rdNumber: string;
  rdNumberSecondary: string;
  father: string;
  mother: string;
  guardian: string;
  parentStatus: string;
  annualIncome: string;
  primaryContact: string;
  houseDetails: string;
  villageTown: string;
  talukMandal: string;
  district: string;
  state: string;
  pincode: string;
  healthStatus: string;
  medicalAlerts: string;
};

const LABELS: Record<PdfLocale, PdfLabelSet> = {
  en: {
    generated: 'Generated',
    studentList: 'Student List',
    studentProfile: 'Student Profile',
    studentProfileSubtitle: 'Complete student record',
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
    socialCategory: 'Social category',
    noPhoto: 'No photo',
    sections: {
      basic: 'Basic information',
      academic: 'Academic placement',
      emergency: 'Emergency contact',
      social: 'Social & caste details',
      family: 'Family & address',
      health: 'Health summary',
    },
    motherTongue: 'Mother tongue',
    bloodGroup: 'Blood group',
    admissionDate: 'Admission date',
    aadhaarNumber: 'Aadhaar',
    satsId: 'SATS ID',
    satsTransferStatus: 'SATS transfer',
    statusReason: 'Status reason',
    academicYear: 'Academic year',
    previousSchool: 'Previous school',
    previousSchoolAddress: 'Previous school address',
    lastClassStudied: 'Last class studied',
    relationship: 'Relationship',
    phone: 'Phone',
    religion: 'Religion',
    caste: 'Caste',
    subCaste: 'Sub-caste',
    rdNumber: 'RD number',
    rdNumberSecondary: 'Income RD',
    father: 'Father',
    mother: 'Mother',
    guardian: 'Guardian',
    parentStatus: 'Parent status',
    annualIncome: 'Annual income',
    primaryContact: 'Primary contact',
    houseDetails: 'House / door no.',
    villageTown: 'Village / town',
    talukMandal: 'Taluk / mandal',
    district: 'District',
    state: 'State',
    pincode: 'Pincode',
    healthStatus: 'Health status',
    medicalAlerts: 'Medical alerts',
  },
  kn: {
    generated: 'ರಚಿಸಿದ ಸಮಯ',
    studentList: 'ವಿದ್ಯಾರ್ಥಿ ಪಟ್ಟಿ',
    studentProfile: 'ವಿದ್ಯಾರ್ಥಿ ಪ್ರೊಫೈಲ್',
    studentProfileSubtitle: 'ಸಂಪೂರ್ಣ ವಿದ್ಯಾರ್ಥಿ ವಿವರ',
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
    socialCategory: 'ಸಾಮಾಜಿಕ ವರ್ಗ',
    noPhoto: 'ಫೋಟೋ ಇಲ್ಲ',
    sections: {
      basic: 'ಮೂಲ ಮಾಹಿತಿ',
      academic: 'ಶೈಕ್ಷಣಿಕ ವಿವರ',
      emergency: 'ತುರ್ತು ಸಂಪರ್ಕ',
      social: 'ಸಾಮಾಜಿಕ ಮತ್ತು ಜಾತಿ ವಿವರ',
      family: 'ಕುಟುಂಬ ಮತ್ತು ವಿಳಾಸ',
      health: 'ಆರೋಗ್ಯ ಸಾರಾಂಶ',
    },
    motherTongue: 'ಮಾತೃ ಭಾಷೆ',
    bloodGroup: 'ರಕ್ತ ಗುಂಪು',
    admissionDate: 'ಪ್ರವೇಶ ದಿನಾಂಕ',
    aadhaarNumber: 'ಆಧಾರ್',
    satsId: 'SATS ID',
    satsTransferStatus: 'SATS ವರ್ಗಾವಣೆ',
    statusReason: 'ಸ್ಥಿತಿ ಕಾರಣ',
    academicYear: 'ಶೈಕ್ಷಣಿಕ ವರ್ಷ',
    previousSchool: 'ಹಿಂದಿನ ಶಾಲೆ',
    previousSchoolAddress: 'ಹಿಂದಿನ ಶಾಲೆ ವಿಳಾಸ',
    lastClassStudied: 'ಕೊನೆಯ ತರಗತಿ',
    relationship: 'ಸಂಬಂಧ',
    phone: 'ಫೋನ್',
    religion: 'ಧರ್ಮ',
    caste: 'ಜಾತಿ',
    subCaste: 'ಉಪಜಾತಿ',
    rdNumber: 'RD ಸಂಖ್ಯೆ',
    rdNumberSecondary: 'ಆದಾಯ RD',
    father: 'ತಂದೆ',
    mother: 'ತಾಯಿ',
    guardian: 'ಪೋಷಕ',
    parentStatus: 'ಪೋಷಕ ಸ್ಥಿತಿ',
    annualIncome: 'ವಾರ್ಷಿಕ ಆದಾಯ',
    primaryContact: 'ಪ್ರಾಥಮಿಕ ಸಂಪರ್ಕ',
    houseDetails: 'ಮನೆ / ದ್ವಾರ ಸಂಖ್ಯೆ',
    villageTown: 'ಗ್ರಾಮ / ಪಟ್ಟಣ',
    talukMandal: 'ತಾಲೂಕು / ಮಂಡಲ',
    district: 'ಜಿಲ್ಲೆ',
    state: 'ರಾಜ್ಯ',
    pincode: 'ಪಿನ್ ಕೋಡ್',
    healthStatus: 'ಆರೋಗ್ಯ ಸ್ಥಿತಿ',
    medicalAlerts: 'ವೈದ್ಯಕೀಯ ಎಚ್ಚರಿಕೆ',
  },
};

export function pdfLocaleFromHeader(acceptLanguage?: string): PdfLocale {
  const lang = acceptLanguage?.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
  return lang === 'kn' ? 'kn' : 'en';
}

export function pdfLabels(locale: PdfLocale): PdfLabelSet {
  return LABELS[locale];
}
