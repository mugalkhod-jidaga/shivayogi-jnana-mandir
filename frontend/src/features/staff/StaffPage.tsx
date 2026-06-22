import { KeyRound, Plus, Search, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
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

function formatStaffName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function StaffPage() {
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
      <PageHeader
        title="Staff"
        description="Create staff accounts, assign roles, and manage access."
      >
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Add staff
        </Button>
      </PageHeader>

      <form
        className="flex gap-2"
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
            placeholder="Search by name or phone"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {isLoading && <p className="text-muted-foreground">Loading staff…</p>}

      {isError && (
        <p className="text-destructive">Could not load staff list. Try again later.</p>
      )}

      {!isLoading && !isError && staff.length === 0 && (
        <p className="text-muted-foreground">No staff accounts match this search.</p>
      )}

      {!isLoading && !isError && staff.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
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
                          Must reset password
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">+91 {phoneToDisplay(member.phoneNumber)}</td>
                    <td className="px-4 py-3">{member.roles[0]?.name ?? '—'}</td>
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
                          Reset password
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!isActive || isSelf}
                          title={isSelf ? 'You cannot deactivate your own account' : undefined}
                          onClick={() => setDeactivateTarget({ id: member.id, name })}
                        >
                          <UserX className="size-4" />
                          Deactivate
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
            Page {meta.page} of {totalPages} · {meta.total} total
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => goToPage(meta.page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= totalPages}
              onClick={() => goToPage(meta.page + 1)}
            >
              Next
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
