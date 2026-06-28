import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type SectionSelectProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SectionSelect({
  id,
  value,
  onChange,
  placeholder = 'No section',
}: SectionSelectProps) {
  const { sections, isLoading } = useLookups();
  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      options={sections}
      isLoading={isLoading}
    />
  );
}
