import { AppError } from '../../../utils/AppError';
import { studentsRepository } from '../../students/repositories/students.repository';
import type {
  AllocationListQuery,
  AttendanceTrendQuery,
  BlockListQuery,
  CreateAllocationInput,
  CreateBlockInput,
  CreateRoomInput,
  DailyReportQuery,
  EndAllocationInput,
  OccupancyReportQuery,
  RoomListQuery,
  TransferAllocationInput,
  UpdateBlockInput,
  UpdateRoomInput,
} from '../schemas/hostel.schemas';
import { hostelRepository } from '../repositories/hostel.repository';
import { hostelBedRepository } from '../repositories/hostelBed.repository';
import { hostelReportsRepository } from '../repositories/hostelReports.repository';

async function assertBedAvailable(bedId: number, tenantId: number) {
  const bed = await hostelBedRepository.findById(bedId, tenantId);
  if (!bed || !bed.is_active) throw new AppError(400, 'Invalid or inactive bed');

  const occupied = await hostelBedRepository.findActiveAllocationOnBed(bedId, tenantId);
  if (occupied) throw new AppError(409, 'Bed is already occupied');

  return bed;
}

export const hostelService = {
  listBlocks(tenantId: number, query: BlockListQuery) {
    return hostelRepository.listBlocks(tenantId, query);
  },

  async createBlock(tenantId: number, input: CreateBlockInput) {
    return hostelRepository.createBlock(tenantId, {
      name: input.name,
      description: input.description,
      is_active: input.isActive,
    });
  },

  async updateBlock(id: number, tenantId: number, input: UpdateBlockInput, userId: string) {
    const existing = await hostelRepository.findBlockById(id, tenantId);
    if (!existing) throw new AppError(404, 'Block not found');
    const changes: Record<string, unknown> = {};
    if (input.name !== undefined) changes.name = input.name;
    if (input.description !== undefined) changes.description = input.description;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return hostelRepository.updateBlock(id, tenantId, changes, userId);
  },

  async deleteBlock(id: number, tenantId: number, userId: string) {
    const existing = await hostelRepository.findBlockById(id, tenantId);
    if (!existing) throw new AppError(404, 'Block not found');
    await hostelRepository.softDeleteBlock(id, tenantId, userId);
  },

  async listRooms(tenantId: number, blockId: number, query: RoomListQuery) {
    const block = await hostelRepository.findBlockById(blockId, tenantId);
    if (!block) throw new AppError(404, 'Block not found');
    return hostelRepository.listRooms(tenantId, blockId, query);
  },

  async createRoom(tenantId: number, blockId: number, input: CreateRoomInput) {
    const block = await hostelRepository.findBlockById(blockId, tenantId);
    if (!block) throw new AppError(404, 'Block not found');
    const room = await hostelRepository.createRoom(tenantId, blockId, {
      room_number: input.roomNumber,
      capacity: input.capacity,
      is_active: input.isActive,
    });
    await hostelBedRepository.provisionForRoom(tenantId, room.id, input.capacity);
    return room;
  },

  async updateRoom(id: number, tenantId: number, input: UpdateRoomInput, userId: string) {
    const existing = await hostelRepository.findRoomById(id, tenantId);
    if (!existing) throw new AppError(404, 'Room not found');
    const changes: Record<string, unknown> = {};
    if (input.roomNumber !== undefined) changes.room_number = input.roomNumber;
    if (input.capacity !== undefined) {
      await hostelBedRepository.syncCapacity(tenantId, id, input.capacity);
      changes.capacity = input.capacity;
    }
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return hostelRepository.updateRoom(id, tenantId, changes, userId);
  },

  async deleteRoom(id: number, tenantId: number, userId: string) {
    const existing = await hostelRepository.findRoomById(id, tenantId);
    if (!existing) throw new AppError(404, 'Room not found');
    await hostelRepository.softDeleteRoom(id, tenantId, userId);
  },

  listBedsByRoom(tenantId: number, roomId: number) {
    return hostelBedRepository.listByRoom(roomId, tenantId);
  },

  listVacantBeds(tenantId: number, blockId?: number) {
    return hostelBedRepository.listVacant(tenantId, blockId);
  },

  listAllocations(tenantId: number, query: AllocationListQuery) {
    return hostelRepository.listAllocations(tenantId, query);
  },

  async createAllocation(tenantId: number, input: CreateAllocationInput, userId: string) {
    const student = await studentsRepository.findByIdWithRelations(input.studentId, tenantId);
    if (!student) throw new AppError(404, 'Student not found');

    const bed = await assertBedAvailable(input.bedId, tenantId);

    const existing = await hostelRepository.findActiveAllocationForStudent(input.studentId, tenantId);
    if (existing) {
      throw new AppError(409, 'Student already has an active bed. Use transfer instead.');
    }

    return hostelRepository.createAllocation(tenantId, userId, {
      student_id: input.studentId,
      room_id: bed.room_id,
      bed_id: input.bedId,
      allocated_from: input.allocatedFrom,
      notes: input.notes ?? null,
    });
  },

  async transferAllocation(tenantId: number, input: TransferAllocationInput, userId: string) {
    const student = await studentsRepository.findByIdWithRelations(input.studentId, tenantId);
    if (!student) throw new AppError(404, 'Student not found');

    const bed = await assertBedAvailable(input.bedId, tenantId);

    const existing = await hostelRepository.findActiveAllocationForStudent(input.studentId, tenantId);
    if (existing) {
      await hostelRepository.endAllocation(existing.id as string, tenantId, userId, {
        allocated_to: input.transferDate,
        notes: input.notes ?? null,
      });
    }

    return hostelRepository.createAllocation(tenantId, userId, {
      student_id: input.studentId,
      room_id: bed.room_id,
      bed_id: input.bedId,
      allocated_from: input.transferDate,
      notes: input.notes ?? null,
    });
  },

  async endAllocation(id: string, tenantId: number, input: EndAllocationInput, userId: string) {
    const existing = await hostelRepository.findAllocationById(id, tenantId);
    if (!existing) throw new AppError(404, 'Allocation not found');
    if (existing.allocatedTo) throw new AppError(400, 'Allocation already ended');
    return hostelRepository.endAllocation(id, tenantId, userId, {
      allocated_to: input.allocatedTo,
      notes: input.notes ?? existing.notes,
    });
  },

  async deleteAllocation(id: string, tenantId: number, userId: string) {
    const existing = await hostelRepository.findAllocationById(id, tenantId);
    if (!existing) throw new AppError(404, 'Allocation not found');
    await hostelRepository.softDeleteAllocation(id, tenantId, userId);
  },

  async getOverview(tenantId: number) {
    const occupancy = await hostelBedRepository.countOccupancy(tenantId);
    const unallocated = await hostelReportsRepository.countUnallocatedActiveStudents(tenantId);
    const today = new Date().toISOString().slice(0, 10);
    const daily = await hostelReportsRepository.getDailyReport(tenantId, today, undefined, 'morning');

    return {
      occupancy,
      unallocatedStudents: unallocated,
      todayAttendance: {
        date: today,
        hasSession: daily.hasSession,
        present: daily.totals.present,
        absent: daily.totals.absent,
        notMarked: daily.totals.notMarked,
      },
    };
  },

  getDailyReport(tenantId: number, query: DailyReportQuery) {
    return hostelReportsRepository.getDailyReport(
      tenantId,
      query.date,
      query.blockId,
      query.sessionPeriod,
    );
  },

  getOccupancyReport(tenantId: number, query: OccupancyReportQuery) {
    return hostelReportsRepository.getOccupancyReport(tenantId, query.blockId);
  },

  getAttendanceTrend(tenantId: number, query: AttendanceTrendQuery) {
    return hostelReportsRepository.getAttendanceTrend(
      tenantId,
      query.endDate,
      query.days,
      query.blockId,
    );
  },

  listAllocationsForBlock(tenantId: number, blockId: number | null) {
    return hostelRepository.listAllocationsForBlock(tenantId, blockId);
  },
};
