/**
 * generatePdiPdfFromTemplate.ts
 *
 * Fills the official Reinstatement PDI AcroForm PDF (/forms/PDI.pdf) using pdfFormUtils.
 */

import { PDFDocument } from 'pdf-lib';
import {
  initializePdfForm,
  finalizePdfForm,
  setPdfTextField,
  setPdfCheckBox,
  SMALL_PDF_FONT_SIZE,
} from './pdfFormUtils';

export async function generatePdiPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/PDI.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const { form, font } = await initializePdfForm(pdfDoc);

  const planholderName = record.planholder_name || record.printed_name || clientName;
  const policyNum = record.policy_number || record.client?.policy_number || '';

  // Header & General Info
  setPdfTextField(form, 'ApplicationDeclaration by Name of Planholderperson being insured', planholderName, { useDefaultFallback: false });
  setPdfTextField(form, 'under Plan No', policyNum, { useDefaultFallback: false });
  setPdfTextField(form, 'Name of PlanholderPerson being insured Last First Middle', planholderName, { useDefaultFallback: false });
  setPdfTextField(form, 'Birthdate daymonthyear', record.birthdate || clientDob, { useDefaultFallback: false });
  setPdfTextField(form, 'Age', record.age ? String(record.age) : '', { useDefaultFallback: false });

  // Option Checkboxes
  const opt = record.reinstatement_option || 'reinstatement';
  setPdfCheckBox(form, 'Reinstatement', opt === 'reinstatement');
  setPdfCheckBox(form, 'Updating', opt === 'updating');
  setPdfCheckBox(form, 'Redating', opt === 'redating');

  // Addresses & Contact Info
  setPdfTextField(form, 'Residence Address no street municipality cityprovince', record.residence_address, { fontSize: SMALL_PDF_FONT_SIZE, useDefaultFallback: false });
  setPdfTextField(form, 'Mailing Address no street municipality cityprovince', record.mailing_address, { fontSize: SMALL_PDF_FONT_SIZE, useDefaultFallback: false });
  setPdfTextField(form, 'Home Phone No', record.home_phone, { useDefaultFallback: false });
  setPdfTextField(form, 'Business Phone No', record.work_phone, { useDefaultFallback: false });
  setPdfTextField(form, 'Cell Phone No', record.mobile_phone, { useDefaultFallback: false });
  setPdfTextField(form, 'EMail Address', record.email_address, { fontSize: SMALL_PDF_FONT_SIZE, useDefaultFallback: false });

  // Signing Details
  setPdfTextField(form, 'Printed Name', planholderName, { useDefaultFallback: false });
  setPdfTextField(form, 'Place of Signing', record.place_of_signing, { useDefaultFallback: false });
  setPdfTextField(form, 'Date of Signing daymonthyear', record.date_of_signing, { useDefaultFallback: false });

  finalizePdfForm(form, font);

  return pdfDoc.save();
}
