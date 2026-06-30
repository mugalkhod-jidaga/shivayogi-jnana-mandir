import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  CreateStudentFormValues,
  UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';

type EmergencyContactFieldsProps = {
  register: UseFormRegister<CreateStudentFormValues | UpdateStudentFormValues>;
  errors: FieldErrors<CreateStudentFormValues | UpdateStudentFormValues>;
};

export function EmergencyContactFields({ register, errors }: EmergencyContactFieldsProps) {
  const { t } = useTranslation('students');
  const contactErrors = errors.emergencyContacts?.[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="emergencyContactName">{t('form.fields.contactName')}</Label>
        <Input id="emergencyContactName" {...register('emergencyContacts.0.contactName')} />
        {contactErrors?.contactName && (
          <p className="text-sm text-destructive">{contactErrors.contactName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyRelationship">{t('form.fields.relationship')}</Label>
        <Input id="emergencyRelationship" {...register('emergencyContacts.0.relationship')} />
        {contactErrors?.relationship && (
          <p className="text-sm text-destructive">{contactErrors.relationship.message}</p>
        )}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="emergencyPhone">{t('form.fields.emergencyPhone')}</Label>
        <div className="flex">
          <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            +91
          </span>
          <Input
            id="emergencyPhone"
            inputMode="numeric"
            className="rounded-l-none"
            {...register('emergencyContacts.0.phone')}
          />
        </div>
        {contactErrors?.phone && (
          <p className="text-sm text-destructive">{contactErrors.phone.message}</p>
        )}
      </div>
    </div>
  );
}
