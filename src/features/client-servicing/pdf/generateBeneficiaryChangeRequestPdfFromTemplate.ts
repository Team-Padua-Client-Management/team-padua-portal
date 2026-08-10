/**
 * generateBeneficiaryChangeRequestPdfFromTemplate.ts
 *
 * Fills the official SLFPI Beneficiary Change Request AcroForm PDF using pdfFormUtils
 * for consistent font rendering, explicit per-field font size, N/A empty field handling,
 * DDMMMYYYY date formatting, and image signature embedding.
 */

import { PDFDocument } from 'pdf-lib';
import {
  initializePdfForm,
  finalizePdfForm,
  setPdfTextField,
  setPdfCheckBox,
  setPdfCharBoxes,
  formatDateAcro,
  embedPdfSignature,
  SMALL_PDF_FONT_SIZE,
} from './pdfFormUtils';

/** Helper to parse a full name string into { last, first, mi } */
function parseFullName(fullName: string | undefined | null) {
  if (!fullName) return { last: '', first: '', mi: '' };
  if (fullName.includes(',')) {
    const [lastPart, restPart] = fullName.split(',').map((s: string) => s.trim());
    const restWords = restPart ? restPart.split(/\s+/) : [];
    const last = lastPart || '';
    const first = restWords[0] || '';
    const mi = restWords.length > 1 ? restWords[restWords.length - 1].charAt(0) + '.' : '';
    return { last, first, mi };
  }
  const words = fullName.trim().split(/\s+/);
  if (words.length === 1) return { last: '', first: words[0], mi: '' };
  const last = words[words.length - 1];
  const first = words[0];
  const mi = words.length > 2 ? words[1].charAt(0) + '.' : '';
  return { last, first, mi };
}

export async function generateBeneficiaryChangeRequestPdfFromTemplate(record: any): Promise<Uint8Array> {
  const res = await fetch('/forms/SLFPI_Beneficiary Change Request.pdf');
  if (!res.ok) {
    throw new Error('Failed to load BCR PDF template. Ensure /public/forms/SLFPI_Beneficiary Change Request.pdf exists.');
  }
  const templateBytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const { form, font } = await initializePdfForm(pdfDoc);

  // ─── Section A: General Info ────────────────────────────────────────────────

  setPdfTextField(form, 'undefined', record.plan_numbers);

  let lastName = record.planholder_last_name || '';
  let firstName = record.planholder_first_name || '';
  let mi = record.planholder_mi || '';

  if (!lastName && !firstName && record.planholder_printed_name) {
    const parsed = parseFullName(record.planholder_printed_name);
    lastName = parsed.last;
    firstName = parsed.first;
    mi = parsed.mi;
  }

  setPdfTextField(form, 'MI', lastName);
  setPdfTextField(form, 'For CompanyBusiness Planholder', firstName);
  setPdfTextField(form, 'undefined_2', mi);

  // ─── Section B: Change Type ─────────────────────────────────────────────────

  setPdfCheckBox(form, 'Add Beneficiaryies', record.change_type === 'add');
  setPdfCheckBox(form, 'Remove Beneficiaryies', record.change_type === 'remove');
  setPdfCheckBox(form, 'Change of Beneficiary Information', record.change_type === 'change');

  // ─── Section B.1: Add Beneficiary ───────────────────────────────────────────

  if (record.change_type === 'add' || !record.change_type) {
    setPdfTextField(
      form,
      'Kindly complete the needed information below to add beneficiaryies to your plan If there are more than 2 additional beneficiaries',
      record.beneficiary1_name
    );

    const b1Date = formatDateAcro(record.beneficiary1_birthdate);
    if (b1Date && b1Date !== 'N/A') {
      setPdfTextField(form, '4 Birthdate eg 01FEB2026', b1Date);
      setPdfCharBoxes(form, ['Day', 'Day1'], b1Date.substring(0, 2));
      setPdfCharBoxes(form, ['Month', 'Month1', 'Month2'], b1Date.substring(2, 5));
      setPdfCharBoxes(form, ['Year1', 'Year2', 'Year', 'Year3'], b1Date.substring(5, 9));
    } else {
      setPdfTextField(form, '4 Birthdate eg 01FEB2026', 'N/A');
    }

    setPdfTextField(form, '15 Country of BirthIncorporation or Business Registration', record.beneficiary1_country_birth);
    setPdfTextField(form, '6 CitizenshipsNationalityies', record.beneficiary1_citizenships);

    const rel1 = record.beneficiary1_relationship;
    const rel1Others = record.beneficiary1_relationship_others || '';
    setPdfCheckBox(form, 'Mother1', rel1 === 'Father');
    setPdfCheckBox(form, 'Father', rel1 === 'Father');
    setPdfCheckBox(form, 'Mother', rel1 === 'Mother');
    setPdfCheckBox(form, 'Employer', rel1 === 'Employer');
    setPdfCheckBox(form, 'undefined_10', rel1 === 'Others' || Boolean(rel1Others));

    const rel1Display = ['Father', 'Mother', 'Employer'].includes(rel1)
      ? rel1
      : rel1Others || (rel1 === 'Others' ? 'Others' : rel1);
    setPdfTextField(form, '7 Relationship to the planholder', rel1Display);
    setPdfTextField(form, 'Others specify', rel1Others);

    setPdfCheckBox(form, 'Primary', record.beneficiary1_type === 'Primary' || !record.beneficiary1_type);
    setPdfCheckBox(form, 'Contingent in the event of death of all primary beneficiaryies', record.beneficiary1_type === 'Contingent');

    setPdfCheckBox(form, 'undefined_11', record.beneficiary1_designation === 'Revocable' || !record.beneficiary1_designation);
    setPdfCheckBox(form, 'undefined_12', record.beneficiary1_designation === 'Irrevocable');

    setPdfTextField(form, '10 Home PhoneMobile No country code area code  tel no', record.beneficiary1_phone);
    setPdfTextField(form, '11 Address No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.beneficiary1_address, { fontSize: SMALL_PDF_FONT_SIZE });

    if (record.beneficiary2_name) {
      setPdfTextField(form, '12 Name Last Name First Name Middle NameCompany or Business Name', record.beneficiary2_name);

      const b2Date = formatDateAcro(record.beneficiary2_birthdate);
      if (b2Date && b2Date !== 'N/A') {
        setPdfCharBoxes(form, ['Day2', 'Day3'], b2Date.substring(0, 2));
        setPdfCharBoxes(form, ['Month3', 'Month4', 'Month5'], b2Date.substring(2, 5));
        setPdfCharBoxes(form, ['Year4', 'Year5', 'Year6', 'Year7'], b2Date.substring(5, 9));
      }

      setPdfTextField(form, '15 Country of BirthIncorporation or Business Registration', record.beneficiary2_country_birth);
      setPdfTextField(form, '16 CitizenshipsNationalityies', record.beneficiary2_citizenships);

      const rel2 = record.beneficiary2_relationship;
      const rel2Others = record.beneficiary2_relationship_others || '';
      setPdfCheckBox(form, 'Father', rel2 === 'Father');
      setPdfCheckBox(form, 'Mother_2', rel2 === 'Mother');
      setPdfCheckBox(form, 'Employer_2', rel2 === 'Employer');
      setPdfCheckBox(form, 'undefined_13', rel2 === 'Others' || Boolean(rel2Others));

      const rel2Display = ['Father', 'Mother', 'Employer'].includes(rel2)
        ? rel2
        : rel2Others || (rel2 === 'Others' ? 'Others' : rel2);
      setPdfTextField(form, '17 Relationship to the planholder', rel2Display);
      setPdfTextField(form, 'Others specify_2', rel2Others);

      setPdfCheckBox(form, 'Primary_2', record.beneficiary2_type === 'Primary');
      setPdfCheckBox(form, 'Contingent in the event of death of all primary beneficiaryies_2', record.beneficiary2_type === 'Contingent');

      setPdfCheckBox(form, 'undefined_14', record.beneficiary2_designation === 'Revocable');
      setPdfCheckBox(form, 'undefined_15', record.beneficiary2_designation === 'Irrevocable');

      setPdfTextField(form, '20 Home PhoneMobile No country code area code  tel no', record.beneficiary2_phone);
      setPdfTextField(form, '21 Address No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.beneficiary2_address, { fontSize: SMALL_PDF_FONT_SIZE });
    }
  }

  // ─── Section B.2: Remove Beneficiary ────────────────────────────────────────

  if (record.change_type === 'remove') {
    const removalList = [record.remove_beneficiary1_name, record.remove_beneficiary2_name]
      .filter(Boolean)
      .join(', ');
    setPdfTextField(form, '23 Name Last Name First Name Middle NameCompany or Business Name', removalList);
  }

  // ─── Section B.3: Change Beneficiary Information ────────────────────────────

  if (record.change_type === 'change') {
    setPdfTextField(form, '24 Original Beneficiary Name Last Name First Name Middle NameCompany or Business Name as it appears in the plan agreement', record.change_original_name);

    setPdfCheckBox(form, 'Name', record.check_name);
    setPdfTextField(form, 'Last Name First Name Middle Name', record.change_new_name);

    setPdfCheckBox(form, 'New Other Legal Names', record.check_new_other_legal_names);
    setPdfTextField(form, 'undefined_16', record.change_new_other_legal_names);

    setPdfCheckBox(form, 'Sex at birth', record.check_sex);

    setPdfCheckBox(form, 'Birthdate eg 01APR2020', record.check_birthdate);
    const cbDate = formatDateAcro(record.change_birthdate);
    if (cbDate && cbDate !== 'N/A') {
      setPdfCharBoxes(form, ['Day4', 'Day5'], cbDate.substring(0, 2));
      setPdfCharBoxes(form, ['Month6', 'Month7', 'Month8'], cbDate.substring(2, 5));
      setPdfCharBoxes(form, ['Year8', 'Year9', 'Year10', 'Year11'], cbDate.substring(5, 9));
    }

    setPdfCheckBox(form, 'Country of Birth', record.check_country_birth);
    setPdfTextField(form, 'undefined_23', record.change_country_birth);

    setPdfCheckBox(form, 'CitizenshipsNationalityies', record.check_citizenships);
    setPdfTextField(form, 'undefined_24', record.change_citizenships);

    setPdfCheckBox(form, 'Home PhoneMobile No', record.check_phone);
    setPdfTextField(form, 'undefined_26', record.change_phone);

    setPdfCheckBox(form, 'Address', record.check_address);
    setPdfTextField(form, 'No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.change_address, { fontSize: SMALL_PDF_FONT_SIZE });

    setPdfCheckBox(form, 'Relationship to the planholder', record.check_relationship);
    setPdfCheckBox(form, 'Father_2', record.change_relationship === 'Father');
    setPdfCheckBox(form, 'Mother_3', record.change_relationship === 'Mother');
    setPdfCheckBox(form, 'undefined_25', record.change_relationship === 'Employer');
    setPdfCheckBox(form, 'undefined_27', record.change_relationship === 'Others');
    setPdfTextField(form, 'Others specify_3', record.change_relationship_others);

    setPdfCheckBox(form, 'Beneficiary Type', record.check_beneficiary_type);
    setPdfCheckBox(form, 'Primary_3', record.change_beneficiary_type === 'Primary');
    setPdfCheckBox(form, 'Contingent in the event of death of all primary beneficiaryies_3', record.change_beneficiary_type === 'Contingent');

    setPdfCheckBox(form, 'Designation', record.check_designation);
    setPdfCheckBox(form, 'Revocable', record.change_designation === 'Revocable');
    setPdfCheckBox(form, 'Irrevocable', record.change_designation === 'Irrevocable');
  }

  // ─── Section C: Tax Compliance ──────────────────────────────────────────────

  setPdfCheckBox(form, 'Yes I am a citizennational and a legal resident of', record.compliance_type === 'resident');
  setPdfTextField(form, 'specify country', record.compliance_resident_country);

  setPdfCheckBox(form, 'Yes I am a citizennational of', record.compliance_type === 'citizen');
  setPdfTextField(form, 'undefined_33', record.compliance_citizen_country);
  setPdfTextField(form, 'specify country but I legally reside in', record.compliance_legally_reside_country);

  setPdfCheckBox(form, 'None', record.compliance_type === 'none' || !record.compliance_type);

  // ─── Section D: Signatures & Dates ──────────────────────────────────────────

  const dDate = formatDateAcro(record.date_of_signing);
  if (dDate && dDate !== 'N/A') {
    setPdfCharBoxes(form, ['Day6', 'Day7'], dDate.substring(0, 2));
    setPdfCharBoxes(form, ['Month9', 'Month10', 'Month11'], dDate.substring(2, 5));
    setPdfCharBoxes(form, ['Year12', 'Year13', 'Year14', 'Year15'], dDate.substring(5, 9));

    setPdfCharBoxes(form, ['Day8', 'Day9'], dDate.substring(0, 2));
    setPdfCharBoxes(form, ['Month12', 'Month13', 'Month14'], dDate.substring(2, 5));
    setPdfCharBoxes(form, ['Year16', 'Year17', 'Year18', 'Year19'], dDate.substring(5, 9));

    setPdfCharBoxes(form, ['Day10', 'Day11'], dDate.substring(0, 2));
    setPdfCharBoxes(form, ['Month15', 'Month16', 'Month17'], dDate.substring(2, 5));
    setPdfCharBoxes(form, ['Year20', 'Year21', 'Year22', 'Year23'], dDate.substring(5, 9));
  }

  setPdfTextField(form, '46 Place of Signing', record.place_of_signing);

  const planholderPrintedName = record.planholder_printed_name ||
    `${record.planholder_first_name || ''} ${record.planholder_last_name || ''}`.trim();
  setPdfTextField(form, '27 Printed Name', planholderPrintedName);

  setPdfTextField(form, '33 Printed Name', record.witness_name);

  setPdfTextField(form, '39 Printed Name', record.irrevocable_ben1_name);
  setPdfTextField(form, '44 Signature of Witness a thirdparty or anyone who is not the planholder or beneficiary', record.irrevocable_ben1_witness_name);
  setPdfTextField(form, '45 Printed Name', record.witness2_name);

  setPdfCheckBox(form, 'Yes', record.wants_communication !== false);
  setPdfCheckBox(form, 'Yes1', record.wants_communication === false);

  // ─── Signature Image Embeddings ─────────────────────────────────────────────
  await embedPdfSignature(pdfDoc, 2, record.planholder_signature, 40, 160, 200, 40);
  await embedPdfSignature(pdfDoc, 2, record.witness_signature, 325, 100, 200, 40);

  await embedPdfSignature(pdfDoc, 3, record.irrevocable_ben1_signature, 40, 600, 200, 40);
  await embedPdfSignature(pdfDoc, 3, record.irrevocable_ben1_witness_signature, 325, 600, 200, 40);
  await embedPdfSignature(pdfDoc, 3, record.irrevocable_ben2_signature || record.witness2_signature, 40, 520, 200, 40);
  await embedPdfSignature(pdfDoc, 3, record.witness2_signature || record.irrevocable_witness2_signature, 325, 520, 200, 40);

  finalizePdfForm(form, font);

  return pdfDoc.save();
}
