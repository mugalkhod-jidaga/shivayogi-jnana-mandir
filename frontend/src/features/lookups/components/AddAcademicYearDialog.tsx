import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAcademicYear } from '@/hooks/useAcademicYearAdmin';
import { ApiError } from '@/lib/api';

type AddAcademicYearFormValues = {
  label: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

type AddAcademicYearDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddAcademicYearDialog({ open, onOpenChange }: AddAcademicYearDialogProps) {
  const { t } = useTranslation('lookups');
  const { t: tc } = useTranslation();
  const create = useCreateAcademicYear();

  const schema = useMemo(
    () =>
      z
        .object({
          label: z.string().trim().min(1, t('academicYears.addDialog.labelRequired')).max(20),
          startDate: z.string().trim().min(1, t('academicYears.addDialog.datesRequired')),
          endDate: z.string().trim().min(1, t('academicYears.addDialog.datesRequired')),
          isCurrent: z.boolean(),
        })
        .refine((data) => !data.startDate || !data.endDate || data.startDate < data.endDate, {
          message: t('academicYears.addDialog.endAfterStart'),
          path: ['endDate'],
        }),
    [t],
  );

  const form = useForm<AddAcademicYearFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: '', startDate: '', endDate: '', isCurrent: false },
  });

  if (!open) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
      toast.success(t('academicYears.addDialog.success', { label: values.label }));
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('academicYears.addDialog.error');
      toast.error(message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('academicYears.addDialog.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('academicYears.addDialog.description')}
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ay-label">{t('academicYears.columns.label')}</Label>
            <Input
              id="ay-label"
              placeholder={t('academicYears.addDialog.labelPlaceholder')}
              {...form.register('label')}
              autoFocus
            />
            {form.formState.errors.label && (
              <p className="text-sm text-destructive">{form.formState.errors.label.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ay-start">{t('academicYears.columns.startDate')}</Label>
              <Input id="ay-start" type="date" {...form.register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ay-end">{t('academicYears.columns.endDate')}</Label>
              <Input id="ay-end" type="date" {...form.register('endDate')} />
            </div>
          </div>
          {(form.formState.errors.startDate || form.formState.errors.endDate) && (
            <p className="text-sm text-destructive">
              {form.formState.errors.startDate?.message ?? form.formState.errors.endDate?.message}
            </p>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register('isCurrent')} />
            {t('academicYears.addDialog.setCurrent')}
          </label>
          <p className="text-xs text-muted-foreground">{t('academicYears.addDialog.setCurrentHelp')}</p>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t('admin.adding') : t('admin.add')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
