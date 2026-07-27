import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generatePdiPdfFromTemplate(record: any, clientName: string, clientDob: string): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/PDI.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  if (page1) {
    // Approximate coordinates for PDI.pdf
    page1.drawText(clientName || '', { x: 260, y: 705, size: 10, font });
    page1.drawText(record.client?.policy_number || '', { x: 260, y: 765, size: 10, font });
    page1.drawText(clientDob || '', { x: 615, y: 705, size: 10, font });
  }

  return pdfDoc.save();
}
