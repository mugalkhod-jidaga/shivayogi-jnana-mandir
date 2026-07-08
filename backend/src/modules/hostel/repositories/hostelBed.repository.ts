import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';

type BedRow = {
  id: number;
  tenant_id: number;
  room_id: number;
  slot_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hostel_rooms?: {
    id: number;
    room_number: string;
    block_id: number;
    hostel_blocks: { id: number; name: string };
  };
};

export function serializeBed(row: BedRow, occupiedBy?: { admissionNumber: string } | null) {
  return {
    id: row.id,
    roomId: row.room_id,
    slotNumber: row.slot_number,
    isActive: row.is_active,
    isOccupied: Boolean(occupiedBy),
    bedLabel: occupiedBy?.admissionNumber ?? null,
    room: row.hostel_rooms
      ? {
          id: row.hostel_rooms.id,
          roomNumber: row.hostel_rooms.room_number,
          block: row.hostel_rooms.hostel_blocks,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const BED_SELECT = `
  id, tenant_id, room_id, slot_number, is_active, created_at, updated_at,
  hostel_rooms!inner (
    id, room_number, block_id,
    hostel_blocks!inner ( id, name )
  )
`;

class HostelBedRepository {
  async provisionForRoom(tenantId: number, roomId: number, capacity: number) {
    const { data: existing, error: countError } = await supabase
      .from('hostel_beds')
      .select('slot_number')
      .eq('room_id', roomId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (countError) throw new AppError(500, countError.message);

    const existingSlots = new Set((existing ?? []).map((r) => r.slot_number as number));
    const toInsert = [];
    for (let slot = 1; slot <= capacity; slot += 1) {
      if (!existingSlots.has(slot)) {
        toInsert.push({ tenant_id: tenantId, room_id: roomId, slot_number: slot });
      }
    }

    if (toInsert.length === 0) return;

    const { error } = await supabase.from('hostel_beds').insert(toInsert);
    if (error) throw new AppError(500, error.message);
  }

  async syncCapacity(tenantId: number, roomId: number, newCapacity: number) {
    await this.provisionForRoom(tenantId, roomId, newCapacity);

    if (newCapacity < (await this.countActiveBeds(roomId, tenantId))) {
      const occupiedAbove = await this.countOccupiedBedsAboveSlot(roomId, tenantId, newCapacity);
      if (occupiedAbove > 0) {
        throw new AppError(409, 'Cannot reduce capacity: beds above new limit are occupied');
      }
    }

    const { error } = await supabase
      .from('hostel_beds')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('tenant_id', tenantId)
      .gt('slot_number', newCapacity)
      .is('deleted_at', null);

    if (error) throw new AppError(500, error.message);

    await supabase
      .from('hostel_beds')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('tenant_id', tenantId)
      .lte('slot_number', newCapacity)
      .is('deleted_at', null);
  }

  async countActiveBeds(roomId: number, tenantId: number) {
    const { count, error } = await supabase
      .from('hostel_beds')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('is_active', true);
    if (error) throw new AppError(500, error.message);
    return count ?? 0;
  }

  async countOccupiedBedsAboveSlot(roomId: number, tenantId: number, maxSlot: number) {
    const { data, error } = await supabase
      .from('hostel_beds')
      .select('id')
      .eq('room_id', roomId)
      .eq('tenant_id', tenantId)
      .gt('slot_number', maxSlot)
      .is('deleted_at', null);

    if (error) throw new AppError(500, error.message);
    if (!data?.length) return 0;

    const bedIds = data.map((b) => b.id);
    const { count, error: occError } = await supabase
      .from('room_allocations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('bed_id', bedIds)
      .is('allocated_to', null)
      .is('deleted_at', null);

    if (occError) throw new AppError(500, occError.message);
    return count ?? 0;
  }

  async findById(id: number, tenantId: number) {
    const { data, error } = await supabase
      .from('hostel_beds')
      .select(BED_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new AppError(500, error.message);
    return data as unknown as BedRow | null;
  }

  async findActiveAllocationOnBed(bedId: number, tenantId: number) {
    const { data, error } = await supabase
      .from('room_allocations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('bed_id', bedId)
      .is('allocated_to', null)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw new AppError(500, error.message);
    return data;
  }

  async listByRoom(roomId: number, tenantId: number) {
    const { data: beds, error } = await supabase
      .from('hostel_beds')
      .select(BED_SELECT)
      .eq('room_id', roomId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('slot_number');

    if (error) throw new AppError(500, error.message);

    const bedIds = (beds ?? []).map((b) => b.id);
    if (bedIds.length === 0) return [];

    const { data: allocations, error: allocError } = await supabase
      .from('room_allocations')
      .select('bed_id, students!inner ( admission_number )')
      .eq('tenant_id', tenantId)
      .in('bed_id', bedIds)
      .is('allocated_to', null)
      .is('deleted_at', null);

    if (allocError) throw new AppError(500, allocError.message);

    const occupiedMap = new Map<number, string>();
    for (const row of allocations ?? []) {
      const students = row.students as { admission_number: string } | { admission_number: string }[];
      const admission = Array.isArray(students) ? students[0]?.admission_number : students.admission_number;
      if (row.bed_id && admission) occupiedMap.set(row.bed_id as number, admission);
    }

    return (beds ?? []).map((row) =>
      serializeBed(
        row as unknown as BedRow,
        occupiedMap.has(row.id) ? { admissionNumber: occupiedMap.get(row.id)! } : null,
      ),
    );
  }

  async listVacant(tenantId: number, blockId?: number) {
    let roomQuery = supabase
      .from('hostel_rooms')
      .select('id')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('is_active', true);

    if (blockId) roomQuery = roomQuery.eq('block_id', blockId);

    const { data: rooms, error: roomError } = await roomQuery;
    if (roomError) throw new AppError(500, roomError.message);

    const roomIds = (rooms ?? []).map((r) => r.id);
    if (roomIds.length === 0) return [];

    const { data: beds, error } = await supabase
      .from('hostel_beds')
      .select(BED_SELECT)
      .eq('tenant_id', tenantId)
      .in('room_id', roomIds)
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('room_id')
      .order('slot_number');

    if (error) throw new AppError(500, error.message);

    const results = [];
    for (const bed of beds ?? []) {
      const occupied = await this.findActiveAllocationOnBed(bed.id, tenantId);
      if (!occupied) results.push(serializeBed(bed as unknown as BedRow));
    }
    return results;
  }

  async countOccupancy(tenantId: number, blockId?: number) {
    let bedQuery = supabase
      .from('hostel_beds')
      .select('id, room_id, hostel_rooms!inner(block_id)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .eq('is_active', true);

    if (blockId) bedQuery = bedQuery.eq('hostel_rooms.block_id', blockId);

    const { data: beds, count: totalBeds, error } = await bedQuery;
    if (error) throw new AppError(500, error.message);

    const bedIds = (beds ?? []).map((b) => b.id);
    if (bedIds.length === 0) {
      return { totalBeds: 0, occupiedBeds: 0, vacantBeds: 0 };
    }

    const { count: occupied, error: occError } = await supabase
      .from('room_allocations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('bed_id', bedIds)
      .is('allocated_to', null)
      .is('deleted_at', null);

    if (occError) throw new AppError(500, occError.message);

    const total = totalBeds ?? bedIds.length;
    const occupiedBeds = occupied ?? 0;
    return { totalBeds: total, occupiedBeds, vacantBeds: total - occupiedBeds };
  }
}

export const hostelBedRepository = new HostelBedRepository();
