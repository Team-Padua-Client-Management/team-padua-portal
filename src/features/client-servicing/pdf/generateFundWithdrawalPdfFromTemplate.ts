import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

export async function generateFundWithdrawalPdfFromTemplate(record: any, clientName: string, clientDob: string): Promise<Uint8Array> {
  // Load the actual template
  const templatePdfBytes = await fetch('/forms/VRFW.07.24.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  if (page1) {
    // These are approximate coordinates for the new form VRFW.07.24.pdf
    // Adjust them later by visually checking the generated PDF

    // Policy Number
    page1.drawText(record.client?.policy_number || '', { x: 58, y: 642, size: 10, font });
    // Policy Owner
    page1.drawText(clientName || '', { x: 260, y: 642, size: 10, font });

    // Amount
    if (record.amount) {
      const amountStr = Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      page1.drawText(`PHP ${amountStr}`, { x: 200, y: 530, size: 10, font });
    }
  }

  return pdfDoc.save();
}
