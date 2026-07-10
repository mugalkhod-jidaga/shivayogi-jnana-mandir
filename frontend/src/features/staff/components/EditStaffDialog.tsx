import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useLookups } from '@/hooks/useLookups';
import { useRoles, useUpdateStaff } from '@/hooks/useStaff';
import { ApiError } from '@/lib/api';
import { roleLabel } from '@/lib/enumLabels';
import type { StaffMember } from '@/types/user';

type EditStaffDialogProps = {
  staff: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const editSchema = z.object({
  roleId: z.string().min(1),
});

type EditFormValues = z.infer<typeof editSchema>;

export function EditStaffDialog({ staff, open, onOpenChange }: EditStaffDialogProps) {
  const { t } = useTranslation('staff');
  const { t: tc } = useTranslation();
  const updateStaff = useUpdateStaff(staff.id);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { academicStandards } = useLookups();
  const [assignedStandardIds, setAssignedStandardIds] = useState<number[]>(
    staff.assignedStandardIds ?? [],
  );

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      roleId: staff.roles[0] ? String(staff.roles[0].id) : '',
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ roleId: staff.roles[0] ? String(staff.roles[0].id) : '' });
    setAssignedStandardIds(staff.assignedStandardIds ?? []);
  }, [open, staff, form]);

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
      await updateStaff.mutateAsync({
        roleId: Number(values.roleId),
        assignedStandardIds: showStandardAssignments ? assignedStandardIds : [],
      });
      onOpenChange(false);
      toast.success(t('edit.success'));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : t('edit.error'));
    }
  });

  const name = [staff.firstName, staff.lastName].filter(Boolean).join(' ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('edit.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('edit.description', { name })}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="edit-roleId">{t('create.role')}</Label>
            <Select id="edit-roleId" disabled={rolesLoading} {...form.register('roleId')}>
              <option value="">{t('create.rolePlaceholder')}</option>
              {roles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {roleLabel(t, role.name)}
                </option>
              ))}
            </Select>
            {form.formState.errors.roleId && (
              <p className="text-sm text-destructive">{t('validation.roleRequired')}</p>
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
            <Button type="submit" disabled={updateStaff.isPending}>
              {updateStaff.isPending ? t('edit.submitting') : t('edit.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
