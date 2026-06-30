import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  buildCreateStaffPayload,
  type CreateStaffFormValues,
} from '@/features/staff/schemas/staffForm.schema';
import { useLookups } from '@/hooks/useLookups';
import { useCreateStaff, useRoles } from '@/hooks/useStaff';
import { useStaffFormSchemas } from '@/hooks/useStaffFormSchemas';
import { ApiError } from '@/lib/api';
import { roleLabel } from '@/lib/enumLabels';
import { formatPhoneInput } from '@/lib/phone';

type CreateStaffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (staffName: string, tempPassword: string) => void;
};

export function CreateStaffDialog({ open, onOpenChange, onCreated }: CreateStaffDialogProps) {
  const { t } = useTranslation('staff');
  const { t: tc } = useTranslation();
  const { createStaffFormSchema } = useStaffFormSchemas();
  const createStaff = useCreateStaff();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { academicStandards } = useLookups();
  const [assignedStandardIds, setAssignedStandardIds] = useState<number[]>([]);

  const form = useForm<CreateStaffFormValues>({
    resolver: zodResolver(createStaffFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      roleId: '',
    },
  });

  const selectedRoleId = form.watch('roleId');
  const selectedRoleName = useMemo(
    () => roles.find((role) => String(role.id) === selectedRoleId)?.name ?? '',
    [roles, selectedRoleId],
  );
  const showStandardAssignments = selectedRoleName === 'Teacher/Warden';

  const toggleStandard = (standardId: number) => {
    setAssignedStandardIds((current) =>
      current.includes(standardId)
        ? current.filter((id) => id !== standardId)
        : [...current, standardId],
    );
  };

  if (!open) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { data, meta } = await createStaff.mutateAsync(
        buildCreateStaffPayload(values, assignedStandardIds),
      );
      const staffName = [data.firstName, data.lastName].filter(Boolean).join(' ');
      form.reset();
      setAssignedStandardIds([]);
      onOpenChange(false);
      onCreated(staffName, meta.tempPassword);
      toast.success(t('create.success'));
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('create.error');
      toast.error(message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('create.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('create.description')}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('create.firstName')}</Label>
            <Input id="firstName" {...form.register('firstName')} />
            {form.formState.errors.firstName && (
              <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">{t('create.lastName')}</Label>
            <Input id="lastName" {...form.register('lastName')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('create.mobile')}</Label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                +91
              </span>
              <Input
                id="phone"
                inputMode="numeric"
                className="rounded-l-none"
                value={form.watch('phone')}
                onChange={(event) =>
                  form.setValue('phone', formatPhoneInput(event.target.value), {
                    shouldValidate: true,
                  })
                }
              />
            </div>
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleId">{t('create.role')}</Label>
            <Select id="roleId" disabled={rolesLoading} {...form.register('roleId')}>
              <option value="">{t('create.rolePlaceholder')}</option>
              {roles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {roleLabel(t, role.name)}
                </option>
              ))}
            </Select>
            {form.formState.errors.roleId && (
              <p className="text-sm text-destructive">{form.formState.errors.roleId.message}</p>
            )}
          </div>

          {showStandardAssignments && (
            <div className="space-y-2">
              <Label>{t('create.standardAssignments')}</Label>
              <p className="text-xs text-muted-foreground">{t('create.standardHint')}</p>
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                {academicStandards.map((standard) => (
                  <label key={standard.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={assignedStandardIds.includes(standard.id)}
                      onChange={() => toggleStandard(standard.id)}
                    />
                    {standard.value}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" disabled={createStaff.isPending}>
              {createStaff.isPending ? t('create.submitting') : t('create.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
