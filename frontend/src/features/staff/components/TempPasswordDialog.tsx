import { Copy } from 'lucide-react';
import { toast } from 'sonner';
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
  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy password');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Temporary password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this password with {staffName} once. It will not be shown again. They must change it
          on first login.
        </p>

        <div className="mt-4 rounded-md border bg-muted/40 px-4 py-3 font-mono text-lg tracking-wide">
          {tempPassword}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void handleCopy()}>
            <Copy className="size-4" />
            Copy
          </Button>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
