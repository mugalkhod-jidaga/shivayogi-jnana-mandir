import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { DemographicsFields } from '@/features/students/components/DemographicsFields';
import { FamilyDetailsFields } from '@/features/students/components/FamilyDetailsFields';
import {
  buildCreateStudentPayload,
  buildUpdateStudentPayload,
  createStudentFormSchema,
  defaultFamilyDetails,
  updateStudentFormSchema,
  type CreateStudentFormValues,
  type UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';
import { usePermissions } from '@/hooks/usePermissions';
import { useCreateStudent, useStudent, useUpdateStudent } from '@/hooks/useStudent';
import { phoneToDisplay } from '@/lib/phone';
import { ApiError } from '@/lib/api';

export function StudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { hasPermission } = usePermissions();
  const canViewFamily = hasPermission('students:view_sensitive_data');

  const { data: student, isLoading } = useStudent(isEdit ? id : undefined);
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent(id ?? '');

  const createForm = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentFormSchema),
    defaultValues: {
      gender: 'Male',
      familyDetails: defaultFamilyDetails,
    },
  });

  const editForm = useForm<UpdateStudentFormValues>({
    resolver: zodResolver(updateStudentFormSchema),
    defaultValues: { gender: 'Male' },
  });

  const [bloodGroupId, setBloodGroupId] = useState('');
  const [admissionCategoryId, setAdmissionCategoryId] = useState('');

  useEffect(() => {
    if (!isEdit || !student) return;

    editForm.reset({
      firstName: student.firstName,
      lastName: student.lastName ?? '',
      dob: student.dob,
      gender: student.gender,
      medicalAlerts: student.medicalAlerts ?? '',
      familyDetails: student.familyDetails
        ? {
            fatherName: student.familyDetails.fatherName ?? '',
            motherName: student.familyDetails.motherName ?? '',
            guardianName: student.familyDetails.guardianName ?? '',
            parentStatus: student.familyDetails.parentStatus,
            annualIncome:
              student.familyDetails.annualIncome != null
                ? String(student.familyDetails.annualIncome)
                : '',
            primaryContact: phoneToDisplay(student.familyDetails.primaryContact),
            houseDetails: student.familyDetails.houseDetails ?? '',
            villageTown: student.familyDetails.villageTown,
            talukMandal: student.familyDetails.talukMandal,
            district: student.familyDetails.district,
            state: student.familyDetails.state,
            pincode: student.familyDetails.pincode,
          }
        : defaultFamilyDetails,
    });

    setBloodGroupId(student.bloodGroup ? String(student.bloodGroup.id) : '');
    setAdmissionCategoryId(
      student.admissionCategory ? String(student.admissionCategory.id) : '',
    );
  }, [isEdit, student, editForm]);

  if (isEdit && !hasPermission('students:edit')) {
    return <Navigate to={id ? `/students/${id}` : '/students'} replace />;
  }

  if (!isEdit && !hasPermission('students:create')) {
    return <Navigate to="/students" replace />;
  }

  if (isEdit && isLoading) {
    return <p className="text-muted-foreground">Loading student…</p>;
  }

  if (isEdit && !student) {
    return <Navigate to="/students" replace />;
  }

  const onCreate = createForm.handleSubmit(async (values) => {
    if (!canViewFamily) {
      toast.error('You do not have permission to create students with family details');
      return;
    }

    try {
      const payload = buildCreateStudentPayload(values, {
        bloodGroupId,
        admissionCategoryId,
      });
      const created = await createStudent.mutateAsync(payload);
      toast.success('Student created');
      navigate(`/students/${created.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not create student');
    }
  });

  const onUpdate = editForm.handleSubmit(async (values) => {
    try {
      const payload = buildUpdateStudentPayload(
        values,
        { bloodGroupId, admissionCategoryId },
        canViewFamily,
      );
      const updated = await updateStudent.mutateAsync(payload);
      toast.success('Student updated');
      navigate(`/students/${updated.id}`);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Could not update student');
    }
  });

  const isSubmitting = createStudent.isPending || updateStudent.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit student' : 'Add student'}
        description={
          isEdit
            ? `Update record for ${student?.admissionNumber}`
            : 'Create a new student record with demographics and family details.'
        }
      >
        <Button asChild variant="outline">
          <Link to={isEdit ? `/students/${id}` : '/students'}>Cancel</Link>
        </Button>
      </PageHeader>

      <form className="space-y-8" onSubmit={isEdit ? onUpdate : onCreate}>
        <section className="rounded-lg border p-6">
          <h2 className="text-lg font-medium">Demographics</h2>
          {isEdit ? (
            <div className="mt-4">
              <DemographicsFields
                register={editForm.register}
                errors={editForm.formState.errors}
                bloodGroupId={bloodGroupId}
                admissionCategoryId={admissionCategoryId}
                onBloodGroupChange={setBloodGroupId}
                onAdmissionCategoryChange={setAdmissionCategoryId}
              />
            </div>
          ) : (
            <div className="mt-4">
              <DemographicsFields
                register={createForm.register}
                createRegister={createForm.register}
                errors={createForm.formState.errors}
                bloodGroupId={bloodGroupId}
                admissionCategoryId={admissionCategoryId}
                onBloodGroupChange={setBloodGroupId}
                onAdmissionCategoryChange={setAdmissionCategoryId}
                isCreate
              />
            </div>
          )}
        </section>

        {canViewFamily && (
          <section className="rounded-lg border p-6">
            <h2 className="text-lg font-medium">Family & address</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sensitive family and income details — visible only to authorized staff.
            </p>
            <div className="mt-4">
              {isEdit ? (
                <FamilyDetailsFields
                  register={editForm.register}
                  errors={editForm.formState.errors}
                />
              ) : (
                <FamilyDetailsFields
                  register={createForm.register}
                  errors={createForm.formState.errors}
                />
              )}
            </div>
          </section>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create student'}
          </Button>
        </div>
      </form>
    </div>
  );
}
