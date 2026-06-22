import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type {
  CreateStudentFormValues,
  UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';

type FamilyDetailsFieldsProps = {
  register: UseFormRegister<CreateStudentFormValues | UpdateStudentFormValues>;
  errors: FieldErrors<CreateStudentFormValues | UpdateStudentFormValues>;
};

export function FamilyDetailsFields({ register, errors }: FamilyDetailsFieldsProps) {
  const familyErrors = errors.familyDetails;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="fatherName">Father&apos;s name</Label>
        <Input id="fatherName" {...register('familyDetails.fatherName')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="motherName">Mother&apos;s name</Label>
        <Input id="motherName" {...register('familyDetails.motherName')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guardianName">Guardian&apos;s name</Label>
        <Input id="guardianName" {...register('familyDetails.guardianName')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentStatus">Parent status</Label>
        <Select id="parentStatus" {...register('familyDetails.parentStatus')}>
          <option value="Both Alive">Both Alive</option>
          <option value="Single Mother">Single Mother</option>
          <option value="Orphan">Orphan</option>
        </Select>
        {familyErrors?.parentStatus && (
          <p className="text-sm text-destructive">{familyErrors.parentStatus.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="annualIncome">Annual income (₹)</Label>
        <Input id="annualIncome" type="number" min={0} {...register('familyDetails.annualIncome')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryContact">Primary contact</Label>
        <div className="flex">
          <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            +91
          </span>
          <Input
            id="primaryContact"
            inputMode="numeric"
            className="rounded-l-none"
            {...register('familyDetails.primaryContact')}
          />
        </div>
        {familyErrors?.primaryContact && (
          <p className="text-sm text-destructive">{familyErrors.primaryContact.message}</p>
        )}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="houseDetails">House details</Label>
        <Input id="houseDetails" {...register('familyDetails.houseDetails')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="villageTown">Village / town</Label>
        <Input id="villageTown" {...register('familyDetails.villageTown')} />
        {familyErrors?.villageTown && (
          <p className="text-sm text-destructive">{familyErrors.villageTown.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="talukMandal">Taluk / mandal</Label>
        <Input id="talukMandal" {...register('familyDetails.talukMandal')} />
        {familyErrors?.talukMandal && (
          <p className="text-sm text-destructive">{familyErrors.talukMandal.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="district">District</Label>
        <Input id="district" {...register('familyDetails.district')} />
        {familyErrors?.district && (
          <p className="text-sm text-destructive">{familyErrors.district.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">State</Label>
        <Input id="state" {...register('familyDetails.state')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pincode">Pincode</Label>
        <Input id="pincode" {...register('familyDetails.pincode')} />
        {familyErrors?.pincode && (
          <p className="text-sm text-destructive">{familyErrors.pincode.message}</p>
        )}
      </div>
    </div>
  );
}
