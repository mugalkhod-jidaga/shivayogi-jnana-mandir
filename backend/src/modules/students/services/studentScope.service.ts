import { usersRepository } from '../../auth/repositories/users.repository';
import { AppError } from '../../../utils/AppError';
import {
  studentsRepository,
  unwrapEnrollment,
  type StudentRow,
} from '../../students/repositories/students.repository';

const FULL_ACCESS_ROLES = new Set(['Super Admin', 'Admissions Clerk', 'Finance']);

export async function resolveStandardScope(userId: string): Promise<number[] | undefined> {
  const roles = await usersRepository.findRoles(userId);
  const roleNames = roles.map((r) => r.name);
  if (roleNames.some((name) => FULL_ACCESS_ROLES.has(name))) {
    return undefined;
  }

  if (roleNames.includes('Teacher/Warden')) {
    return studentsRepository.getAssignedStandardIds(userId);
  }

  return undefined;
}

export async function assertStudentStandardAccess(
  student: StudentRow,
  userId: string,
): Promise<void> {
  const assignedStandardIds = await resolveStandardScope(userId);
  if (assignedStandardIds === undefined) return;

  const enrollment = unwrapEnrollment(student);
  if (!enrollment) {
    throw new AppError(403, 'Access denied for this student');
  }

  if (!assignedStandardIds.includes(enrollment.standard_id)) {
    throw new AppError(403, 'Access denied for this student standard');
  }
}

export async function assertStudentIdAccess(
  studentId: string,
  tenantId: number,
  userId: string,
): Promise<StudentRow> {
  const student = await studentsRepository.findByIdWithRelations(studentId, tenantId);
  if (!student) throw new AppError(404, 'Student not found');
  await assertStudentStandardAccess(student, userId);
  return student;
}
