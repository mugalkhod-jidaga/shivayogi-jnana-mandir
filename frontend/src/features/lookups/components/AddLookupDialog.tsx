import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateLookupValue, type LookupResource } from '@/hooks/useLookupAdmin';
import { ApiError } from '@/lib/api';

const addLookupSchema = z.object({
  value: z.string().trim().min(1, 'Value is required').max(100),
});

type AddLookupFormValues = z.infer<typeof addLookupSchema>;

type AddLookupDialogProps = {
  resource: LookupResource;
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddLookupDialog({ resource, label, open, onOpenChange }: AddLookupDialogProps) {
  const create = useCreateLookupValue(resource);

  const form = useForm<AddLookupFormValues>({
    resolver: zodResolver(addLookupSchema),
    defaultValues: { value: '' },
  });

  if (!open) return null;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values.value);
      toast.success(`${label} added`);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : `Could not add ${label.toLowerCase()}`;
      toast.error(message);
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Add {label.toLowerCase()}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          New values appear in student and document forms after the list refreshes.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="lookup-value">Name</Label>
            <Input id="lookup-value" {...form.register('value')} autoFocus />
            {form.formState.errors.value && (
              <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
