import { useState } from 'react';
import { BedDouble, Building2, DoorOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HostelSectionCard } from '@/features/hostel/components/HostelSectionCard';
import { cn } from '@/lib/utils';
import { useCreateBlock, useCreateRoom, useHostelBlocks, useHostelRooms, useRoomBeds } from '@/hooks/useHostel';

export function HostelSetupPage() {
  const { t } = useTranslation('hostel');
  const { t: tc } = useTranslation();
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [newBlockName, setNewBlockName] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('2');
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const { data: blocksData } = useHostelBlocks();
  const blocks = blocksData?.data ?? [];
  const activeBlockId = selectedBlockId ?? blocks[0]?.id;
  const { data: roomsData } = useHostelRooms(activeBlockId);
  const rooms = roomsData?.data ?? [];
  const activeRoomId = selectedRoomId ?? rooms[0]?.id;
  const { data: beds } = useRoomBeds(activeRoomId);

  const createBlock = useCreateBlock();
  const createRoom = useCreateRoom(activeBlockId ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <HostelSectionCard
        title={t('blocks.title')}
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
            <Building2 className="size-5" />
          </div>
        }
      >
        <RequirePermission permission="hostel:manage">
          <form
            className="mb-4 flex gap-2"
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
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all',
                  activeBlockId === block.id
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-900 shadow-sm dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-100'
                    : 'hover:border-indigo-200 hover:bg-muted/50',
                )}
                onClick={() => {
                  setSelectedBlockId(block.id);
                  setSelectedRoomId(null);
                }}
              >
                {block.name}
              </button>
            </li>
          ))}
        </ul>
      </HostelSectionCard>

      <HostelSectionCard
        title={t('rooms.title')}
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow">
            <DoorOpen className="size-5" />
          </div>
        }
      >
        {activeBlockId ? (
          <>
            <RequirePermission permission="hostel:manage">
              <form
                className="mb-4 grid gap-2 sm:grid-cols-3"
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
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li key={room.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full justify-between rounded-lg border px-4 py-3 text-left text-sm transition-all',
                      activeRoomId === room.id
                        ? 'border-orange-300 bg-orange-50 font-medium text-orange-900 shadow-sm dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-100'
                        : 'hover:border-orange-200 hover:bg-muted/50',
                    )}
                    onClick={() => setSelectedRoomId(room.id)}
                  >
                    <span>
                      {room.roomNumber} ({t('rooms.capacity', { count: room.capacity })})
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t('rooms.selectBlock')}</p>
        )}
      </HostelSectionCard>

      {activeRoomId && (
        <HostelSectionCard
          title={t('beds.title')}
          description={t('beds.description')}
          className="lg:col-span-2"
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow">
              <BedDouble className="size-5" />
            </div>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
            {(beds ?? []).map((bed) => (
              <div
                key={bed.id}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-transform hover:scale-[1.02]',
                  bed.isOccupied
                    ? 'border-emerald-300 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md'
                    : 'border-dashed border-slate-300 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-900/40',
                )}
              >
                <BedDouble
                  className={cn('mb-2 size-6', bed.isOccupied ? 'text-white/90' : 'text-slate-400')}
                />
                <p className="text-xs font-bold uppercase tracking-wide opacity-90">
                  {t('beds.slot', { number: bed.slotNumber })}
                </p>
                <p className={cn('mt-1 text-sm font-medium', !bed.isOccupied && 'text-muted-foreground')}>
                  {bed.isOccupied ? bed.bedLabel : t('beds.vacant')}
                </p>
              </div>
            ))}
          </div>
        </HostelSectionCard>
      )}
    </div>
  );
}
