import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateAcaPdfFromScratch(record: any, clientName: string, clientDob: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 Size

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Draw Header Banner
  page.drawRectangle({
    x: 20,
    y: 770,
    width: 555,
    height: 50,
    color: rgb(0.92, 0.72, 0.16) // Gold color
  });

  page.drawText('Auto Charging Arrangement Enrollment Form', {
    x: 35,
    y: 788,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1)
  });

  // Section 1: Enrollment Details
  page.drawRectangle({
    x: 20,
    y: 742,
    width: 555,
    height: 20,
    color: rgb(0.12, 0.16, 0.24)
  });
  page.drawText('1  Enrollment Details', {
    x: 30,
    y: 747,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1)
  });

  // Grid
  let y = 730;
  const drawRow = (label1: string, val1: string, label2: string, val2: string, height = 35) => {
    page.drawRectangle({
      x: 20,
      y: y - height,
      width: 555,
      height: height,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1
    });
    page.drawLine({
      start: { x: 300, y: y },
      end: { x: 300, y: y - height },
      color: rgb(0.8, 0.8, 0.8),
      thickness: 1
    });

    page.drawText(label1, { x: 25, y: y - 12, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(val1 || 'N/A', { x: 25, y: y - 26, size: 10, font, color: rgb(0, 0, 0) });

    page.drawText(label2, { x: 305, y: y - 12, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(val2 || 'N/A', { x: 305, y: y - 26, size: 10, font, color: rgb(0, 0, 0) });

    y -= height;
  };

  drawRow("Cardholder's Name", clientName, 'Policy Number', record.client?.policy_number || 'N/A');
  drawRow('Enrollment Type', 'New Enrollment', 'Date Submitted', record.date_submitted || 'N/A');
  drawRow('Credit Card Number', 'XXXX-XXXX-XXXX-XXXX', 'Expiry Date (MM/YY)', 'XX / XX');
  drawRow('Comments / Remarks', record.comments || 'No comments', 'Status', record.status || 'Pending', 50);

  // Section 2: Signature
  y -= 15;
  page.drawRectangle({
    x: 20,
    y: y - 20,
    width: 555,
    height: 20,
    color: rgb(0.12, 0.16, 0.24)
  });
  page.drawText('2  Signature', {
    x: 30,
    y: y - 15,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1)
  });
  y -= 20;

  page.drawRectangle({
    x: 20,
    y: y - 120,
    width: 555,
    height: 120,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  });

  page.drawText('By signing below, you hereby confirm to have read, understood and agreed to the Terms and Conditions.', {
    x: 30,
    y: y - 25,
    size: 8.5,
    font,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('Signature of Cardholder', { x: 30, y: y - 90, size: 8, font: boldFont });
  page.drawLine({ start: { x: 30, y: y - 75 }, end: { x: 220, y: y - 75 }, color: rgb(0.5, 0.5, 0.5) });

  page.drawText('Date of Signing', { x: 330, y: y - 90, size: 8, font: boldFont });
  page.drawLine({ start: { x: 330, y: y - 75 }, end: { x: 520, y: y - 75 }, color: rgb(0.5, 0.5, 0.5) });

  y -= 120;

  // Section 3: Terms and Conditions
  y -= 25;
  page.drawRectangle({
    x: 20,
    y: y - 20,
    width: 555,
    height: 20,
    color: rgb(0.12, 0.16, 0.24)
  });
  page.drawText('3  Terms and Conditions', {
    x: 30,
    y: y - 15,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1)
  });
  y -= 20;

  page.drawRectangle({
    x: 20,
    y: y - 150,
    width: 555,
    height: 150,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1
  });

  const termsText = [
    '1. You hereby expressly authorize the Bank to charge your credit card for corresponding premiums.',
    '2. The charging of premium is subject to the approval of the Card Issuer Bank.',
    '3. In case of replacement of card, a new Auto Charging Arrangement Form must be submitted.',
    '4. Cancellation of this arrangement shall take effect only upon written notification to the Company.',
  ];

  let textY = y - 25;
  for (const line of termsText) {
    page.drawText(line, { x: 30, y: textY, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    textY -= 15;
  }

  y -= 150;

  return pdfDoc.save();
}
