import type { FieldErrors, UseFormRegister } from 'react-hook-form';
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
  const socialErrors = errors.socialDetails;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="religionId">Religion</Label>
        <ReligionSelect id="religionId" value={religionId} onChange={onReligionChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="socialCategoryId">Social category</Label>
        <SocialCategorySelect
          id="socialCategoryId"
          value={socialCategoryId}
          onChange={onSocialCategoryChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caste">Caste</Label>
        <Input id="caste" {...register('socialDetails.caste')} />
        {socialErrors?.caste && (
          <p className="text-sm text-destructive">{socialErrors.caste.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subCaste">Sub-caste</Label>
        <Input id="subCaste" {...register('socialDetails.subCaste')} />
        {socialErrors?.subCaste && (
          <p className="text-sm text-destructive">{socialErrors.subCaste.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rdNumber">RD number</Label>
        <Input id="rdNumber" {...register('socialDetails.rdNumber')} />
        {socialErrors?.rdNumber && (
          <p className="text-sm text-destructive">{socialErrors.rdNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rdNumberSecondary">RD number (secondary)</Label>
        <Input id="rdNumberSecondary" {...register('socialDetails.rdNumberSecondary')} />
        {socialErrors?.rdNumberSecondary && (
          <p className="text-sm text-destructive">{socialErrors.rdNumberSecondary.message}</p>
        )}
      </div>
    </div>
  );
}
