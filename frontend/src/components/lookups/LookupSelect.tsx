import { Select } from '@/components/ui/select';
import type { LookupOption } from '@/types/lookup';

type LookupSelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  options: LookupOption[];
  id?: string;
  name?: string;
};

export function LookupSelect({
  value,
  onChange,
  placeholder = 'Select…',
  disabled,
  isLoading,
  options,
  id,
  name,
}: LookupSelectProps) {
  return (
    <Select
      id={id}
      name={name}
      value={value ?? ''}
      disabled={disabled || isLoading}
      onChange={(event) => onChange?.(event.target.value)}
    >
      <option value="">{isLoading ? 'Loading…' : placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={String(option.id)}>
          {option.value}
        </option>
      ))}
    </Select>
  );
}
