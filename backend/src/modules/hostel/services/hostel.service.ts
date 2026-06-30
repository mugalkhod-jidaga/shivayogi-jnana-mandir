import { AppError } from '../../../utils/AppError';
import { studentsRepository } from '../../students/repositories/students.repository';
import type {
  AllocationListQuery,
  BlockListQuery,
  CreateAllocationInput,
  CreateBlockInput,
  CreateRoomInput,
  EndAllocationInput,
  RoomListQuery,
  UpdateBlockInput,
  UpdateRoomInput,
} from '../schemas/hostel.schemas';
import { hostelRepository } from '../repositories/hostel.repository';

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
    return hostelRepository.createRoom(tenantId, blockId, {
      room_number: input.roomNumber,
      capacity: input.capacity,
      is_active: input.isActive,
    });
  },

  async updateRoom(id: number, tenantId: number, input: UpdateRoomInput, userId: string) {
    const existing = await hostelRepository.findRoomById(id, tenantId);
    if (!existing) throw new AppError(404, 'Room not found');
    const changes: Record<string, unknown> = {};
    if (input.roomNumber !== undefined) changes.room_number = input.roomNumber;
    if (input.capacity !== undefined) changes.capacity = input.capacity;
    if (input.isActive !== undefined) changes.is_active = input.isActive;
    return hostelRepository.updateRoom(id, tenantId, changes, userId);
  },

  async deleteRoom(id: number, tenantId: number, userId: string) {
    const existing = await hostelRepository.findRoomById(id, tenantId);
    if (!existing) throw new AppError(404, 'Room not found');
    await hostelRepository.softDeleteRoom(id, tenantId, userId);
  },

  listAllocations(tenantId: number, query: AllocationListQuery) {
    return hostelRepository.listAllocations(tenantId, query);
  },

  async createAllocation(tenantId: number, input: CreateAllocationInput, userId: string) {
    const student = await studentsRepository.findByIdWithRelations(input.studentId, tenantId);
    if (!student) throw new AppError(404, 'Student not found');

    const room = await hostelRepository.findRoomById(input.roomId, tenantId);
    if (!room || !room.isActive) throw new AppError(400, 'Invalid or inactive room');

    const existing = await hostelRepository.findActiveAllocationForStudent(input.studentId, tenantId);
    if (existing) throw new AppError(409, 'Student already has an active room allocation');

    const occupied = await hostelRepository.countActiveAllocationsInRoom(input.roomId, tenantId);
    if (occupied >= room.capacity) throw new AppError(409, 'Room is at full capacity');

    return hostelRepository.createAllocation(tenantId, userId, {
      student_id: input.studentId,
      room_id: input.roomId,
      allocated_from: input.allocatedFrom,
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
};
