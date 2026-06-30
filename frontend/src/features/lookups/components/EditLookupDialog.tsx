import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateLookupLabels, type LookupResource } from '@/hooks/useLookupAdmin';
import { ApiError } from '@/lib/api';
import type { TenantLookupOption } from '@/types/lookup';

type EditLookupFormValues = {
  labelKn: string;
};

type EditLookupDialogProps = {
  resource: LookupResource;
  label: string;
  item: TenantLookupOption;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditLookupDialog({
  resource,
  label,
  item,
  open,
  onOpenChange,
}: EditLookupDialogProps) {
  const { t } = useTranslation('lookups');
  const { t: tc } = useTranslation();
  const update = useUpdateLookupLabels(resource);

  const editSchema = z.object({
    labelKn: z.string().trim().max(100),
  });

  const form = useForm<EditLookupFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { labelKn: item.labels?.kn ?? '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ labelKn: item.labels?.kn ?? '' });
    }
  }, [open, item, form]);

  if (!open) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ id: item.id, labelKn: values.labelKn });
      toast.success(t('editDialog.success', { label }));
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('editDialog.error', { label });
      toast.error(message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('editDialog.title', { label })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('editDialog.description')}</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="lookup-name-en">{t('editDialog.nameEn')}</Label>
            <Input id="lookup-name-en" value={item.labels?.en ?? item.value} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lookup-label-kn-edit">{t('editDialog.nameKn')}</Label>
            <Input id="lookup-label-kn-edit" {...form.register('labelKn')} autoFocus />
          </div>

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
