import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useDeactivateLookupValue, type LookupResource } from '@/hooks/useLookupAdmin';
import { ApiError } from '@/lib/api';

type DeactivateLookupDialogProps = {
  resource: LookupResource;
  label: string;
  value: string;
  id: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeactivateLookupDialog({
  resource,
  label,
  value,
  id,
  open,
  onOpenChange,
}: DeactivateLookupDialogProps) {
  const { t } = useTranslation('lookups');
  const { t: tc } = useTranslation();
  const deactivate = useDeactivateLookupValue(resource);

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      await deactivate.mutateAsync(id);
      toast.success(t('deactivateDialog.success', { label }));
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t('deactivateDialog.error', { label });
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('deactivateDialog.title', { label })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('deactivateDialog.description', { value })}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deactivate.isPending}
            onClick={() => void handleConfirm()}
          >
            {deactivate.isPending ? t('admin.deactivate') : t('admin.deactivate')}
          </Button>
        </div>
      </div>
    </div>
  );
}
