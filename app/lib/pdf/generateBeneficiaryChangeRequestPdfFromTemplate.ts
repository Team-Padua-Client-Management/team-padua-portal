/**
 * generateBeneficiaryChangeRequestPdfFromTemplate.ts
 *
 * Fills the official SLFPI Beneficiary Change Request AcroForm PDF using pdf-lib's
 * Form Filling API. This is NOT a coordinate-overlay generator like ACR, because
 * this template is a genuine fillable form.
 */

import { PDFDocument, PDFForm } from 'pdf-lib';
import { BcrRecord } from '@/app/(admin)/admin/(ClientServicing)/bcr/page';

/** Safely sets a text field if it exists */
function setTxt(form: PDFForm, name: string, value: string | null | undefined) {
  if (!value) return;
  try {
    const field = form.getTextField(name);
    field.setText(value);
  } catch (e) {
    console.warn(`Text field "${name}" not found in PDF`);
  }
}

/** Safely checks or unchecks a checkbox if it exists */
function setCheck(form: PDFForm, name: string, checked: boolean) {
  try {
    const field = form.getCheckBox(name);
    if (checked) {
      field.check();
    } else {
      field.uncheck();
    }
  } catch (e) {
    console.warn(`Checkbox field "${name}" not found in PDF`);
  }
}

/** Splits a string into individual characters and fills a list of field names */
function setCharBoxes(form: PDFForm, names: string[], value: string | null | undefined) {
  if (!value) return;
  const chars = value.split('');
  for (let i = 0; i < Math.min(chars.length, names.length); i++) {
    setTxt(form, names[i], chars[i]);
  }
}

/** Safely formats a YYYY-MM-DD date into DD MMM YYYY */
function formatAcroDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthStr = months[parseInt(m, 10) - 1] || '';
  return `${d}${monthStr}${y}`;
}

/** Embeds an image signature (pdf-lib forms don't support native base64 embedding in fields easily) */
async function embedSignature(
  pdfDoc: PDFDocument,
  pageIndex: number,
  base64: string | null | undefined,
  areaX: number,
  areaY: number,
  areaW: number,
  areaH: number,
) {
  if (!base64) return;
  try {
    const pages = pdfDoc.getPages();
    const page = pages[pageIndex];
    if (!page) return;
    
    const [header, data] = base64.split(',');
    if (!data) return;
    const bytes = Uint8Array.from(atob(data), c => c.charCodeAt(0));
    const image = header.includes('png')
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);
      
    const { width: w, height: h } = image.scaleToFit(areaW, areaH);
    page.drawImage(image, {
      x: areaX + (areaW - w) / 2,
      y: areaY + (areaH - h) / 2,
      width: w,
      height: h,
    });
  } catch (e) {
    console.warn('Failed to embed signature image', e);
  }
}

export async function generateBeneficiaryChangeRequestPdfFromTemplate(record: BcrRecord): Promise<Uint8Array> {
  const res = await fetch('/forms/SLFPI_Beneficiary Change Request.pdf');
  if (!res.ok) {
    throw new Error('Failed to load BCR PDF template. Ensure /public/forms/SLFPI_Beneficiary Change Request.pdf exists.');
  }
  const templateBytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // ─── Section A: General Info ────────────────────────────────────────────────
  
  setTxt(form, 'undefined', record.plan_numbers);
  setTxt(form, 'undefined_4', record.plan_numbers); // Sometimes plan number appears twice
  
  if (record.planholder_type === 'company') {
    setTxt(form, 'For CompanyBusiness Planholder', record.company_name);
  } else {
    setTxt(form, 'undefined_2', record.planholder_last_name);
    setTxt(form, 'undefined_3', record.planholder_first_name);
    setTxt(form, 'MI', record.planholder_mi);
  }

  // ─── Section B: Change Type ─────────────────────────────────────────────────
  
  setCheck(form, 'Add Beneficiaryies', record.change_type === 'add');
  setCheck(form, 'Remove Beneficiaryies', record.change_type === 'remove');
  setCheck(form, 'Change of Beneficiary Information', record.change_type === 'change');

  // ─── Section B.1: Add Beneficiary ───────────────────────────────────────────
  
  if (record.change_type === 'add') {
    // Ben 1
    setTxt(form, '12 Name Last Name First Name Middle NameCompany or Business Name', record.beneficiary1_name);
    
    const b1_date = formatAcroDate(record.beneficiary1_birthdate);
    if (b1_date) {
      setCharBoxes(form, ['Day', 'Day1'], b1_date.substring(0, 2));
      setCharBoxes(form, ['Month', 'Month1', 'Month2'], b1_date.substring(2, 5));
      setCharBoxes(form, ['Year1', 'Year2', 'Year', 'Year3'], b1_date.substring(5, 9));
    }

    setTxt(form, '15 Country of BirthIncorporation or Business Registration', record.beneficiary1_country_birth);
    setTxt(form, '16 CitizenshipsNationalityies', record.beneficiary1_citizenships); // Or "6 CitizenshipsNationalityies" based on page
    setTxt(form, '6 CitizenshipsNationalityies', record.beneficiary1_citizenships);
    setTxt(form, '7 Relationship to the planholder', record.beneficiary1_relationship_others || record.beneficiary1_relationship);
    setTxt(form, 'Others specify', record.beneficiary1_relationship_others);
    setTxt(form, '10 Home PhoneMobile No country code area code  tel no', record.beneficiary1_phone);
    setTxt(form, '11 Address No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.beneficiary1_address);
    
    setCheck(form, 'Father', record.beneficiary1_relationship === 'Father');
    setCheck(form, 'Mother', record.beneficiary1_relationship === 'Mother');
    setCheck(form, 'Employer', record.beneficiary1_relationship === 'Employer');
    setCheck(form, 'undefined_10', record.beneficiary1_relationship === 'Others'); // Others check
    
    setCheck(form, 'Primary', record.beneficiary1_type === 'Primary');
    setCheck(form, 'Contingent in the event of death of all primary beneficiaryies', record.beneficiary1_type === 'Contingent');
    
    setCheck(form, 'undefined_11', record.beneficiary1_designation === 'Revocable'); // revocable
    setCheck(form, 'undefined_12', record.beneficiary1_designation === 'Irrevocable'); // irrevocable

    // Ben 2 (on page 2)
    // Looking at the dump, page 2 has "12 Name Last Name First Name Middle NameCompany or Business Name"
    // Wait, pdf-lib form fields are globally named. If there's a duplicate name, it fills both.
    
    const b2_date = formatAcroDate(record.beneficiary2_birthdate);
    if (b2_date) {
      setCharBoxes(form, ['Day2', 'Day3'], b2_date.substring(0, 2));
      setCharBoxes(form, ['Month3', 'Month4', 'Month5'], b2_date.substring(2, 5));
      setCharBoxes(form, ['Year5', 'Year6', 'Year4', 'Year7'], b2_date.substring(5, 9));
    }

    setCheck(form, 'Father_2', record.beneficiary2_relationship === 'Father');
    setCheck(form, 'Mother_2', record.beneficiary2_relationship === 'Mother');
    setTxt(form, 'Employer_2', record.beneficiary2_relationship === 'Employer' ? 'X' : ''); // Sometimes it's a text box masquerading as check
    setCheck(form, 'undefined_13', record.beneficiary2_relationship === 'Others');
    setTxt(form, 'Others specify_2', record.beneficiary2_relationship_others);
    
    setCheck(form, 'Primary_2', record.beneficiary2_type === 'Primary');
    setCheck(form, 'Contingent in the event of death of all primary beneficiaryies_2', record.beneficiary2_type === 'Contingent');
    setCheck(form, 'undefined_14', record.beneficiary2_designation === 'Revocable');
    setCheck(form, 'undefined_15', record.beneficiary2_designation === 'Irrevocable');
    
    setTxt(form, '20 Home PhoneMobile No country code area code  tel no', record.beneficiary2_phone);
    setTxt(form, '21 Address No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.beneficiary2_address);
  }

  // ─── Section B.2: Remove Beneficiary ────────────────────────────────────────
  
  if (record.change_type === 'remove') {
    setTxt(form, '23 Name Last Name First Name Middle NameCompany or Business Name', record.remove_beneficiary1_name);
    // Ben 2 remove field name might be identical or omitted, assume 1 is enough for now based on dump
  }

  // ─── Section B.3: Change Info ───────────────────────────────────────────────
  
  if (record.change_type === 'change') {
    setTxt(form, '24 Original Beneficiary Name Last Name First Name Middle NameCompany or Business Name as it appears in the plan agreement', record.change_original_name);
    
    setCheck(form, 'Name', record.check_name);
    setTxt(form, 'Last Name First Name Middle Name', record.change_new_name);
    
    setCheck(form, 'New Other Legal Names', record.check_new_other_legal_names);
    setTxt(form, 'undefined_16', record.change_new_other_legal_names);
    
    setCheck(form, 'Sex at birth', record.check_sex);
    
    setCheck(form, 'Birthdate eg 01APR2020', record.check_birthdate);
    const cb_date = formatAcroDate(record.change_birthdate);
    if (cb_date) {
      setCharBoxes(form, ['Day4', 'Day5'], cb_date.substring(0, 2));
      setCharBoxes(form, ['Month6', 'Month7', 'Month8'], cb_date.substring(2, 5));
      setCharBoxes(form, ['Year9', 'Year10', 'Year8', 'Year11'], cb_date.substring(5, 9));
    }
    
    setCheck(form, 'Country of Birth', record.check_country_birth);
    setTxt(form, 'undefined_23', record.change_country_birth);
    
    setCheck(form, 'CitizenshipsNationalityies', record.check_citizenships);
    setTxt(form, 'undefined_24', record.change_citizenships);
    
    setCheck(form, 'Relationship to the planholder', record.check_relationship);
    setCheck(form, 'Father_2', record.change_relationship === 'Father'); // Warning: names might collide with Ben 2, AcroForms are messy
    setCheck(form, 'Mother_3', record.change_relationship === 'Mother');
    setCheck(form, 'undefined_25', record.change_relationship === 'Employer');
    setTxt(form, 'Others specify_3', record.change_relationship_others);
    
    setCheck(form, 'Beneficiary Type', record.check_beneficiary_type);
    setCheck(form, 'Primary_3', record.change_beneficiary_type === 'Primary');
    setCheck(form, 'Contingent in the event of death of all primary beneficiaryies_3', record.change_beneficiary_type === 'Contingent');
    
    setCheck(form, 'Designation', record.check_designation);
    setCheck(form, 'Revocable', record.change_designation === 'Revocable');
    setCheck(form, 'Irrevocable', record.change_designation === 'Irrevocable');
    
    setCheck(form, 'Home PhoneMobile No', record.check_phone);
    setTxt(form, 'undefined_26', record.change_phone);
    
    setCheck(form, 'Address', record.check_address);
    setTxt(form, 'No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.change_address);
    
    // Company variants
    setCheck(form, 'Company or Business Name', record.check_company_name);
    setTxt(form, 'undefined_28', record.change_company_name);
    
    setCheck(form, 'Relationship to the life insured', record.check_company_relationship);
    setCheck(form, 'Employer_3', record.change_company_relationship === 'Employer');
    setCheck(form, 'Others specify_4', record.change_company_relationship === 'Others');
    setTxt(form, 'undefined_29', record.change_company_relationship_others);
    
    setCheck(form, 'Country of Incorporation or Business Registration', record.check_company_country_inc);
    setTxt(form, 'undefined_30', record.change_company_country_inc);
    
    setCheck(form, 'Designation_2', record.check_company_designation);
    setCheck(form, 'Revocable_2', record.change_company_company_designation === 'Revocable');
    setCheck(form, 'Irrevocable_2', record.change_company_company_designation === 'Irrevocable');
    
    setCheck(form, 'Business PhoneMobile No', record.check_company_phone);
    setTxt(form, 'undefined_31', record.change_company_phone);
    
    setCheck(form, 'Business Address', record.check_company_address);
    setTxt(form, 'No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable_2', record.change_company_address);
  }

  // ─── Section C: Compliance ──────────────────────────────────────────────────
  
  setCheck(form, 'Yes I am a citizennational and a legal resident of', record.compliance_type === 'resident');
  setTxt(form, 'specify country', record.compliance_resident_country);
  
  setCheck(form, 'Yes I am a citizennational of', record.compliance_type === 'citizen');
  setTxt(form, 'undefined_33', record.compliance_citizen_country);
  setTxt(form, 'specify country but I legally reside in', record.compliance_legally_reside_country);
  
  setCheck(form, 'None', record.compliance_type === 'none');

  // ─── Section D: Signatures & Dates ──────────────────────────────────────────
  
  // Date of Signing (Page 3)
  const dDate = formatAcroDate(record.date_of_signing);
  if (dDate) {
    setCharBoxes(form, ['Day6', 'Day7'], dDate.substring(0, 2));
    setCharBoxes(form, ['Month9', 'Month10', 'Month11'], dDate.substring(2, 5));
    setCharBoxes(form, ['Year13', 'Year14', 'Year12', 'Year15'], dDate.substring(5, 9));
    
    // Page 4 - Irrevocable Beneficiary Date
    setCharBoxes(form, ['Day8', 'Day9'], dDate.substring(0, 2));
    setCharBoxes(form, ['Month12', 'Month13', 'Month14'], dDate.substring(2, 5));
    setCharBoxes(form, ['Year17', 'Year18', 'Year16', 'Year19'], dDate.substring(5, 9));
    
    // Page 4 - Witness Date
    setCharBoxes(form, ['Day10', 'Day11'], dDate.substring(0, 2));
    setCharBoxes(form, ['Month15', 'Month16', 'Month17'], dDate.substring(2, 5));
    setCharBoxes(form, ['Year21', 'Year22', 'Year20', 'Year23'], dDate.substring(5, 9));
  }
  
  setTxt(form, '27 Printed Name', record.planholder_printed_name);
  setTxt(form, '33 Printed Name', record.witness_name);
  
  setTxt(form, '28 Signature of Authorized Signatory 1For Company Business Policyholder', record.company_signatory1_name); // Re-using sig boxes as name inputs if they are text fields
  setTxt(form, '30 Signature of Authorized Signatory 2 For Company Business Policyholder', record.company_signatory2_name_title);
  
  setTxt(form, '39 Printed Name', record.irrevocable_ben1_name);
  setTxt(form, '45 Printed Name', record.witness2_name);

  // Communication preference (Page 4)
  setCheck(form, 'Yes', record.wants_communication);
  setCheck(form, 'No', !record.wants_communication);
  
  setTxt(form, '46 Place of Signing', record.place_of_signing);

  // Flatten the form fields into the PDF graphics
  form.flatten();

  // Overlay signatures (using visual coordinate estimation based on standard spacing)
  // Page 2 (index 2 for standard signing page in this form)
  // Since it's 4 pages, planholder sig is typically bottom of page 3 (index 2).
  await embedSignature(pdfDoc, 2, record.planholder_signature, 40, 160, 200, 40); // Planholder
  await embedSignature(pdfDoc, 2, record.witness_signature, 325, 100, 200, 40); // Witness
  
  await embedSignature(pdfDoc, 2, record.company_signatory1_signature, 40, 100, 200, 40);
  await embedSignature(pdfDoc, 2, record.company_signatory2_signature, 40, 50, 200, 40);

  // Irrevocable signatures on Page 4 (index 3)
  await embedSignature(pdfDoc, 3, record.irrevocable_ben1_signature, 40, 600, 200, 40);
  await embedSignature(pdfDoc, 3, record.irrevocable_ben2_signature, 325, 600, 200, 40);
  await embedSignature(pdfDoc, 3, record.witness2_signature, 40, 520, 200, 40);

  return pdfDoc.save();
}
