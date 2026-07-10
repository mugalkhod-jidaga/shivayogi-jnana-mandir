import { KeyRound, Plus, Search, UserCog, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { MODULE_GRADIENTS } from '@/components/module-ui/moduleGradients';
import { ModuleHeroBanner } from '@/components/module-ui/ModuleHeroBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateStaffDialog } from '@/features/staff/components/CreateStaffDialog';
import { DeactivateStaffDialog } from '@/features/staff/components/DeactivateStaffDialog';
import { ResetStaffPasswordDialog } from '@/features/staff/components/ResetStaffPasswordDialog';
import { StaffStatusBadge } from '@/features/staff/components/StaffStatusBadge';
import { TempPasswordDialog } from '@/features/staff/components/TempPasswordDialog';
import { useMe } from '@/hooks/useMe';
import { useStaffList } from '@/hooks/useStaff';
import { phoneToDisplay } from '@/lib/phone';
import { roleLabel } from '@/lib/enumLabels';

function formatStaffName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function StaffPage() {
  const { t } = useTranslation('staff');
  const { t: tc } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '1');
  const searchParam = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(searchParam);
  const [createOpen, setCreateOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<{ name: string; password: string } | null>(
    null,
  );
  const [deactivateTarget, setDeactivateTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: me } = useMe();

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const { data, isLoading, isError } = useStaffList({
    page: Number.isFinite(page) && page > 0 ? page : 1,
    search: searchParam,
  });

  const staff = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const applySearch = () => {
    const next = new URLSearchParams();
    if (searchInput.trim()) next.set('search', searchInput.trim());
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <ModuleHeroBanner
        title={t('hero.title')}
        description={t('hero.description')}
        tagline={t('hero.tagline')}
        icon={UserCog}
        gradientClassName={MODULE_GRADIENTS.staff}
      >
        <Button type="button" onClick={() => setCreateOpen(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="size-4" />
          {t('list.addStaff')}
        </Button>
      </ModuleHeroBanner>

      <form
        className="flex gap-2 rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50/40 to-fuchsia-50/30 p-4 dark:border-violet-900/30 dark:from-violet-950/20 dark:to-fuchsia-950/15"
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('list.searchPlaceholder')}
            className="pl-9"
          />
        </div>
        <Button type="submit">{tc('actions.search')}</Button>
      </form>

      {isLoading && <p className="text-muted-foreground">{t('list.loading')}</p>}

      {isError && <p className="text-destructive">{t('list.error')}</p>}

      {!isLoading && !isError && staff.length === 0 && (
        <p className="text-muted-foreground">{t('list.noResults')}</p>
      )}

      {!isLoading && !isError && staff.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">{t('list.columns.name')}</th>
                <th className="px-4 py-3 font-medium">{t('list.columns.phone')}</th>
                <th className="px-4 py-3 font-medium">{t('list.columns.role')}</th>
                <th className="px-4 py-3 font-medium">{t('list.columns.status')}</th>
                <th className="px-4 py-3 font-medium">{t('list.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const name = formatStaffName(member.firstName, member.lastName);
                const isSelf = member.id === me?.id;
                const isActive = member.status === 'Active';

                return (
                  <tr key={member.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{name}</div>
                      {member.mustResetPassword && isActive && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          {t('list.mustResetPassword')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">+91 {phoneToDisplay(member.phoneNumber)}</td>
                    <td className="px-4 py-3">{roleLabel(t, member.roles[0]?.name)}</td>
                    <td className="px-4 py-3">
                      <StaffStatusBadge status={member.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!isActive}
                          onClick={() => setResetTarget({ id: member.id, name })}
                        >
                          <KeyRound className="size-4" />
                          {t('list.actions.resetPassword')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!isActive || isSelf}
                          title={isSelf ? t('list.cannotDeactivateSelf') : undefined}
                          onClick={() => setDeactivateTarget({ id: member.id, name })}
                        >
                          <UserX className="size-4" />
                          {t('list.actions.deactivate')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.total > meta.limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('list.pageOf', { page: meta.page, totalPages, total: meta.total })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              {tc('actions.previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              {tc('actions.next')}
            </Button>
          </div>
        </div>
      )}

      <CreateStaffDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(staffName, password) => setTempPassword({ name: staffName, password })}
      />

      {deactivateTarget && (
        <DeactivateStaffDialog
          staffId={deactivateTarget.id}
          staffName={deactivateTarget.name}
          open
          onOpenChange={(open) => {
            if (!open) setDeactivateTarget(null);
          }}
        />
      )}

      {resetTarget && (
        <ResetStaffPasswordDialog
          staffId={resetTarget.id}
          staffName={resetTarget.name}
          open
          onOpenChange={(open) => {
            if (!open) setResetTarget(null);
          }}
          onReset={(staffName, password) => setTempPassword({ name: staffName, password })}
        />
      )}

      {tempPassword && (
        <TempPasswordDialog
          staffName={tempPassword.name}
          tempPassword={tempPassword.password}
          open
          onClose={() => setTempPassword(null)}
        />
      )}
    </div>
  );
}
