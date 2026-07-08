import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RequirePermission } from '@/components/RequirePermission';
import { StudentSearchPicker } from '@/components/students/StudentSearchPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateAllocation,
  useRoomAllocations,
  useTransferAllocation,
  useVacantBeds,
} from '@/hooks/useHostel';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

function formatBedOption(bed: {
  id: number;
  slotNumber: number;
  room?: { roomNumber: string; block: { name: string } };
}) {
  if (!bed.room) return `Bed ${bed.slotNumber}`;
  return `${bed.room.block.name} / ${bed.room.roomNumber} — ${bed.slotNumber}`;
}

export function HostelAllocationsPage() {
  const { t } = useTranslation('hostel');
  const [studentId, setStudentId] = useState('');
  const [bedId, setBedId] = useState('');
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 10));
  const [transferStudentId, setTransferStudentId] = useState('');
  const [transferBedId, setTransferBedId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().slice(0, 10));

  const { data: allocationsData } = useRoomAllocations({ activeOnly: true, limit: 100 });
  const allocations = allocationsData?.data ?? [];
  const { data: vacantBeds } = useVacantBeds();

  const createAllocation = useCreateAllocation();
  const transferAllocation = useTransferAllocation();

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAllocation.mutateAsync({
      studentId,
      bedId: Number(bedId),
      allocatedFrom: fromDate,
    });
    setStudentId('');
    setBedId('');
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    await transferAllocation.mutateAsync({
      studentId: transferStudentId,
      bedId: Number(transferBedId),
      transferDate,
    });
    setTransferStudentId('');
    setTransferBedId('');
  };

  return (
    <div className="space-y-6">
      <RequirePermission permission="hostel:manage">
        <section className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">{t('allocations.assignTitle')}</h2>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => void handleAssign(e)}>
            <StudentSearchPicker
              label={t('allocations.student')}
              value={studentId}
              onChange={(id) => setStudentId(id)}
            />
            <div>
              <Label>{t('allocations.bed')}</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                required
              >
                <option value="">{t('allocations.selectBed')}</option>
                {(vacantBeds ?? []).map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    {formatBedOption(bed)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('allocations.from')}</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createAllocation.isPending}>
                {t('allocations.assign')}
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">{t('allocations.transferTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('allocations.transferDescription')}</p>
          <form className="grid gap-3 md:grid-cols-4" onSubmit={(e) => void handleTransfer(e)}>
            <StudentSearchPicker
              label={t('allocations.student')}
              value={transferStudentId}
              onChange={(id) => setTransferStudentId(id)}
            />
            <div>
              <Label>{t('allocations.newBed')}</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={transferBedId}
                onChange={(e) => setTransferBedId(e.target.value)}
                required
              >
                <option value="">{t('allocations.selectBed')}</option>
                {(vacantBeds ?? []).map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    {formatBedOption(bed)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('allocations.transferDate')}</Label>
              <Input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={transferAllocation.isPending}>
                {t('allocations.transfer')}
              </Button>
            </div>
          </form>
        </section>
      </RequirePermission>

      <section className="space-y-3">
        <h2 className="font-medium">{t('allocations.title')}</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">{t('allocations.columns.student')}</th>
                <th className="px-3 py-2">{t('allocations.columns.bed')}</th>
                <th className="px-3 py-2">{t('allocations.columns.block')}</th>
                <th className="px-3 py-2">{t('allocations.columns.room')}</th>
                <th className="px-3 py-2">{t('allocations.columns.from')}</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">
                    <Link className="text-primary hover:underline" to={`/students/${row.student.id}`}>
                      {formatName(row.student.firstName, row.student.lastName)}
                    </Link>
                    <div className="text-xs text-muted-foreground">{row.student.admissionNumber}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {row.bed?.bedLabel ?? row.student.admissionNumber}
                    {row.bed && (
                      <span className="block text-muted-foreground">
                        {t('beds.slot', { number: row.bed.slotNumber })}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{row.room.block.name}</td>
                  <td className="px-3 py-2">{row.room.roomNumber}</td>
                  <td className="px-3 py-2">{row.allocatedFrom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
