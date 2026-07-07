import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RequirePermission } from '@/components/RequirePermission';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
                <li key={room.id}>
                  <button
                    type="button"
                    className={`flex w-full justify-between rounded border px-3 py-2 text-left ${
                      activeRoomId === room.id ? 'border-primary bg-primary/5' : ''
                    }`}
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
      </section>

      {activeRoomId && (
        <section className="space-y-3 rounded-lg border p-4 lg:col-span-2">
          <h2 className="font-medium">{t('beds.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('beds.description')}</p>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {(beds ?? []).map((bed) => (
              <div
                key={bed.id}
                className={`rounded-md border p-3 text-sm ${
                  bed.isOccupied ? 'bg-muted/50' : 'border-dashed'
                }`}
              >
                <p className="font-medium">
                  {t('beds.slot', { number: bed.slotNumber })}
                </p>
                <p className="text-muted-foreground">
                  {bed.isOccupied ? bed.bedLabel : t('beds.vacant')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
