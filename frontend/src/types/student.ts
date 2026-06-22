export type LookupRef = {
  id: number;
  value: string;
} | null;

export type StudentStatus = 'Active' | 'Alumni' | 'Discontinued';
export type ParentStatus = 'Both Alive' | 'Single Mother' | 'Orphan';
export type Gender = 'Male' | 'Female' | 'Other';

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
  medicalAlerts: string | null;
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

export type CreateStudentPayload = {
  admissionNumber: string;
  firstName: string;
  lastName?: string;
  dob: string;
  gender: Gender;
  bloodGroupId?: number;
  admissionCategoryId?: number;
  medicalAlerts?: string;
  familyDetails: FamilyDetails;
};

export type UpdateStudentPayload = {
  firstName?: string;
  lastName?: string | null;
  dob?: string;
  gender?: Gender;
  bloodGroupId?: number | null;
  admissionCategoryId?: number | null;
  medicalAlerts?: string | null;
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
