import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useResetStaffPassword } from '@/hooks/useStaff';
import { ApiError } from '@/lib/api';

type ResetStaffPasswordDialogProps = {
  staffId: string;
  staffName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (staffName: string, tempPassword: string) => void;
};

export function ResetStaffPasswordDialog({
  staffId,
  staffName,
  open,
  onOpenChange,
  onReset,
}: ResetStaffPasswordDialogProps) {
  const resetPassword = useResetStaffPassword();

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      const { meta } = await resetPassword.mutateAsync(staffId);
      onOpenChange(false);
      onReset(staffName, meta.tempPassword);
      toast.success('Password reset');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not reset password';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Reset password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate a new temporary password for {staffName}? It will be shown once and they must
          change it on next login.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={resetPassword.isPending} onClick={() => void handleConfirm()}>
            {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
          </Button>
        </div>
      </div>
    </div>
  );
}
