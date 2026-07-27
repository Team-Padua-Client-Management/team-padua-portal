import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateSroPdfFromTemplate(record: any, clientName: string, clientDob: string): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/SRO.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  if (page1) {
    // Approximate coordinates for SRO.pdf
    page1.drawText(clientName || '', { x: 55, y: 700, size: 10, font });
    page1.drawText(record.client?.policy_number || '', { x: 55, y: 670, size: 10, font });
    page1.drawText(clientDob || '', { x: 350, y: 640, size: 10, font });
  }

  return pdfDoc.save();
}
