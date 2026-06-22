import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  deactivateStudentFormSchema,
  type DeactivateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';
import { useDeactivateStudent } from '@/hooks/useStudent';

type DeactivateStudentDialogProps = {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeactivateStudentDialog({
  studentId,
  studentName,
  open,
  onOpenChange,
}: DeactivateStudentDialogProps) {
  const deactivate = useDeactivateStudent(studentId);
  const form = useForm<DeactivateStudentFormValues>({
    resolver: zodResolver(deactivateStudentFormSchema),
    defaultValues: { status: 'Discontinued', statusReason: '' },
  });

  if (!open) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await deactivate.mutateAsync(values);
      toast.success('Student status updated');
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error('Could not update student status');
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Change student status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update status for {studentName}. This action is recorded in the audit log.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="status">New status</Label>
            <Select id="status" {...form.register('status')}>
              <option value="Discontinued">Discontinued</option>
              <option value="Alumni">Alumni</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusReason">Reason</Label>
            <Textarea id="statusReason" rows={3} {...form.register('statusReason')} />
            {form.formState.errors.statusReason && (
              <p className="text-sm text-destructive">
                {form.formState.errors.statusReason.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={deactivate.isPending}>
              {deactivate.isPending ? 'Saving…' : 'Confirm'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
