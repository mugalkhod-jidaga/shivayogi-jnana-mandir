import { useTranslation } from 'react-i18next';
import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type AcademicYearSelectProps = {
  id?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AcademicYearSelect({
  id,
  value,
  onChange,
  placeholder,
}: AcademicYearSelectProps) {
  const { t } = useTranslation();
  const { academicYears, isLoading } = useLookups();
  const options = academicYears.map((year) => ({
    id: year.id,
    value: year.label,
    isActive: year.isActive,
  }));

  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? t('lookups.academicYear')}
      options={options}
      isLoading={isLoading}
    />
  );
}
