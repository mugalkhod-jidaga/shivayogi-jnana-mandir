import { studentService } from '../../students/services/student.service';
import { studentListQuerySchema } from '../../students/schemas/student.schemas';
import { remarkService } from '../../remarks/services/remark.service';
import { remarkListQuerySchema } from '../../remarks/schemas/remark.schemas';
import {
  createPdfBuffer,
  sendPdfResponse,
  writePdfHeader,
  writePdfKeyValues,
  writePdfTable,
  type PdfTableColumn,
} from '../pdf/pdfBuilder';

function formatStudentName(firstName: string, lastName: string | null) {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export const exportService = {
  async studentListPdf(
    tenantId: number,
    query: unknown,
    userId: string,
    permissions: string[],
    res: import('express').Response,
  ) {
    const parsed = studentListQuerySchema.parse({ ...(query as object), page: 1, limit: 100 });
    const { data } = await studentService.list(tenantId, parsed, userId, permissions);

    const columns: PdfTableColumn[] = [
      { header: 'Admission #', width: 80 },
      { header: 'Name', width: 140 },
      { header: 'Standard', width: 60 },
      { header: 'Status', width: 70 },
    ];

    const rows = data.map((student) => [
      student.admissionNumber,
      formatStudentName(student.firstName, student.lastName),
      student.currentEnrollment?.standard?.value ?? '—',
      student.status,
    ]);

    const buffer = await createPdfBuffer((doc) => {
      writePdfHeader(doc, {
        title: 'Student List',
        subtitle: parsed.search ? `Search: ${parsed.search}` : undefined,
      });
      writePdfTable(doc, columns, rows);
    });

    sendPdfResponse(res, buffer, `students-${Date.now()}.pdf`);
  },

  async studentDetailPdf(
    tenantId: number,
    studentId: string,
    userId: string,
    permissions: string[],
    res: import('express').Response,
  ) {
    const student = await studentService.getById(studentId, tenantId, userId, permissions);
    const enrollment = student.currentEnrollment;

    const buffer = await createPdfBuffer((doc) => {
      writePdfHeader(doc, {
        title: 'Student Profile',
        subtitle: student.admissionNumber,
      });
      writePdfKeyValues(doc, [
        { label: 'Name', value: formatStudentName(student.firstName, student.lastName) },
        { label: 'Gender', value: student.gender },
        { label: 'DOB', value: student.dob },
        { label: 'Status', value: student.status },
        { label: 'Standard', value: enrollment?.standard?.value ?? '—' },
        { label: 'Section', value: enrollment?.section?.value ?? '—' },
        { label: 'Roll #', value: enrollment?.rollNumber ?? '—' },
      ]);
    });

    sendPdfResponse(res, buffer, `student-${student.admissionNumber}.pdf`);
  },

  async remarksListPdf(
    tenantId: number,
    query: unknown,
    userId: string,
    res: import('express').Response,
  ) {
    const parsed = remarkListQuerySchema.parse({ ...(query as object), page: 1, limit: 100 });
    const { data } = await remarkService.list(tenantId, parsed, userId);

    const columns: PdfTableColumn[] = [
      { header: 'Date', width: 75 },
      { header: 'Student', width: 110 },
      { header: 'Type', width: 65 },
      { header: 'Title', width: 150 },
    ];

    const rows = data.map((remark) => [
      new Date(remark.createdAt).toLocaleDateString('en-IN'),
      formatStudentName(remark.student.firstName, remark.student.lastName),
      remark.remarkType.value,
      remark.title,
    ]);

    const buffer = await createPdfBuffer((doc) => {
      writePdfHeader(doc, { title: 'Student Remarks' });
      writePdfTable(doc, columns, rows);
    });

    sendPdfResponse(res, buffer, `remarks-${Date.now()}.pdf`);
  },
};
