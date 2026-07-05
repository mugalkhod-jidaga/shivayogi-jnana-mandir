import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ReligionSelect } from '@/components/lookups/ReligionSelect';
import { SocialCategorySelect } from '@/components/lookups/SocialCategorySelect';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  isGmSocialCategory,
  isObcSocialCategory,
  normalizeRdInput,
} from '@/features/students/schemas/karnatakaRd.validation';
import type { CreateStudentFormValues } from '@/features/students/schemas/studentForm.schema';

type StudentFormValues = CreateStudentFormValues;

type SocialDetailsFieldsProps = {
  register: UseFormRegister<StudentFormValues>;
  setValue: UseFormSetValue<StudentFormValues>;
  watch: UseFormWatch<StudentFormValues>;
  errors: FieldErrors<StudentFormValues>;
  religionId: string;
  socialCategoryId: string;
  socialCategoryCode: string;
  onReligionChange: (value: string) => void;
  onSocialCategoryChange: (value: string) => void;
};

export function SocialDetailsFields({
  register,
  setValue,
  watch,
  errors,
  religionId,
  socialCategoryId,
  socialCategoryCode,
  onReligionChange,
  onSocialCategoryChange,
}: SocialDetailsFieldsProps) {
  const { t } = useTranslation('students');
  const socialErrors = errors.socialDetails;
  const isGm = isGmSocialCategory(socialCategoryCode);
  const isObc = isObcSocialCategory(socialCategoryCode);

  const handleCasteRdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const upper = normalizeRdInput(event.target.value).slice(0, 15);
    setValue('socialDetails.rdNumber', upper, { shouldValidate: true, shouldDirty: true });
    if (isObc) {
      setValue('socialDetails.rdNumberSecondary', upper, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleIncomeRdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const upper = normalizeRdInput(event.target.value).slice(0, 15);
    setValue('socialDetails.rdNumberSecondary', upper, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const casteRdValue = watch('socialDetails.rdNumber') ?? '';
  const incomeRdValue = watch('socialDetails.rdNumberSecondary') ?? '';

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
        <Label htmlFor="rdNumber">{t('form.fields.casteRdNumber')}</Label>
        <Input
          id="rdNumber"
          value={casteRdValue}
          onChange={handleCasteRdChange}
          disabled={isGm}
          placeholder="RD0000000000000"
          maxLength={15}
          className="font-mono uppercase"
        />
        {socialErrors?.rdNumber && (
          <p className="text-sm text-destructive">{socialErrors.rdNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rdNumberSecondary">{t('form.fields.incomeRdNumber')}</Label>
        <Input
          id="rdNumberSecondary"
          value={incomeRdValue|| casteRdValue}
          onChange={handleIncomeRdChange}
          readOnly={isObc}
          placeholder="RD0000000000000"
          maxLength={15}
          className="font-mono uppercase"
        />
        {isObc && (
          <p className="text-xs text-muted-foreground">{t('form.hints.obcIncomeRdSync')}</p>
        )}
        {socialErrors?.rdNumberSecondary && (
          <p className="text-sm text-destructive">{socialErrors.rdNumberSecondary.message}</p>
        )}
      </div>
    </div>
  );
}
