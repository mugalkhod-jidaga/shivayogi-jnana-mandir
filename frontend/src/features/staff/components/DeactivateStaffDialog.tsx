import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useDeactivateStaff } from '@/hooks/useStaff';
import { ApiError } from '@/lib/api';

type DeactivateStaffDialogProps = {
  staffId: string;
  staffName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeactivateStaffDialog({
  staffId,
  staffName,
  open,
  onOpenChange,
}: DeactivateStaffDialogProps) {
  const deactivate = useDeactivateStaff();

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      await deactivate.mutateAsync(staffId);
      toast.success('Staff account deactivated');
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Could not deactivate staff account';
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Deactivate staff account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deactivate {staffName}? They will no longer be able to sign in.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deactivate.isPending}
            onClick={() => void handleConfirm()}
          >
            {deactivate.isPending ? 'Deactivating…' : 'Deactivate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
