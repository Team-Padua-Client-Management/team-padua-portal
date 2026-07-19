import { PDFDocument, rgb } from 'pdf-lib';
import type { AcrRecord } from '@/app/(admin)/admin/(ClientServicing)/acr/page';

export async function generateACRPdf(
  record: AcrRecord,
  ownerName: { first: string; last: string; middle: string },
  ownerDob: string
): Promise<Uint8Array> {
  // Fetch the template
  const url = '/templates/SLOCPI_Advisor_Change_Request.pdf';
  const response = await fetch(url);
  const existingPdfBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const secondPage = pages[1];

  // Helper to draw text
  const drawText = (text: string | null | undefined, x: number, y: number, size = 10, page = firstPage) => {
    if (!text) return;
    page.drawText(text, {
      x,
      y,
      size,
      color: rgb(0, 0, 0),
    });
  };

  const drawCheckbox = (checked: boolean | undefined, x: number, y: number, page = firstPage) => {
    if (checked) {
      drawText('X', x, y, 12, page);
    }
  };

  // -------------------------------------------------------------
  // ITERATIVE COORDINATE MAPPING - FIRST PASS
  // Note: Y-coordinates in pdf-lib start from 0 at the BOTTOM of the page.
  // Page height is 792.
  // -------------------------------------------------------------

  // Section A - General Information
  // Guessing coordinates based on standard layouts. 
  // We will need to adjust these after the first visual check.
  
  // Policy Owner Name
  drawText(ownerName.last, 60, 620);
  drawText(ownerName.first, 260, 620);
  drawText(ownerName.middle, 460, 620);

  // Date of Birth (Day / Month / Year)
  if (ownerDob) {
    const parts = ownerDob.split('-'); // YYYY-MM-DD
    if (parts.length === 3) {
       // DD
       drawText(parts[2], 60, 580);
       // MM
       drawText(parts[1], 100, 580);
       // YYYY
       drawText(parts[0], 140, 580);
    }
  }

  // Company Name & Designation
  drawText(record.company_name, 260, 580);
  drawText(record.designation, 460, 580);

  // Section B - Request Details
  drawCheckbox(record.request_type === 'specific_policy', 60, 540);
  if (record.request_type === 'specific_policy') {
    drawText(record.policy_numbers, 100, 540);
  }

  drawCheckbox(record.request_type === 'all_accounts', 60, 520);
  if (record.request_type === 'all_accounts') {
    drawCheckbox(record.account_individual_life, 80, 500);
    drawCheckbox(record.account_group_life, 260, 500);
    drawCheckbox(record.account_mutual_fund, 80, 480);
    drawCheckbox(record.account_pre_need, 260, 480);
    
    drawText(record.reference_policy_number, 160, 460);
  }

  // Section C - Reason for Change
  drawCheckbox(record.reason_type === 'no_advisor', 60, 420);
  drawCheckbox(record.reason_type === 'prefer_another', 60, 400);
  if (record.reason_type === 'prefer_another') {
    drawText(record.reason_details, 80, 380);
  }

  // Section D - New Advisor Information
  drawText(record.new_advisor_last_name, 60, 320);
  drawText(record.new_advisor_first_name, 260, 320);
  drawText(record.new_advisor_middle_name, 460, 320);

  // Section E - Signatures (Page 2 usually, or bottom of Page 1)
  // Let's assume Section E is on page 2
  drawText(record.place_of_signing, 60, 680, 10, secondPage);
  if (record.date_of_signing) {
    const parts = record.date_of_signing.split('-');
    if (parts.length === 3) {
      drawText(parts[2], 260, 680, 10, secondPage); // DD
      drawText(parts[1], 300, 680, 10, secondPage); // MM
      drawText(parts[0], 340, 680, 10, secondPage); // YYYY
    }
  }

  // Signatures will require drawing images if they are base64 from SignaturePad
  const drawSignature = async (base64Str: string, x: number, y: number, page = secondPage) => {
    if (!base64Str) return;
    try {
      const imgBytes = Uint8Array.from(atob(base64Str.split(',')[1]), c => c.charCodeAt(0));
      const image = await pdfDoc.embedPng(imgBytes);
      const { width, height } = image.scale(0.2); // scale down signature
      page.drawImage(image, { x, y, width, height });
    } catch (e) {
      console.error('Failed to embed signature', e);
    }
  };

  await drawSignature(record.policy_owner_signature, 60, 600, secondPage);
  await drawSignature(record.new_advisor_signature, 360, 600, secondPage);

  drawText(record.code_number, 360, 560, 10, secondPage);
  drawText(record.nbo_iso, 460, 560, 10, secondPage);

  // Section F.2 - Declarations
  drawCheckbox(record.wants_communication, 60, 480, secondPage);

  // Section G - Office Use Only
  drawText(record.received_by_staff, 60, 400, 10, secondPage);
  drawText(record.receiving_department, 260, 400, 10, secondPage);
  if (record.date_received) {
    const parts = record.date_received.split('-');
    if (parts.length === 3) {
      drawText(parts[2], 60, 360, 10, secondPage);
      drawText(parts[1], 100, 360, 10, secondPage);
      drawText(parts[0], 140, 360, 10, secondPage);
    }
  }
  drawText(record.time_received, 260, 360, 10, secondPage);

  return await pdfDoc.save();
}
