import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  buildCreateStaffPayload,
  createStaffFormSchema,
  type CreateStaffFormValues,
} from '@/features/staff/schemas/staffForm.schema';
import { useLookups } from '@/hooks/useLookups';
import { useCreateStaff, useRoles } from '@/hooks/useStaff';
import { ApiError } from '@/lib/api';
import { formatPhoneInput } from '@/lib/phone';

type CreateStaffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (staffName: string, tempPassword: string) => void;
};

export function CreateStaffDialog({ open, onOpenChange, onCreated }: CreateStaffDialogProps) {
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
      toast.success('Staff account created');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not create staff account';
      toast.error(message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Create staff account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A temporary password will be generated and shown once after creation.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...form.register('firstName')} />
            {form.formState.errors.firstName && (
              <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last name (optional)</Label>
            <Input id="lastName" {...form.register('lastName')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Mobile number</Label>
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
            <Label htmlFor="roleId">Role</Label>
            <Select id="roleId" disabled={rolesLoading} {...form.register('roleId')}>
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={String(role.id)}>
                  {role.name}
                </option>
              ))}
            </Select>
            {form.formState.errors.roleId && (
              <p className="text-sm text-destructive">{form.formState.errors.roleId.message}</p>
            )}
          </div>

          {showStandardAssignments && (
            <div className="space-y-2">
              <Label>Assigned standards</Label>
              <p className="text-xs text-muted-foreground">
                Teacher/Warden accounts only see students in the selected standards.
              </p>
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
              Cancel
            </Button>
            <Button type="submit" disabled={createStaff.isPending}>
              {createStaff.isPending ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
