import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';
import { useTranslation } from 'react-i18next';

export function SocialCategorySelect({
  value,
  onChange,
  id,
  placeholder,
}: {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
}) {
  const { socialCategories, isLoading } = useLookups();
  const { t } = useTranslation();
  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      options={socialCategories}
      isLoading={isLoading}
      placeholder={placeholder ?? t('optional')}
    />
  );
}
