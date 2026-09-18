import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AdmissionCategorySelect } from '@/components/lookups/AdmissionCategorySelect';
import { BloodGroupSelect } from '@/components/lookups/BloodGroupSelect';
import { LanguageSelect } from '@/components/lookups/LanguageSelect';
import { DateField } from '@/components/ui/date-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import type { CreateStudentFormValues } from '@/features/students/schemas/studentForm.schema';

type StudentFormValues = CreateStudentFormValues;

type DemographicsFieldsProps = {
  register: UseFormRegister<StudentFormValues>;
  control: Control<StudentFormValues>;
  errors: FieldErrors<StudentFormValues>;
  bloodGroupId?: string;
  admissionCategoryId?: string;
  motherTongueId?: string;
  onBloodGroupChange: (value: string) => void;
  onAdmissionCategoryChange: (value: string) => void;
  onMotherTongueChange: (value: string) => void;
  isCreate?: boolean;
  nextAdmissionNumber?: string;
  isLoadingAdmissionNumber?: boolean;
};

export function DemographicsFields({
  register,
  control,
  errors,
  bloodGroupId,
  admissionCategoryId,
  motherTongueId,
  onBloodGroupChange,
  onAdmissionCategoryChange,
  onMotherTongueChange,
  isCreate = false,
  nextAdmissionNumber,
  isLoadingAdmissionNumber,
}: DemographicsFieldsProps) {
  const { t } = useTranslation('students');
  const { t: tc } = useTranslation();

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {isCreate && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="admissionNumber">{t('form.nextAdmissionNumber')}</Label>
          <Input
            id="admissionNumber"
            placeholder={
              isLoadingAdmissionNumber
                ? t('form.admissionNumberLoading')
                : (nextAdmissionNumber ?? 'SJM00001')
            }
            className="font-mono"
            {...register('admissionNumber')}
          />
          {errors.admissionNumber && (
            <p className="text-sm text-destructive">{errors.admissionNumber.message}</p>
          )}
          <p className="text-xs text-muted-foreground">{t('form.nextAdmissionHelp')}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="firstName">{t('form.fields.firstName')}</Label>
        <Input id="firstName" {...register('firstName')} />
        {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">{t('form.fields.lastName')}</Label>
        <Input id="lastName" {...register('lastName')} />
        {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="nameEnglish">{t('form.fields.nameEnglish')}</Label>
        <Input id="nameEnglish" {...register('nameEnglish')} />
        {errors.nameEnglish && (
          <p className="text-sm text-destructive">{errors.nameEnglish.message}</p>
        )}
        <p className="text-xs text-muted-foreground">{t('form.nameEnglishHelp')}</p>
      </div>

      <DateField
        control={control}
        name="dob"
        id="dob"
        label={t('form.fields.dob')}
        error={errors.dob?.message}
      />

      <DateField
        control={control}
        name="admissionDate"
        id="admissionDate"
        label={t('form.fields.admissionDate')}
        error={errors.admissionDate?.message}
      />

      <div className="space-y-2">
        <Label htmlFor="gender">{t('form.fields.gender')}</Label>
        <Select id="gender" {...register('gender')}>
          <option value="Male">{tc('gender.male')}</option>
          <option value="Female">{tc('gender.female')}</option>
          <option value="Other">{tc('gender.other')}</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="motherTongueId">{t('form.fields.motherTongue')}</Label>
        <LanguageSelect
          id="motherTongueId"
          value={motherTongueId}
          onChange={onMotherTongueChange}
          placeholder={tc('optional')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bloodGroupId">{t('form.fields.bloodGroup')}</Label>
        <BloodGroupSelect
          id="bloodGroupId"
          value={bloodGroupId}
          onChange={onBloodGroupChange}
          placeholder={tc('optional')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admissionCategoryId">{t('form.fields.admissionCategory')}</Label>
        <AdmissionCategorySelect
          id="admissionCategoryId"
          value={admissionCategoryId}
          onChange={onAdmissionCategoryChange}
          placeholder={tc('optional')}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="aadhaarNumber">{t('form.fields.aadhaarNumber')}</Label>
        <Input
          id="aadhaarNumber"
          inputMode="numeric"
          maxLength={12}
          placeholder={t('form.fields.aadhaarPlaceholder')}
          {...register('aadhaarNumber')}
        />
        {errors.aadhaarNumber && (
          <p className="text-sm text-destructive">{errors.aadhaarNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="satsId">{t('form.fields.satsId')}</Label>
        <Input
          id="satsId"
          inputMode="numeric"
          maxLength={9}
          placeholder={t('form.fields.satsIdPlaceholder')}
          {...register('satsId')}
        />
        {errors.satsId && <p className="text-sm text-destructive">{errors.satsId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="satsTransferStatus">{t('form.fields.satsTransferStatus')}</Label>
        <Select id="satsTransferStatus" {...register('satsTransferStatus')}>
          <option value="">{tc('notSet')}</option>
          <option value="Pending">{t('satsStatus.pending')}</option>
          <option value="Transferred">{t('satsStatus.transferred')}</option>
          <option value="NotApplicable">{t('satsStatus.notApplicable')}</option>
        </Select>
        {errors.satsTransferStatus && (
          <p className="text-sm text-destructive">{errors.satsTransferStatus.message}</p>
        )}
      </div>
    </div>
  );
}
