import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentSearchPicker } from '@/components/students/StudentSearchPicker';
import {
  useCreateAllocation,
  useCreateBlock,
  useCreateRoom,
  useHostelBlocks,
  useHostelRooms,
  useRoomAllocations,
} from '@/hooks/useHostel';

function formatName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function HostelPage() {
  const { t } = useTranslation('hostel');
  const { t: tc } = useTranslation();
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [newBlockName, setNewBlockName] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('2');
  const [allocStudentId, setAllocStudentId] = useState('');
  const [allocRoomId, setAllocRoomId] = useState('');
  const [allocFrom, setAllocFrom] = useState(new Date().toISOString().slice(0, 10));

  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];
  const activeBlockId = selectedBlockId ?? blocks[0]?.id;
  const { data: roomsData } = useHostelRooms(activeBlockId);
  const rooms = roomsData?.data ?? [];
  const { data: allocationsData } = useRoomAllocations({ activeOnly: true });
  const allocations = allocationsData?.data ?? [];

  const createBlock = useCreateBlock();
  const createRoom = useCreateRoom(activeBlockId ?? 0);
  const createAllocation = useCreateAllocation();

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')}>
        <Button asChild variant="outline">
          <Link to="/hostel/attendance">{t('actions.attendance')}</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">{t('blocks.title')}</h2>
          <RequirePermission permission="hostel:manage">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void createBlock.mutateAsync({ name: newBlockName }).then(() => setNewBlockName(''));
              }}
            >
              <Input
                placeholder={t('blocks.namePlaceholder')}
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                required
              />
              <Button type="submit" disabled={createBlock.isPending}>
                {tc('actions.add')}
              </Button>
            </form>
          </RequirePermission>
          <ul className="space-y-2">
            {blocks.map((block) => (
              <li key={block.id}>
                <button
                  type="button"
                  className={`w-full rounded border px-3 py-2 text-left text-sm ${
                    activeBlockId === block.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  {block.name}
                  {block.description && (
                    <span className="mt-1 block text-xs text-muted-foreground">{block.description}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">{t('rooms.title')}</h2>
          {activeBlockId ? (
            <>
              <RequirePermission permission="hostel:manage">
                <form
                  className="grid gap-2 sm:grid-cols-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void createRoom
                      .mutateAsync({ roomNumber: newRoomNumber, capacity: Number(newRoomCapacity) })
                      .then(() => {
                        setNewRoomNumber('');
                        setNewRoomCapacity('2');
                      });
                  }}
                >
                  <Input
                    placeholder={t('rooms.numberPlaceholder')}
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    required
                  />
                  <Input
                    type="number"
                    min={1}
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(e.target.value)}
                  />
                  <Button type="submit" disabled={createRoom.isPending}>
                    {t('rooms.add')}
                  </Button>
                </form>
              </RequirePermission>
              <ul className="space-y-1 text-sm">
                {rooms.map((room) => (
                  <li key={room.id} className="flex justify-between rounded border px-3 py-2">
                    <span>
                      {room.roomNumber} ({t('rooms.capacity', { count: room.capacity })})
                    </span>
                    <span className="text-muted-foreground">#{room.id}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('rooms.selectBlock')}</p>
          )}
        </section>
      </div>

      <section className="space-y-4 rounded-lg border p-4">
        <h2 className="font-medium">{t('allocations.title')}</h2>
        <RequirePermission permission="hostel:manage">
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createAllocation.mutateAsync({
                studentId: allocStudentId,
                roomId: Number(allocRoomId),
                allocatedFrom: allocFrom,
              });
            }}
          >
            <div>
              <StudentSearchPicker
                label={t('allocations.student')}
                value={allocStudentId}
                onChange={(studentId) => setAllocStudentId(studentId)}
              />
            </div>
            <div>
              <Label>{t('allocations.room')}</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={allocRoomId}
                onChange={(e) => setAllocRoomId(e.target.value)}
                required
              >
                <option value="">{t('allocations.selectRoom')}</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.blockName} / {room.roomNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>{t('allocations.from')}</Label>
              <Input type="date" value={allocFrom} onChange={(e) => setAllocFrom(e.target.value)} required />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createAllocation.isPending}>
                {t('allocations.assign')}
              </Button>
            </div>
          </form>
        </RequirePermission>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2">{t('allocations.columns.student')}</th>
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
