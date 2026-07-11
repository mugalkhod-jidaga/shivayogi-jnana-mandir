import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import type { Response } from 'express';

export type PdfTableColumn = {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
};

export type PdfDocumentMeta = {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
  tenantName?: string;
  locale?: 'en' | 'kn';
};

export type PdfTableRow = string[];

const PAGE_MARGIN = 48;
const ROW_HEIGHT = 20;
const HEADER_BG = '#f3f4f6';

/** Single embedded family covering Latin + Kannada (Noto Sans Kannada). */
const PDF_FONT = 'AppSans';
const PDF_FONT_BOLD = 'AppSans-Bold';

function fontPath(filename: string) {
  return path.join(__dirname, '../../../../assets/fonts', filename);
}

function ensurePdfFonts(doc: PDFKit.PDFDocument) {
  const regular = fontPath('NotoSansKannada.ttf');
  if (!fs.existsSync(regular)) {
    throw new Error(`PDF font missing: ${regular}`);
  }
  // One family file covers EN + KN; bold alias uses the same face.
  doc.registerFont(PDF_FONT, regular);
  doc.registerFont(PDF_FONT_BOLD, regular);
}

export function createPdfBuffer(
  build: (doc: PDFKit.PDFDocument) => void,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
    ensurePdfFonts(doc);
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    build(doc);
    doc.end();
  });
}

export function writePdfHeader(doc: PDFKit.PDFDocument, meta: PdfDocumentMeta) {
  doc.fontSize(18).font(PDF_FONT_BOLD).text(meta.title, { align: 'left' });
  if (meta.subtitle) {
    doc.moveDown(0.3);
    doc.fontSize(11).font(PDF_FONT).fillColor('#4b5563').text(meta.subtitle);
  }
  const generated = meta.generatedAt ?? new Date();
  const localeTag = meta.locale === 'kn' ? 'kn-IN' : 'en-IN';
  const generatedLabel = meta.locale === 'kn' ? 'ರಚಿಸಿದ ಸಮಯ' : 'Generated';
  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .font(PDF_FONT)
    .fillColor('#6b7280')
    .text(`${generatedLabel}: ${generated.toLocaleString(localeTag)}`, { align: 'left' });
  if (meta.tenantName) {
    doc.text(meta.tenantName, { align: 'left' });
  }
  doc.moveDown(1);
  doc.fillColor('#000000');
}

export function writePdfTable(
  doc: PDFKit.PDFDocument,
  columns: PdfTableColumn[],
  rows: PdfTableRow[],
) {
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const startX = doc.page.margins.left;
  let y = doc.y;

  const drawHeader = () => {
    let x = startX;
    doc.font(PDF_FONT_BOLD).fontSize(9);
    doc.rect(startX, y, tableWidth, ROW_HEIGHT).fill(HEADER_BG);
    doc.fillColor('#111827');
    for (const col of columns) {
      doc.text(col.header, x + 4, y + 5, {
        width: col.width - 8,
        align: col.align ?? 'left',
        lineBreak: false,
      });
      x += col.width;
    }
    y += ROW_HEIGHT;
    doc.fillColor('#000000');
  };

  drawHeader();

  doc.font(PDF_FONT).fontSize(9);
  for (const row of rows) {
    if (y + ROW_HEIGHT > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
      doc.font(PDF_FONT).fontSize(9);
    }

    let x = startX;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const cell = row[i] ?? '';
      doc.text(cell, x + 4, y + 5, {
        width: col.width - 8,
        align: col.align ?? 'left',
        lineBreak: false,
      });
      x += col.width;
    }
    y += ROW_HEIGHT;
    doc
      .moveTo(startX, y)
      .lineTo(startX + tableWidth, y)
      .strokeColor('#e5e7eb')
      .lineWidth(0.5)
      .stroke();
  }

  doc.y = y + 8;
}

export function writePdfKeyValues(
  doc: PDFKit.PDFDocument,
  pairs: Array<{ label: string; value: string }>,
) {
  doc.fontSize(10).font(PDF_FONT_BOLD);
  for (const pair of pairs) {
    doc.font(PDF_FONT_BOLD).text(`${pair.label}: `, { continued: true });
    doc.font(PDF_FONT).text(pair.value || '—');
  }
  doc.moveDown(0.5);
}

const PHOTO_WIDTH = 96;
const PHOTO_HEIGHT = 120;

export function writePdfSectionTitle(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.3);
  doc.fontSize(12).font(PDF_FONT_BOLD).fillColor('#111827').text(title);
  doc.moveDown(0.4);
  doc.fillColor('#000000');
}

export function writePdfKeyValueGrid(
  doc: PDFKit.PDFDocument,
  pairs: Array<{ label: string; value: string }>,
  columns = 2,
) {
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns;
  const startX = doc.page.margins.left;
  let x = startX;
  let y = doc.y;
  const rowHeight = 28;

  doc.fontSize(9);

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      x = startX;
    }

    doc.font(PDF_FONT_BOLD).fillColor('#374151').text(pair.label, x, y, { width: colWidth - 12 });
    doc.font(PDF_FONT).fillColor('#111827').text(pair.value || '—', x, y + 12, {
      width: colWidth - 12,
    });

    const colIndex = i % columns;
    if (colIndex === columns - 1) {
      y += rowHeight;
      x = startX;
    } else {
      x += colWidth;
    }
  }

  if (pairs.length % columns !== 0) {
    y += rowHeight;
  }

  doc.y = y + 4;
  doc.fillColor('#000000');
}

export type PdfProfileHeaderOptions = {
  name: string;
  subtitle?: string;
  photoBuffer?: Buffer | null;
  noPhotoLabel?: string;
};

export function writePdfProfileHeader(doc: PDFKit.PDFDocument, options: PdfProfileHeaderOptions) {
  const startY = doc.y;
  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const textWidth = contentWidth - PHOTO_WIDTH - 16;
  const photoX = doc.page.margins.left + contentWidth - PHOTO_WIDTH;

  doc.fontSize(16).font(PDF_FONT_BOLD).text(options.name, doc.page.margins.left, startY, {
    width: textWidth,
  });

  if (options.subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(11).font(PDF_FONT).fillColor('#4b5563').text(options.subtitle, {
      width: textWidth,
    });
    doc.fillColor('#000000');
  }

  const photoY = startY;
  if (options.photoBuffer) {
    try {
      doc.image(options.photoBuffer, photoX, photoY, {
        fit: [PHOTO_WIDTH, PHOTO_HEIGHT],
        align: 'center',
        valign: 'center',
      });
      doc
        .rect(photoX, photoY, PHOTO_WIDTH, PHOTO_HEIGHT)
        .strokeColor('#d1d5db')
        .lineWidth(0.5)
        .stroke();
    } catch {
      writePdfPhotoPlaceholder(doc, photoX, photoY, options.noPhotoLabel ?? '—');
    }
  } else {
    writePdfPhotoPlaceholder(doc, photoX, photoY, options.noPhotoLabel ?? '—');
  }

  doc.y = Math.max(doc.y, startY + PHOTO_HEIGHT + 12);
}

function writePdfPhotoPlaceholder(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
) {
  doc.rect(x, y, PHOTO_WIDTH, PHOTO_HEIGHT).fillAndStroke('#f9fafb', '#d1d5db');
  doc
    .fontSize(8)
    .font(PDF_FONT)
    .fillColor('#6b7280')
    .text(label, x + 4, y + PHOTO_HEIGHT / 2 - 6, {
      width: PHOTO_WIDTH - 8,
      align: 'center',
    });
  doc.fillColor('#000000');
}

export function sendPdfResponse(res: Response, buffer: Buffer, filename: string) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
}
