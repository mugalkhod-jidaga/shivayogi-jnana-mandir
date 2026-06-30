import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type TempPasswordDialogProps = {
  staffName: string;
  tempPassword: string;
  open: boolean;
  onClose: () => void;
};

export function TempPasswordDialog({
  staffName,
  tempPassword,
  open,
  onClose,
}: TempPasswordDialogProps) {
  const { t } = useTranslation('staff');

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success(t('tempPassword.copied'));
    } catch {
      toast.error(t('tempPassword.copyError'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">{t('tempPassword.title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('tempPassword.description', { name: staffName })}
        </p>

        <div className="mt-4 rounded-md border bg-muted/40 px-4 py-3 font-mono text-lg tracking-wide">
          {tempPassword}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void handleCopy()}>
            <Copy className="size-4" />
            {t('tempPassword.copy')}
          </Button>
          <Button type="button" onClick={onClose}>
            {t('tempPassword.done')}
          </Button>
        </div>
      </div>
    </div>
  );
}
