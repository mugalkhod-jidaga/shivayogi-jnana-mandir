import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type LanguageSelectProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function LanguageSelect({
  id,
  value,
  onChange,
  placeholder = 'Select language',
}: LanguageSelectProps) {
  const { languages, isLoading } = useLookups();
  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      options={languages}
      isLoading={isLoading}
    />
  );
}
