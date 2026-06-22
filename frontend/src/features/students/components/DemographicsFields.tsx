import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { AdmissionCategorySelect } from '@/components/lookups/AdmissionCategorySelect';
import { BloodGroupSelect } from '@/components/lookups/BloodGroupSelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  CreateStudentFormValues,
  UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';

type DemographicsFieldsProps = {
  register: UseFormRegister<CreateStudentFormValues | UpdateStudentFormValues>;
  errors: FieldErrors<CreateStudentFormValues | UpdateStudentFormValues>;
  bloodGroupId?: string;
  admissionCategoryId?: string;
  onBloodGroupChange: (value: string) => void;
  onAdmissionCategoryChange: (value: string) => void;
  isCreate?: boolean;
  createRegister?: UseFormRegister<CreateStudentFormValues>;
};

export function DemographicsFields({
  register,
  errors,
  bloodGroupId,
  admissionCategoryId,
  onBloodGroupChange,
  onAdmissionCategoryChange,
  isCreate = false,
  createRegister,
}: DemographicsFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
          {isCreate && createRegister && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="admissionNumber">Admission number</Label>
          <Input id="admissionNumber" {...createRegister('admissionNumber')} />
          {'admissionNumber' in errors && errors.admissionNumber && (
            <p className="text-sm text-destructive">{errors.admissionNumber.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" {...register('firstName')} />
        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" {...register('lastName')} />
        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of birth</Label>
        <Input id="dob" placeholder="DD/MM/YYYY" inputMode="numeric" {...register('dob')} />
        {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select id="gender" {...register('gender')}>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bloodGroupId">Blood group</Label>
        <BloodGroupSelect
          id="bloodGroupId"
          value={bloodGroupId}
          onChange={onBloodGroupChange}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admissionCategoryId">Admission category</Label>
        <AdmissionCategorySelect
          id="admissionCategoryId"
          value={admissionCategoryId}
          onChange={onAdmissionCategoryChange}
          placeholder="Optional"
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="medicalAlerts">Medical alerts</Label>
        <Textarea id="medicalAlerts" rows={3} {...register('medicalAlerts')} />
        {errors.medicalAlerts && (
          <p className="text-sm text-destructive">{errors.medicalAlerts.message}</p>
        )}
      </div>
    </div>
  );
}
