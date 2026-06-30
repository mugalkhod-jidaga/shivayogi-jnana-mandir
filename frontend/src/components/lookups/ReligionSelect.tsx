import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';
import { useTranslation } from 'react-i18next';

export function ReligionSelect({
  value,
  onChange,
  id,
}: {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const { religions, isLoading } = useLookups();
  const { t } = useTranslation();
  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      options={religions}
      isLoading={isLoading}
      placeholder={t('optional')}
    />
  );
}
