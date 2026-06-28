import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AcademicStandardSelect } from '@/components/lookups/AcademicStandardSelect';
import { AcademicYearSelect } from '@/components/lookups/AcademicYearSelect';
import { SectionSelect } from '@/components/lookups/SectionSelect';
import type {
  CreateStudentFormValues,
  UpdateStudentFormValues,
} from '@/features/students/schemas/studentForm.schema';

type AcademicPlacementFieldsProps = {
  register: UseFormRegister<CreateStudentFormValues | UpdateStudentFormValues>;
  errors: FieldErrors<CreateStudentFormValues | UpdateStudentFormValues>;
  academicYearId: string;
  standardId: string;
  sectionId: string;
  onAcademicYearChange: (value: string) => void;
  onStandardChange: (value: string) => void;
  onSectionChange: (value: string) => void;
};

export function AcademicPlacementFields({
  register,
  errors,
  academicYearId,
  standardId,
  sectionId,
  onAcademicYearChange,
  onStandardChange,
  onSectionChange,
}: AcademicPlacementFieldsProps) {
  const academicErrors = errors.academicPlacement;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="academicYearId">Academic year</Label>
        <AcademicYearSelect
          id="academicYearId"
          value={academicYearId}
          onChange={onAcademicYearChange}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="standardId">Standard / class</Label>
        <AcademicStandardSelect id="standardId" value={standardId} onChange={onStandardChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="sectionId">Section (optional)</Label>
        <SectionSelect id="sectionId" value={sectionId} onChange={onSectionChange} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rollNumber">Roll number</Label>
        <Input id="rollNumber" {...register('academicPlacement.rollNumber')} />
        {academicErrors?.rollNumber && (
          <p className="text-sm text-destructive">{academicErrors.rollNumber.message}</p>
        )}
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="previousSchool">Previous school</Label>
        <Input id="previousSchool" {...register('academicPlacement.previousSchool')} />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="lastClassStudied">Last class studied</Label>
        <Input id="lastClassStudied" {...register('academicPlacement.lastClassStudied')} />
      </div>
    </div>
  );
}
