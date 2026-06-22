import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type BloodGroupSelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
};

export function BloodGroupSelect(props: BloodGroupSelectProps) {
  const { bloodGroups, isLoading } = useLookups();

  return <LookupSelect {...props} options={bloodGroups} isLoading={isLoading} />;
}
