import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateLookupValue, type LookupResource } from '@/hooks/useLookupAdmin';
import { ApiError } from '@/lib/api';

type AddLookupFormValues = {
  value: string;
  labelKn?: string;
};

type AddLookupDialogProps = {
  resource: LookupResource;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supportsKannadaLabel?: boolean;
};

export function AddLookupDialog({
  resource,
  label,
  open,
  onOpenChange,
  supportsKannadaLabel = false,
}: AddLookupDialogProps) {
  const { t } = useTranslation('lookups');
  const { t: tc } = useTranslation();
  const create = useCreateLookupValue(resource);

  const addLookupSchema = useMemo(
    () =>
      z.object({
        value: z.string().trim().min(1, t('addDialog.valueRequired')).max(100),
        labelKn: z.string().trim().max(100).optional(),
      }),
    [t],
  );

  const form = useForm<AddLookupFormValues>({
    resolver: zodResolver(addLookupSchema),
    defaultValues: { value: '', labelKn: '' },
  });

  if (!open) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync({
        value: values.value,
        labelKn: supportsKannadaLabel ? values.labelKn?.trim() || undefined : undefined,
      });
      toast.success(t('addDialog.success', { label }));
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('addDialog.error', { label });
      toast.error(message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('addDialog.title', { label })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('addDialog.description')}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="lookup-value">
              {supportsKannadaLabel ? t('addDialog.nameEn') : t('admin.columns.name')}
            </Label>
            <Input id="lookup-value" {...form.register('value')} autoFocus />
            {form.formState.errors.value && (
              <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
            )}
          </div>

          {supportsKannadaLabel && (
            <div className="space-y-2">
              <Label htmlFor="lookup-label-kn">{t('addDialog.nameKn')}</Label>
              <Input id="lookup-label-kn" {...form.register('labelKn')} />
              <p className="text-xs text-muted-foreground">{t('addDialog.nameKnHelp')}</p>
            </div>
          )}

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
