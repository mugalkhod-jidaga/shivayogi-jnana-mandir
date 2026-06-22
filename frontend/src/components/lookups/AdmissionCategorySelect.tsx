import { LookupSelect } from '@/components/lookups/LookupSelect';
import { useLookups } from '@/hooks/useLookups';

type AdmissionCategorySelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
};

export function AdmissionCategorySelect(props: AdmissionCategorySelectProps) {
  const { admissionCategories, isLoading } = useLookups();

  return <LookupSelect {...props} options={admissionCategories} isLoading={isLoading} />;
}
