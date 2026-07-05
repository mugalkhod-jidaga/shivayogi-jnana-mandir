import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  id: string;
  label: string;
  error?: string;
};

export function DateField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  error,
}: DateFieldProps<T>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Input
            id={id}
            type="date"
            value={typeof field.value === 'string' ? field.value : ''}
            onChange={(event) => field.onChange(event.target.value)}
            className="block w-full"
          />
        )}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
