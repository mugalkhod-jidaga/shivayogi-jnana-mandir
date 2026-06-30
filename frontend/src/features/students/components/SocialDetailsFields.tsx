import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ReligionSelect } from '@/components/lookups/ReligionSelect';
import { SocialCategorySelect } from '@/components/lookups/SocialCategorySelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  CreateStudentFormValues,
  UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';

type SocialDetailsFieldsProps = {
  register: UseFormRegister<CreateStudentFormValues | UpdateStudentFormValues>;
  errors: FieldErrors<CreateStudentFormValues | UpdateStudentFormValues>;
  religionId: string;
  socialCategoryId: string;
  onReligionChange: (value: string) => void;
  onSocialCategoryChange: (value: string) => void;
};

export function SocialDetailsFields({
  register,
  errors,
  religionId,
  socialCategoryId,
  onReligionChange,
  onSocialCategoryChange,
}: SocialDetailsFieldsProps) {
  const { t } = useTranslation('students');
  const socialErrors = errors.socialDetails;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="religionId">{t('form.fields.religion')}</Label>
        <ReligionSelect id="religionId" value={religionId} onChange={onReligionChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="socialCategoryId">{t('form.fields.socialCategory')}</Label>
        <SocialCategorySelect
          id="socialCategoryId"
          value={socialCategoryId}
          onChange={onSocialCategoryChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caste">{t('form.fields.caste')}</Label>
        <Input id="caste" {...register('socialDetails.caste')} />
        {socialErrors?.caste && (
          <p className="text-sm text-destructive">{socialErrors.caste.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subCaste">{t('form.fields.subCaste')}</Label>
        <Input id="subCaste" {...register('socialDetails.subCaste')} />
        {socialErrors?.subCaste && (
          <p className="text-sm text-destructive">{socialErrors.subCaste.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rdNumber">{t('form.fields.rdNumber')}</Label>
        <Input id="rdNumber" {...register('socialDetails.rdNumber')} />
        {socialErrors?.rdNumber && (
          <p className="text-sm text-destructive">{socialErrors.rdNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rdNumberSecondary">{t('form.fields.rdNumberSecondary')}</Label>
        <Input id="rdNumberSecondary" {...register('socialDetails.rdNumberSecondary')} />
        {socialErrors?.rdNumberSecondary && (
          <p className="text-sm text-destructive">{socialErrors.rdNumberSecondary.message}</p>
        )}
      </div>
    </div>
  );
}
