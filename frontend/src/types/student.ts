export type LookupRef = {
  id: number;
  value: string;
} | null;

export type StudentStatus = 'Active' | 'Alumni' | 'Discontinued';
export type ParentStatus = 'Both Alive' | 'Single Mother' | 'Orphan';
export type Gender = 'Male' | 'Female' | 'Other';

export type CurrentEnrollment = {
  id: string;
  rollNumber: string | null;
  previousSchool: string | null;
  lastClassStudied: string | null;
  enrolledAt: string;
  academicYear: LookupRef & { isCurrent?: boolean };
  standard: LookupRef & { sortOrder?: number };
  section: LookupRef | null;
};

export type EmergencyContact = {
  id?: string;
  contactName: string;
  relationship: string;
  phone: string;
};

export type StudentSummary = {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string | null;
  dob: string;
  gender: Gender;
  photoUrl: string | null;
  bloodGroup: LookupRef;
  admissionCategory: LookupRef;
  motherTongue: LookupRef;
  admissionDate: string;
  aadhaarNumber: string | null;
  currentEnrollment: CurrentEnrollment | null;
  emergencyContacts: EmergencyContact[];
  status: StudentStatus;
  statusReason: string | null;
  statusChangedAt: string | null;
};

export type FamilyDetails = {
  fatherName?: string | null;
  motherName?: string | null;
  guardianName?: string | null;
  parentStatus: ParentStatus;
  annualIncome?: number | null;
  primaryContact: string;
  houseDetails?: string | null;
  villageTown: string;
  talukMandal: string;
  district: string;
  state: string;
  pincode: string;
};

export type StudentDetail = StudentSummary & {
  familyDetails?: FamilyDetails | null;
};

export type AcademicPlacementPayload = {
  academicYearId: number;
  standardId: number;
  sectionId?: number;
  rollNumber: string;
  previousSchool?: string;
  lastClassStudied?: string;
  enrolledAt?: string;
};

export type CreateStudentPayload = {
  admissionNumber: string;
  firstName: string;
  lastName?: string;
  dob: string;
  gender: Gender;
  bloodGroupId?: number;
  admissionCategoryId?: number;
  admissionDate: string;
  motherTongueId?: number;
  aadhaarNumber?: string;
  academicPlacement: AcademicPlacementPayload;
  emergencyContacts: EmergencyContact[];
  familyDetails: FamilyDetails;
};

export type UpdateStudentPayload = {
  firstName?: string;
  lastName?: string | null;
  dob?: string;
  gender?: Gender;
  bloodGroupId?: number | null;
  admissionCategoryId?: number | null;
  admissionDate?: string;
  motherTongueId?: number | null;
  aadhaarNumber?: string | null;
  academicPlacement?: Partial<AcademicPlacementPayload>;
  emergencyContacts?: EmergencyContact[];
  familyDetails?: Partial<FamilyDetails>;
};

export type DeactivateStudentPayload = {
  statusReason: string;
  status: 'Alumni' | 'Discontinued';
};

export type AvatarPresignResponse = {
  uploadUrl: string;
  key: string;
};

export type AvatarDownloadResponse = {
  downloadUrl: string;
};

export type StudentListFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: StudentStatus;
  standardId?: number;
  sectionId?: number;
  academicYearId?: number;
  admissionCategoryId?: number;
};
