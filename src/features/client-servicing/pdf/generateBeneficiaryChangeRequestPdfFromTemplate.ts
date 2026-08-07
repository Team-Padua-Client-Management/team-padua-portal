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

/** Safely formats a YYYY-MM-DD date into DDMMMYYYY (e.g. 07AUG2026) */
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

  // Policy / Plan Number
  setTxt(form, 'undefined', record.plan_numbers);

  const holderType = record.planholder_type || 'individual';

  if (holderType === 'company') {
    // Company planholder: fill company name fields
    setTxt(form, 'For CompanyBusiness Planholder', record.company_name);
    setTxt(form, 'undefined_4', record.company_name);
  } else {
    // Individual planholder — PDF field order: Last Name, First Name, MI
    // NOTE: PDF AcroForm field order on page 1 is: undefined_2 = Last Name, undefined_3 = First Name, MI = Middle Initial
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

    // ── Beneficiary #1 ──────────────────────────────────────────────────────

    setTxt(form, '12 Name Last Name First Name Middle NameCompany or Business Name', record.beneficiary1_name);

    // Sex at birth — try dedicated checkboxes; fall back silently if absent
    setCheck(form, 'Male', record.beneficiary1_sex === 'Male');
    setCheck(form, 'Female', record.beneficiary1_sex === 'Female');

    // Birthdate (DD MMM YYYY character boxes)
    const b1Date = formatAcroDate(record.beneficiary1_birthdate);
    if (b1Date) {
      setCharBoxes(form, ['Day', 'Day1'], b1Date.substring(0, 2));
      setCharBoxes(form, ['Month', 'Month1', 'Month2'], b1Date.substring(2, 5));
      setCharBoxes(form, ['Year1', 'Year2', 'Year', 'Year3'], b1Date.substring(5, 9));
    }

    setTxt(form, '15 Country of BirthIncorporation or Business Registration', record.beneficiary1_country_birth);

    // Citizenships — the PDF has two differently-named fields on page 1 and page 2
    setTxt(form, '6 CitizenshipsNationalityies', record.beneficiary1_citizenships);
    setTxt(form, '16 CitizenshipsNationalityies', record.beneficiary1_citizenships);

    // Relationship checkboxes
    // handleRelationshipSelect sets beneficiary1_relationship = 'Others' for Spouse/Child/Sibling
    // and stores the actual label in beneficiary1_relationship_others
    setCheck(form, 'Father', record.beneficiary1_relationship === 'Father');
    setCheck(form, 'Mother', record.beneficiary1_relationship === 'Mother');
    setCheck(form, 'Employer', record.beneficiary1_relationship === 'Employer');
    setCheck(form, 'undefined_10', record.beneficiary1_relationship === 'Others'); // Others checkbox

    // "Others specify" text field — filled whenever relationship is Others
    setTxt(form, '7 Relationship to the planholder', record.beneficiary1_relationship_others || (
      ['Father', 'Mother', 'Employer'].includes(record.beneficiary1_relationship)
        ? record.beneficiary1_relationship
        : record.beneficiary1_relationship_others
    ));
    setTxt(form, 'Others specify', record.beneficiary1_relationship_others);

    // Beneficiary Type
    setCheck(form, 'Primary', record.beneficiary1_type === 'Primary');
    setCheck(form, 'Contingent in the event of death of all primary beneficiaryies', record.beneficiary1_type === 'Contingent');

    // Designation
    setCheck(form, 'undefined_11', record.beneficiary1_designation === 'Revocable');
    setCheck(form, 'undefined_12', record.beneficiary1_designation === 'Irrevocable');

    // Contact and Address
    setTxt(form, '10 Home PhoneMobile No country code area code  tel no', record.beneficiary1_phone);
    setTxt(form, '11 Address No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.beneficiary1_address);

    // ── Beneficiary #2 (PDF Page 2) ─────────────────────────────────────────

    setTxt(form, '12 Name Last Name First Name Middle NameCompany or Business Name_2', record.beneficiary2_name);

    // Sex at birth — Ben 2
    setCheck(form, 'Male_2', record.beneficiary2_sex === 'Male');
    setCheck(form, 'Female_2', record.beneficiary2_sex === 'Female');

    // Birthdate — Ben 2
    const b2Date = formatAcroDate(record.beneficiary2_birthdate);
    if (b2Date) {
      setCharBoxes(form, ['Day2', 'Day3'], b2Date.substring(0, 2));
      setCharBoxes(form, ['Month3', 'Month4', 'Month5'], b2Date.substring(2, 5));
      setCharBoxes(form, ['Year5', 'Year6', 'Year4', 'Year7'], b2Date.substring(5, 9));
    }

    setTxt(form, '15 Country of BirthIncorporation or Business Registration_2', record.beneficiary2_country_birth);
    setTxt(form, '16 CitizenshipsNationalityies_2', record.beneficiary2_citizenships);

    // Relationship checkboxes — Ben 2
    setCheck(form, 'Father_2', record.beneficiary2_relationship === 'Father');
    setCheck(form, 'Mother_2', record.beneficiary2_relationship === 'Mother');
    setCheck(form, 'Employer_2', record.beneficiary2_relationship === 'Employer');
    setCheck(form, 'undefined_13', record.beneficiary2_relationship === 'Others');

    setTxt(form, '17 Relationship to the planholder', record.beneficiary2_relationship_others || (
      ['Father', 'Mother', 'Employer'].includes(record.beneficiary2_relationship)
        ? record.beneficiary2_relationship
        : record.beneficiary2_relationship_others
    ));
    setTxt(form, 'Others specify_2', record.beneficiary2_relationship_others);

    // Beneficiary Type — Ben 2
    setCheck(form, 'Primary_2', record.beneficiary2_type === 'Primary');
    setCheck(form, 'Contingent in the event of death of all primary beneficiaryies_2', record.beneficiary2_type === 'Contingent');

    // Designation — Ben 2
    setCheck(form, 'undefined_14', record.beneficiary2_designation === 'Revocable');
    setCheck(form, 'undefined_15', record.beneficiary2_designation === 'Irrevocable');

    // Contact and Address — Ben 2
    setTxt(form, '20 Home PhoneMobile No country code area code  tel no', record.beneficiary2_phone);
    setTxt(form, '21 Address No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.beneficiary2_address);
  }

  // ─── Section B.2: Remove Beneficiary ────────────────────────────────────────

  if (record.change_type === 'remove') {
    // Primary removal field (Ben 1)
    setTxt(form, '23 Name Last Name First Name Middle NameCompany or Business Name', record.remove_beneficiary1_name);
    // Second removal field (Ben 2) — if the PDF provides a second field
    setTxt(form, '23 Name Last Name First Name Middle NameCompany or Business Name_2', record.remove_beneficiary2_name);
  }

  // ─── Section B.3: Change Beneficiary Information ────────────────────────────

  if (record.change_type === 'change') {

    setTxt(form, '24 Original Beneficiary Name Last Name First Name Middle NameCompany or Business Name as it appears in the plan agreement', record.change_original_name);

    // ── Individual change fields ─────────────────────────────────────────────

    setCheck(form, 'Name', record.check_name);
    setTxt(form, 'Last Name First Name Middle Name', record.change_new_name);

    setCheck(form, 'New Other Legal Names', record.check_new_other_legal_names);
    setTxt(form, 'undefined_16', record.change_new_other_legal_names);

    // Sex at birth change
    setCheck(form, 'Sex at birth', record.check_sex);
    setCheck(form, 'Male_3', record.change_sex === 'Male');
    setCheck(form, 'Female_3', record.change_sex === 'Female');

    // Birthdate change
    setCheck(form, 'Birthdate eg 01APR2020', record.check_birthdate);
    const cbDate = formatAcroDate(record.change_birthdate);
    if (cbDate) {
      setCharBoxes(form, ['Day4', 'Day5'], cbDate.substring(0, 2));
      setCharBoxes(form, ['Month6', 'Month7', 'Month8'], cbDate.substring(2, 5));
      setCharBoxes(form, ['Year9', 'Year10', 'Year8', 'Year11'], cbDate.substring(5, 9));
    }

    // Country of birth change
    setCheck(form, 'Country of Birth', record.check_country_birth);
    setTxt(form, 'undefined_23', record.change_country_birth);

    // Citizenships change
    setCheck(form, 'CitizenshipsNationalityies', record.check_citizenships);
    setTxt(form, 'undefined_24', record.change_citizenships);

    // Phone change
    setCheck(form, 'Home PhoneMobile No', record.check_phone);
    setTxt(form, 'undefined_26', record.change_phone);

    // Address change
    setCheck(form, 'Address', record.check_address);
    setTxt(form, 'No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.change_address);

    // Relationship change
    setCheck(form, 'Relationship to the planholder', record.check_relationship);
    setCheck(form, 'Father_3', record.change_relationship === 'Father');
    setCheck(form, 'Mother_3', record.change_relationship === 'Mother');
    setCheck(form, 'undefined_25', record.change_relationship === 'Employer');
    setCheck(form, 'undefined_27', record.change_relationship === 'Others');
    setTxt(form, 'Others specify_3', record.change_relationship_others);

    // Beneficiary Type change
    setCheck(form, 'Beneficiary Type', record.check_beneficiary_type);
    setCheck(form, 'Primary_3', record.change_beneficiary_type === 'Primary');
    setCheck(form, 'Contingent in the event of death of all primary beneficiaryies_3', record.change_beneficiary_type === 'Contingent');

    // Designation change
    setCheck(form, 'Designation', record.check_designation);
    setCheck(form, 'Revocable', record.change_designation === 'Revocable');
    setCheck(form, 'Irrevocable', record.change_designation === 'Irrevocable');

    // ── Company variant change fields ────────────────────────────────────────

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

  // ─── Section C: Tax Compliance (FATCA / CRS) ────────────────────────────────

  setCheck(form, 'Yes I am a citizennational and a legal resident of', record.compliance_type === 'resident');
  setTxt(form, 'specify country', record.compliance_resident_country);

  setCheck(form, 'Yes I am a citizennational of', record.compliance_type === 'citizen');
  setTxt(form, 'undefined_33', record.compliance_citizen_country);
  setTxt(form, 'specify country but I legally reside in', record.compliance_legally_reside_country);

  setCheck(form, 'None', record.compliance_type === 'none');

  // ─── Section D: Signatures & Dates ──────────────────────────────────────────

  // 35. Date of Signing (Page 3) — DO NOT MODIFY these character-box mappings
  const dDate = formatAcroDate(record.date_of_signing);
  if (dDate) {
    setCharBoxes(form, ['Day6', 'Day7'], dDate.substring(0, 2));
    setCharBoxes(form, ['Month9', 'Month10', 'Month11'], dDate.substring(2, 5));
    setCharBoxes(form, ['Year13', 'Year14', 'Year12', 'Year15'], dDate.substring(5, 9));

    // 41. Date of Signing (Page 4 - Irrevocable Beneficiary) — DO NOT MODIFY
    setCharBoxes(form, ['Day8', 'Day9'], dDate.substring(0, 2));
    setCharBoxes(form, ['Month12', 'Month13', 'Month14'], dDate.substring(2, 5));
    setCharBoxes(form, ['Year17', 'Year18', 'Year16', 'Year19'], dDate.substring(5, 9));

    // 47. Date of Signing (Page 4 - Witness) — DO NOT MODIFY
    setCharBoxes(form, ['Day10', 'Day11'], dDate.substring(0, 2));
    setCharBoxes(form, ['Month15', 'Month16', 'Month17'], dDate.substring(2, 5));
    setCharBoxes(form, ['Year21', 'Year22', 'Year20', 'Year23'], dDate.substring(5, 9));
  }

  // 34. Place of Signing — DO NOT MODIFY this existing mapping
  setTxt(form, '46 Place of Signing', record.place_of_signing);

  // 27. Planholder Printed Name (Page 3)
  const planholderPrintedName = record.planholder_printed_name ||
    `${record.planholder_first_name || ''} ${record.planholder_last_name || ''}`.trim();
  setTxt(form, '27 Printed Name', planholderPrintedName);

  // 33. Primary Witness Printed Name (Page 3)
  setTxt(form, '33 Printed Name', record.witness_name);

  // Company Authorized Signatories (Page 3 — only relevant for company planholder)
  if (holderType === 'company') {
    setTxt(form, '28 Signature of Authorized Signatory 1For Company Business Policyholder', record.company_signatory1_name);
    setTxt(form, '30 Signature of Authorized Signatory 2 For Company Business Policyholder', record.company_signatory2_name_title);
  }

  // Page 4 — Irrevocable Beneficiary Consent Block
  // 39. Irrevocable Beneficiary #1 Printed Name
  setTxt(form, '39 Printed Name', record.irrevocable_ben1_name);

  // Irrevocable Beneficiary #1 Witness Printed Name
  setTxt(form, '43 Printed Name', record.irrevocable_ben1_witness_name);

  // Irrevocable Beneficiary #2 Printed Name (if applicable)
  setTxt(form, '39 Printed Name_2', record.irrevocable_ben2_name);

  // 45. Second Witness Printed Name (Page 4)
  setTxt(form, '45 Printed Name', record.witness2_name);

  // Electronic Communication Consent (Page 4)
  // The form uses a Yes/No pair; the checkbox in the form is checked=true for Yes
  setCheck(form, 'Yes', record.wants_communication === true);
  setCheck(form, 'No', record.wants_communication === false);

  // Flatten the form fields into the PDF graphics layer
  form.flatten();

  // ─── Signature Overlays ──────────────────────────────────────────────────────
  // Page 3 (index 2): Planholder + Witness signatures, bottom of signing page
  await embedSignature(pdfDoc, 2, record.planholder_signature, 40, 160, 200, 40);
  await embedSignature(pdfDoc, 2, record.witness_signature, 325, 100, 200, 40);

  // Company Authorized Signatories overlaid on Page 3 when company planholder
  if (holderType === 'company') {
    await embedSignature(pdfDoc, 2, record.company_signatory1_signature, 40, 100, 200, 40);
    await embedSignature(pdfDoc, 2, record.company_signatory2_signature, 40, 50, 200, 40);
  }

  // Page 4 (index 3): Irrevocable Beneficiary signatures
  await embedSignature(pdfDoc, 3, record.irrevocable_ben1_signature, 40, 600, 200, 40);
  await embedSignature(pdfDoc, 3, record.irrevocable_ben1_witness_signature, 325, 600, 200, 40);
  await embedSignature(pdfDoc, 3, record.irrevocable_ben2_signature, 40, 520, 200, 40);
  await embedSignature(pdfDoc, 3, record.witness2_signature, 325, 520, 200, 40);

  return pdfDoc.save();
}
