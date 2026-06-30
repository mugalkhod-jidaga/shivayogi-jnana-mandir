import type { TFunction } from 'i18next';
import type { Gender, ParentStatus, SatsTransferStatus } from '@/types/student';

export function genderLabel(t: TFunction, gender: Gender | string | null | undefined): string {
  if (!gender) return '—';
  const key =
    gender === 'Male' ? 'male' : gender === 'Female' ? 'female' : 'other';
  return t(`gender.${key}`);
}

export function parentStatusLabel(
  t: TFunction,
  status: ParentStatus | string | null | undefined,
): string {
  if (!status) return '—';
  const map: Record<ParentStatus, string> = {
    'Both Alive': 'bothAlive',
    'Single Mother': 'singleMother',
    Orphan: 'orphan',
  };
  const key = map[status as ParentStatus];
  return key ? t(`parentStatus.${key}`) : status;
}

export function satsStatusLabel(
  t: TFunction,
  status: SatsTransferStatus | string | null | undefined,
): string {
  if (!status) return '—';
  const map: Record<SatsTransferStatus, string> = {
    Pending: 'pending',
    Transferred: 'transferred',
    NotApplicable: 'notApplicable',
  };
  const key = map[status as SatsTransferStatus];
  return key ? t(`satsStatus.${key}`, { ns: 'students' }) : status;
}

export function staffStatusLabel(t: TFunction, status: 'Active' | 'Inactive' | string): string {
  return status === 'Active' ? t('staffStatus.active') : t('staffStatus.inactive');
}

export function documentStatusLabel(t: TFunction, status: string): string {
  const map: Record<string, string> = {
    'Pending Review': 'pendingReview',
    Verified: 'verified',
    Rejected: 'rejected',
    'Renewal Needed': 'renewalNeeded',
  };
  const key = map[status];
  return key ? t(`documentStatus.${key}`) : status;
}
