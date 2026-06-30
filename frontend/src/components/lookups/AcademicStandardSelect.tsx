import { useTranslation } from 'react-i18next';
import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type AcademicStandardSelectProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AcademicStandardSelect({
  id,
  value,
  onChange,
  placeholder,
}: AcademicStandardSelectProps) {
  const { t } = useTranslation();
  const { academicStandards, isLoading } = useLookups();
  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t('lookups.standard')}
      options={academicStandards}
      isLoading={isLoading}
    />
  );
}
