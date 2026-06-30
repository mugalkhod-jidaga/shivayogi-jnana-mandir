import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AcademicStandardSelect } from '@/components/lookups/AcademicStandardSelect';
import { AcademicYearSelect } from '@/components/lookups/AcademicYearSelect';
import { SectionSelect } from '@/components/lookups/SectionSelect';
import type {
  CreateStudentFormValues,
  UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';

type AcademicPlacementFieldsProps = {
  register: UseFormRegister<CreateStudentFormValues | UpdateStudentFormValues>;
  errors: FieldErrors<CreateStudentFormValues | UpdateStudentFormValues>;
  academicYearId: string;
  standardId: string;
  sectionId: string;
  onAcademicYearChange: (value: string) => void;
  onStandardChange: (value: string) => void;
  onSectionChange: (value: string) => void;
};

export function AcademicPlacementFields({
  register,
  errors,
  academicYearId,
  standardId,
  sectionId,
  onAcademicYearChange,
  onStandardChange,
  onSectionChange,
}: AcademicPlacementFieldsProps) {
  const { t } = useTranslation('students');
  const academicErrors = errors.academicPlacement;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="academicYearId">{t('form.fields.academicYear')}</Label>
        <AcademicYearSelect
          id="academicYearId"
          value={academicYearId}
          onChange={onAcademicYearChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="standardId">{t('form.fields.standard')}</Label>
        <AcademicStandardSelect id="standardId" value={standardId} onChange={onStandardChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sectionId">{t('form.fields.section')}</Label>
        <SectionSelect id="sectionId" value={sectionId} onChange={onSectionChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rollNumber">{t('form.fields.rollNumber')}</Label>
        <Input id="rollNumber" {...register('academicPlacement.rollNumber')} />
        {academicErrors?.rollNumber && (
          <p className="text-sm text-destructive">{academicErrors.rollNumber.message}</p>
        )}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="previousSchool">{t('form.fields.previousSchool')}</Label>
        <Input id="previousSchool" {...register('academicPlacement.previousSchool')} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="previousSchoolAddress">{t('form.fields.previousSchoolAddress')}</Label>
        <Textarea
          id="previousSchoolAddress"
          rows={3}
          {...register('academicPlacement.previousSchoolAddress')}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="lastClassStudied">{t('form.fields.lastClassStudied')}</Label>
        <Input id="lastClassStudied" {...register('academicPlacement.lastClassStudied')} />
      </div>
    </div>
  );
}
