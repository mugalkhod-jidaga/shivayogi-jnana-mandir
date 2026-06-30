import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

export function SocialCategorySelect({
  value,
  onChange,
  id,
}: {
  value?: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const { socialCategories, isLoading } = useLookups();
  return (
    <LookupSelect
      id={id}
      value={value}
      onChange={onChange}
      options={socialCategories}
      isLoading={isLoading}
      placeholder="Optional"
    />
  );
}
