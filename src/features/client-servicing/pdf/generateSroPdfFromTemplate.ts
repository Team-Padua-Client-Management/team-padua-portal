/**
 * generateSroPdfFromTemplate.ts
 *
 * Fills the official Reinstatement SRO AcroForm PDF (/forms/SRO.pdf) using pdf-lib.
 */

import { PDFDocument, PDFForm } from 'pdf-lib';

function setTxt(form: PDFForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    field.setText(value);
  } catch (e) {
    console.warn(`Text field "${name}" not found in SRO PDF`);
  }
}

function setCheck(form: PDFForm, name: string, checked: boolean) {
  try {
    const field = form.getCheckBox(name);
    if (checked) field.check();
    else field.uncheck();
  } catch (e) {
    console.warn(`Checkbox "${name}" not found in SRO PDF`);
  }
}

export async function generateSroPdfFromTemplate(
  record: any,
  clientName: string,
  clientDob: string,
): Promise<Uint8Array> {
  const templatePdfBytes = await fetch('/forms/SRO.pdf').then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templatePdfBytes);
  const form = pdfDoc.getForm();

  // General Info
  setTxt(form, 'Policy Owner Last Name First Name MI', record.policy_owner_name || clientName);
  setTxt(form, 'Life insured if different from the policy owner', record.life_insured_name);
  setTxt(form, 'Relationship to the life insured', record.relationship_to_insured);
  setTxt(form, 'Birthplace CityProvince and Country', record.birthplace);
  setTxt(form, 'Birthdate daymonthyear', record.birthdate || clientDob);
  setTxt(form, 'Age', record.age ? String(record.age) : '');
  setTxt(form, 'Religion', record.religion);
  setTxt(form, 'Citizenships', record.citizenship);
  setTxt(form, 'Countryies of Legal Residence other than the Philippines', record.legal_residence_country);

  // Identification & Tax
  setTxt(form, 'ID Presented', record.id_presented);
  setTxt(form, 'ID No', record.id_number);
  setTxt(form, 'ID Expiry Date', record.id_expiry);
  setTxt(form, 'TIN', record.tin);
  setTxt(form, 'SSS No or GSIS No', record.sss_gsis_no);
  setTxt(form, 'Explain if there is no TIN SSS or GSIS No', record.tin_explanation);

  // Addresses & Contact Info
  setTxt(form, 'Permanent Residence Address no street municipalitycity province country zip code PO Box is not acceptable', record.permanent_address);
  setTxt(form, 'Present Residence Address no street municipalitycity province country zip code PO Box is not acceptable', record.present_address);
  setTxt(form, 'Home Phone country code area code  tel no', record.home_phone);
  setTxt(form, 'Work Phone country code area code  tel no', record.work_phone);
  setTxt(form, 'Mobile Phone country code  mobile no', record.mobile_phone);
  setTxt(form, 'Email Address', record.email_address);

  // Signing
  const ownerName = record.printed_name || clientName;
  setTxt(form, 'Printed Name', ownerName);
  const placeDate = [record.place_of_signing, record.date_of_signing].filter(Boolean).join(' / ');
  setTxt(form, 'Place and Date of Signing daymonthyear', placeDate);

  form.flatten();

  return pdfDoc.save();
}
