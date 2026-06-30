import { useTranslation } from 'react-i18next';
import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type SectionSelectProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SectionSelect({ id, value, onChange, placeholder }: SectionSelectProps) {
  const { t } = useTranslation();
  const { sections, isLoading } = useLookups();
  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t('lookups.section')}
      options={sections}
      isLoading={isLoading}
    />
  );
}
