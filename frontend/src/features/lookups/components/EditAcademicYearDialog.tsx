import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateAcademicYear } from '@/hooks/useAcademicYearAdmin';
import { ApiError } from '@/lib/api';
import type { AcademicYearOption } from '@/types/lookup';

type EditAcademicYearFormValues = {
  label: string;
  startDate: string;
  endDate: string;
};

type EditAcademicYearDialogProps = {
  item: AcademicYearOption;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAcademicYearDialog({ item, open, onOpenChange }: EditAcademicYearDialogProps) {
  const { t } = useTranslation('lookups');
  const { t: tc } = useTranslation();
  const update = useUpdateAcademicYear(item.id);

  const schema = useMemo(
    () =>
      z
        .object({
          label: z.string().trim().min(1, t('academicYears.addDialog.labelRequired')).max(20),
          startDate: z.string().trim().min(1, t('academicYears.addDialog.datesRequired')),
          endDate: z.string().trim().min(1, t('academicYears.addDialog.datesRequired')),
        })
        .refine((data) => data.startDate < data.endDate, {
          message: t('academicYears.addDialog.endAfterStart'),
          path: ['endDate'],
        }),
    [t],
  );

  const form = useForm<EditAcademicYearFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: item.label,
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        label: item.label,
        startDate: item.startDate.slice(0, 10),
        endDate: item.endDate.slice(0, 10),
      });
    }
  }, [open, item, form]);

  if (!open) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values);
      toast.success(t('academicYears.editDialog.success', { label: values.label }));
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('academicYears.editDialog.error');
      toast.error(message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('academicYears.editDialog.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('academicYears.editDialog.description')}
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="ay-edit-label">{t('academicYears.columns.label')}</Label>
            <Input id="ay-edit-label" {...form.register('label')} autoFocus />
            {form.formState.errors.label && (
              <p className="text-sm text-destructive">{form.formState.errors.label.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ay-edit-start">{t('academicYears.columns.startDate')}</Label>
              <Input id="ay-edit-start" type="date" {...form.register('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ay-edit-end">{t('academicYears.columns.endDate')}</Label>
              <Input id="ay-edit-end" type="date" {...form.register('endDate')} />
            </div>
          </div>
          {(form.formState.errors.startDate || form.formState.errors.endDate) && (
            <p className="text-sm text-destructive">
              {form.formState.errors.startDate?.message ?? form.formState.errors.endDate?.message}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tc('actions.cancel')}
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? tc('saving') : tc('actions.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
