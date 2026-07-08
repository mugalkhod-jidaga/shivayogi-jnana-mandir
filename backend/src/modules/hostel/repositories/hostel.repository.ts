import { supabase } from '../../../config/supabase';
import { AppError } from '../../../utils/AppError';
import { BaseRepository } from '../../../repositories/BaseRepository';
import type {
  AllocationListQuery,
  BlockListQuery,
  RoomListQuery,
} from '../schemas/hostel.schemas';

type BlockRow = {
  id: number;
  tenant_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type RoomRow = {
  id: number;
  tenant_id: number;
  block_id: number;
  room_number: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  hostel_blocks: { id: number; name: string };
};

type AllocationRow = {
  id: string;
  tenant_id: number;
  student_id: string;
  room_id: number;
  bed_id: number | null;
  allocated_from: string;
  allocated_to: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  students: {
    id: string;
    first_name: string;
    last_name: string | null;
    admission_number: string;
  };
  hostel_rooms: {
    id: number;
    room_number: string;
    hostel_blocks: { id: number; name: string };
  };
  hostel_beds: { id: number; slot_number: number } | null;
};

const ROOM_SELECT = `
  id, tenant_id, block_id, room_number, capacity, is_active, created_at, updated_at,
  hostel_blocks!inner ( id, name )
`;

const ALLOCATION_SELECT = `
  id, tenant_id, student_id, room_id, bed_id, allocated_from, allocated_to, notes, created_by,
  created_at, updated_at,
  students!inner ( id, first_name, last_name, admission_number ),
  hostel_rooms!inner (
    id, room_number,
    hostel_blocks!inner ( id, name )
  ),
  hostel_beds ( id, slot_number )
`;

function serializeBlock(row: BlockRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeRoom(row: RoomRow) {
  return {
    id: row.id,
    blockId: row.block_id,
    blockName: row.hostel_blocks.name,
    roomNumber: row.room_number,
    capacity: row.capacity,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeAllocation(row: AllocationRow) {
  return {
    id: row.id,
    studentId: row.student_id,
    roomId: row.room_id,
    bedId: row.bed_id,
    allocatedFrom: row.allocated_from,
    allocatedTo: row.allocated_to,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    student: {
      id: row.students.id,
      firstName: row.students.first_name,
      lastName: row.students.last_name,
      admissionNumber: row.students.admission_number,
    },
    bed: row.hostel_beds
      ? {
          id: row.hostel_beds.id,
          slotNumber: row.hostel_beds.slot_number,
          bedLabel: row.students.admission_number,
        }
      : null,
    room: {
      id: row.hostel_rooms.id,
      roomNumber: row.hostel_rooms.room_number,
      block: row.hostel_rooms.hostel_blocks,
    },
  };
}

class HostelRepository extends BaseRepository {
  constructor() {
    super('hostel_blocks');
  }

  async listBlocks(tenantId: number, query: BlockListQuery) {
    const { page, limit, search } = query;
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    let dbQuery = supabase
      .from('hostel_blocks')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name');

    if (search) dbQuery = dbQuery.ilike('name', `%${search}%`);

    const { data, count, error } = await dbQuery.range(offset, offset + cappedLimit - 1);
    if (error) throw new AppError(500, error.message);
    return {
      data: (data ?? []).map((row) => serializeBlock(row as BlockRow)),
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async createBlock(tenantId: number, payload: { name: string; description?: string | null; is_active?: boolean }) {
    const { data, error } = await supabase
      .from('hostel_blocks')
      .insert({ tenant_id: tenantId, ...payload })
      .select()
      .single();
    if (error) throw new AppError(500, error.message);
    return serializeBlock(data as BlockRow);
  }

  async findBlockById(id: number, tenantId: number) {
    const { data, error } = await supabase
      .from('hostel_blocks')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? serializeBlock(data as BlockRow) : null;
  }

  async updateBlock(id: number, tenantId: number, changes: Record<string, unknown>, userId: string) {
    await this.update(String(id), tenantId, changes, userId);
    return this.findBlockById(id, tenantId);
  }

  async softDeleteBlock(id: number, tenantId: number, userId: string) {
    await this.softDelete(String(id), tenantId, userId);
  }

  async listRooms(tenantId: number, blockId: number, query: RoomListQuery) {
    const { page, limit, search } = query;
    const cappedLimit = Math.min(limit, 100);
    const offset = (page - 1) * cappedLimit;

    let dbQuery = supabase
      .from('hostel_rooms')
      .select(ROOM_SELECT, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('block_id', blockId)
      .is('deleted_at', null)
      .order('room_number');

    if (search) dbQuery = dbQuery.ilike('room_number', `%${search}%`);

    const { data, count, error } = await dbQuery.range(offset, offset + cappedLimit - 1);
    if (error) throw new AppError(500, error.message);
    return {
      data: (data ?? []).map((row) => serializeRoom(row as unknown as RoomRow)),
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async createRoom(
    tenantId: number,
    blockId: number,
    payload: { room_number: string; capacity: number; is_active?: boolean },
  ) {
    const { data, error } = await supabase
      .from('hostel_rooms')
      .insert({ tenant_id: tenantId, block_id: blockId, ...payload })
      .select(ROOM_SELECT)
      .single();
    if (error) throw new AppError(500, error.message);
    return serializeRoom(data as unknown as RoomRow);
  }

  async findRoomById(id: number, tenantId: number) {
    const { data, error } = await supabase
      .from('hostel_rooms')
      .select(ROOM_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? serializeRoom(data as unknown as RoomRow) : null;
  }

  async updateRoom(id: number, tenantId: number, changes: Record<string, unknown>, userId: string) {
    const { data: before } = await supabase
      .from('hostel_rooms')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    const { data, error } = await supabase
      .from('hostel_rooms')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(ROOM_SELECT)
      .single();

    if (error) throw new AppError(500, error.message);
    await auditLogRoom(userId, tenantId, String(id), 'update', before, data);
    return serializeRoom(data as unknown as RoomRow);
  }

  async softDeleteRoom(id: number, tenantId: number, userId: string) {
    const { error } = await supabase
      .from('hostel_rooms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw new AppError(500, error.message);
    await auditLogRoom(userId, tenantId, String(id), 'soft_delete');
  }

  async countActiveAllocationsInRoom(roomId: number, tenantId: number) {
    const { count, error } = await supabase
      .from('room_allocations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('room_id', roomId)
      .is('allocated_to', null)
      .is('deleted_at', null);
    if (error) throw new AppError(500, error.message);
    return count ?? 0;
  }

  async findActiveAllocationForStudent(studentId: string, tenantId: number) {
    const { data, error } = await supabase
      .from('room_allocations')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('student_id', studentId)
      .is('allocated_to', null)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data;
  }

  async listAllocations(tenantId: number, query: AllocationListQuery) {
    const { page, limit, search, blockId, roomId, activeOnly } = query;
    const cappedLimit = Math.min(limit, 500);
    const offset = (page - 1) * cappedLimit;

    let dbQuery = supabase
      .from('room_allocations')
      .select(ALLOCATION_SELECT, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('allocated_from', { ascending: false });

    if (activeOnly) dbQuery = dbQuery.is('allocated_to', null);
    if (roomId) dbQuery = dbQuery.eq('room_id', roomId);
    if (blockId) {
      const roomIds = await this.getRoomIdsForBlock(tenantId, blockId);
      if (roomIds.length === 0) {
        return { data: [], meta: { total: 0, page, limit: cappedLimit } };
      }
      dbQuery = dbQuery.in('room_id', roomIds);
    }
    if (search) {
      dbQuery = dbQuery.or(
        `students.first_name.ilike.%${search}%,students.last_name.ilike.%${search}%,students.admission_number.ilike.%${search}%`,
      );
    }

    const { data, count, error } = await dbQuery.range(offset, offset + cappedLimit - 1);
    if (error) throw new AppError(500, error.message);
    return {
      data: (data ?? []).map((row) => serializeAllocation(row as unknown as AllocationRow)),
      meta: { total: count ?? 0, page, limit: cappedLimit },
    };
  }

  async createAllocation(
    tenantId: number,
    userId: string,
    payload: {
      student_id: string;
      room_id: number;
      bed_id: number;
      allocated_from: string;
      notes?: string | null;
    },
  ) {
    const { data, error } = await supabase
      .from('room_allocations')
      .insert({
        tenant_id: tenantId,
        created_by: userId,
        ...payload,
      })
      .select(ALLOCATION_SELECT)
      .single();
    if (error) throw new AppError(500, error.message);
    return serializeAllocation(data as unknown as AllocationRow);
  }

  async findAllocationById(id: string, tenantId: number) {
    const { data, error } = await supabase
      .from('room_allocations')
      .select(ALLOCATION_SELECT)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new AppError(500, error.message);
    return data ? serializeAllocation(data as unknown as AllocationRow) : null;
  }

  async endAllocation(
    id: string,
    tenantId: number,
    userId: string,
    changes: { allocated_to: string; notes?: string | null },
  ) {
    const { data, error } = await supabase
      .from('room_allocations')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select(ALLOCATION_SELECT)
      .single();
    if (error) throw new AppError(500, error.message);
    return serializeAllocation(data as unknown as AllocationRow);
  }

  async softDeleteAllocation(id: string, tenantId: number, userId: string) {
    const { error } = await supabase
      .from('room_allocations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw new AppError(500, error.message);
    await auditLogRoom(userId, tenantId, id, 'soft_delete');
  }

  async listAllocationsForBlock(tenantId: number, blockId: number | null) {
    let dbQuery = supabase
      .from('room_allocations')
      .select(ALLOCATION_SELECT)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .is('allocated_to', null)
      .order('allocated_from', { ascending: false });

    if (blockId) {
      const roomIds = await this.getRoomIdsForBlock(tenantId, blockId);
      if (roomIds.length === 0) return [];
      dbQuery = dbQuery.in('room_id', roomIds);
    }

    const { data, error } = await dbQuery;
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => serializeAllocation(row as unknown as AllocationRow));
  }

  async getRoomIdsForBlock(tenantId: number, blockId: number) {
    const { data, error } = await supabase
      .from('hostel_rooms')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('block_id', blockId)
      .is('deleted_at', null);
    if (error) throw new AppError(500, error.message);
    return (data ?? []).map((row) => row.id as number);
  }
}

async function auditLogRoom(
  userId: string,
  tenantId: number,
  entityId: string,
  action: string,
  before?: unknown,
  after?: unknown,
) {
  const { auditLogService } = await import('../../system/services/auditLog.service');
  await auditLogService.record(userId, tenantId, 'hostel_rooms', entityId, action, {
    before,
    after,
  });
}

export const hostelRepository = new HostelRepository();
