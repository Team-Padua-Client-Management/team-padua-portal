/**
 * generateSroPdfFromTemplate.ts
 *
 * Fills the official Reinstatement SRO AcroForm PDF (/forms/SRO.pdf) using pdfFormUtils.
 */

import { PDFDocument } from 'pdf-lib';
import {
  initializePdfForm,
  finalizePdfForm,
  setPdfTextField,
  SMALL_PDF_FONT_SIZE,
} from './pdfFormUtils';

export async function generateSroPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/SRO.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const { form, font } = await initializePdfForm(pdfDoc);

  // General Info
  setPdfTextField(form, 'Policy Owner Last Name First Name MI', record.policy_owner_name || clientName, { useDefaultFallback: false });
  setPdfTextField(form, 'Life insured if different from the policy owner', record.life_insured_name, { useDefaultFallback: false });
  setPdfTextField(form, 'Relationship to the life insured', record.relationship_to_insured, { useDefaultFallback: false });
  setPdfTextField(form, 'Birthplace CityProvince and Country', record.birthplace, { useDefaultFallback: false });
  setPdfTextField(form, 'Birthdate daymonthyear', record.birthdate || clientDob, { useDefaultFallback: false });
  setPdfTextField(form, 'Age', record.age ? String(record.age) : '', { useDefaultFallback: false });
  setPdfTextField(form, 'Religion', record.religion, { useDefaultFallback: false });
  setPdfTextField(form, 'Citizenships', record.citizenship, { useDefaultFallback: false });
  setPdfTextField(form, 'Countryies of Legal Residence other than the Philippines', record.legal_residence_country, { useDefaultFallback: false });

  // Identification & Tax
  setPdfTextField(form, 'ID Presented', record.id_presented, { useDefaultFallback: false });
  setPdfTextField(form, 'ID No', record.id_number, { useDefaultFallback: false });
  setPdfTextField(form, 'ID Expiry Date', record.id_expiry, { useDefaultFallback: false });
  setPdfTextField(form, 'TIN', record.tin, { useDefaultFallback: false });
  setPdfTextField(form, 'SSS No or GSIS No', record.sss_gsis_no, { useDefaultFallback: false });
  setPdfTextField(form, 'Explain if there is no TIN SSS or GSIS No', record.tin_explanation, { useDefaultFallback: false });

  // Addresses & Contact Info
  setPdfTextField(form, 'Permanent Residence Address no street municipalitycity province country zip code PO Box is not acceptable', record.permanent_address, { fontSize: SMALL_PDF_FONT_SIZE, useDefaultFallback: false });
  setPdfTextField(form, 'Present Residence Address no street municipalitycity province country zip code PO Box is not acceptable', record.present_address, { fontSize: SMALL_PDF_FONT_SIZE, useDefaultFallback: false });
  setPdfTextField(form, 'Home Phone country code area code  tel no', record.home_phone, { useDefaultFallback: false });
  setPdfTextField(form, 'Work Phone country code area code  tel no', record.work_phone, { useDefaultFallback: false });
  setPdfTextField(form, 'Mobile Phone country code  mobile no', record.mobile_phone, { useDefaultFallback: false });
  setPdfTextField(form, 'Email Address', record.email_address, { fontSize: SMALL_PDF_FONT_SIZE, useDefaultFallback: false });

  // Signing
  const ownerName = record.printed_name || clientName;
  setPdfTextField(form, 'Printed Name', ownerName, { useDefaultFallback: false });
  const placeDate = [record.place_of_signing, record.date_of_signing].filter(Boolean).join(' / ');
  setPdfTextField(form, 'Place and Date of Signing daymonthyear', placeDate, { useDefaultFallback: false });

  finalizePdfForm(form, font);

  return pdfDoc.save();
}
