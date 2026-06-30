import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();
  const familyErrors = errors.familyDetails;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="fatherName">{t('form.fields.fatherName')}</Label>
        <Input id="fatherName" {...register('familyDetails.fatherName')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="motherName">{t('form.fields.motherName')}</Label>
        <Input id="motherName" {...register('familyDetails.motherName')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="guardianName">{t('form.fields.guardianName')}</Label>
        <Input id="guardianName" {...register('familyDetails.guardianName')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="parentStatus">{t('form.fields.parentStatus')}</Label>
        <Select id="parentStatus" {...register('familyDetails.parentStatus')}>
          <option value="Both Alive">{tc('parentStatus.bothAlive')}</option>
          <option value="Single Mother">{tc('parentStatus.singleMother')}</option>
          <option value="Orphan">{tc('parentStatus.orphan')}</option>
        </Select>
        {familyErrors?.parentStatus && (
          <p className="text-sm text-destructive">{familyErrors.parentStatus.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="annualIncome">{t('form.fields.annualIncome')}</Label>
        <Input id="annualIncome" type="number" min={0} {...register('familyDetails.annualIncome')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryContact">{t('form.fields.primaryContact')}</Label>
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
        <Label htmlFor="houseDetails">{t('form.fields.houseDetails')}</Label>
        <Input id="houseDetails" {...register('familyDetails.houseDetails')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="villageTown">{t('form.fields.villageTown')}</Label>
        <Input id="villageTown" {...register('familyDetails.villageTown')} />
        {familyErrors?.villageTown && (
          <p className="text-sm text-destructive">{familyErrors.villageTown.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="talukMandal">{t('form.fields.talukMandal')}</Label>
        <Input id="talukMandal" {...register('familyDetails.talukMandal')} />
        {familyErrors?.talukMandal && (
          <p className="text-sm text-destructive">{familyErrors.talukMandal.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="district">{t('form.fields.district')}</Label>
        <Input id="district" {...register('familyDetails.district')} />
        {familyErrors?.district && (
          <p className="text-sm text-destructive">{familyErrors.district.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="state">{t('form.fields.state')}</Label>
        <Input id="state" {...register('familyDetails.state')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pincode">{t('form.fields.pincode')}</Label>
        <Input id="pincode" {...register('familyDetails.pincode')} />
        {familyErrors?.pincode && (
          <p className="text-sm text-destructive">{familyErrors.pincode.message}</p>
        )}
      </div>
    </div>
  );
}
