/**
 * generateBeneficiaryChangeRequestPdfFromTemplate.ts
 *
 * Fills the official SLOCPI Beneficiary Change Request AcroForm PDF (/public/forms/SLOCPI-beneficiary-change-request.pdf)
 * using pdfFormUtils for consistent font rendering, explicit per-field font size, uppercase normalization,
 * DDMMMYYYY date formatting into character boxes, and digital signature canvas embeddings.
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
  const res = await fetch('/forms/SLOCPI-beneficiary-change-request.pdf');
  if (!res.ok) {
    throw new Error('Failed to load BCR PDF template. Ensure /public/forms/SLOCPI-beneficiary-change-request.pdf exists.');
  }
  const templateBytes = await res.arrayBuffer();
  const pdfDoc = await PDFDocument.load(templateBytes);
  const { form, font } = await initializePdfForm(pdfDoc);

  const uppercaseOpts = { uppercase: true };

  // ─── Section A: General Info (Page 1) ───────────────────────────────────────

  const policyNumbers = record.policy_number || record.policy_numbers || record.plan_numbers || '';
  setPdfTextField(form, 'undefined', policyNumbers, uppercaseOpts);

  let lastName = record.policy_owner_last_name || record.planholder_last_name || '';
  let firstName = record.policy_owner_first_name || record.planholder_first_name || '';
  let mi = record.policy_owner_mi || record.planholder_mi || '';

  if (!lastName && !firstName && (record.policy_owner_printed_name || record.planholder_printed_name || record.client_name)) {
    const rawName = record.policy_owner_printed_name || record.planholder_printed_name || record.client_name;
    const parsed = parseFullName(rawName);
    lastName = parsed.last;
    firstName = parsed.first;
    mi = parsed.mi;
  }

  setPdfTextField(form, 'undefined_2', lastName, uppercaseOpts);
  setPdfTextField(form, 'MI', firstName, uppercaseOpts);
  setPdfTextField(form, 'undefined_3', mi, uppercaseOpts);

  const companyName = record.company_name || record.business_name || '';
  const designation = record.designation || record.job_title || '';
  setPdfTextField(form, 'For CompanyBusiness Policy Owner', companyName, uppercaseOpts);
  setPdfTextField(form, 'undefined_4', designation, uppercaseOpts);

  // ─── Section B: Change Type (Page 1) ────────────────────────────────────────

  const changeType = record.change_type || 'add';
  setPdfCheckBox(form, 'Add Beneficiaryies', changeType === 'add');
  setPdfCheckBox(form, 'Remove Beneficiaryies', changeType === 'remove');
  setPdfCheckBox(form, 'Change of Beneficiary Information', changeType === 'change');

  // ─── Section B.1: Add Beneficiary (Beneficiary 1 - Page 1) ──────────────────

  if (changeType === 'add' || !changeType) {
    const b1Name = record.beneficiary1_name || record.beneficiary_name || '';
    setPdfTextField(form, '2 Name Last First MICompany or Business Name', b1Name, uppercaseOpts);

    const b1Sex = record.beneficiary1_sex || record.beneficiary_sex;
    setPdfCheckBox(form, 'undefined_5', b1Sex === 'Male' || b1Sex === 'M');
    setPdfCheckBox(form, 'undefined_6', b1Sex === 'Female' || b1Sex === 'F');

    const b1Date = formatDateAcro(record.beneficiary1_birthdate || record.beneficiary_birthdate);
    if (b1Date && b1Date !== 'N/A' && b1Date.length === 9) {
      setPdfCharBoxes(form, ['undefined_7', 'undefined_71'], b1Date.substring(0, 2));
      setPdfCharBoxes(form, ['undefined_72', 'undefined_73', 'undefined_74'], b1Date.substring(2, 5));
      setPdfCharBoxes(form, ['undefined_75', 'undefined_76', 'undefined_77', 'undefined_78'], b1Date.substring(5, 9));
    }

    setPdfTextField(form, '5 Country of BirthIncorporation or Business Registration', record.beneficiary1_country_birth || record.beneficiary_country_birth, uppercaseOpts);
    setPdfTextField(form, '6 CitizenshipsNationalityies', record.beneficiary1_citizenships || record.beneficiary_citizenships, uppercaseOpts);

    const rel1 = record.beneficiary1_relationship || record.beneficiary_relationship || '';
    const rel1Others = record.beneficiary1_relationship_others || record.beneficiary_relationship_others || '';
    setPdfCheckBox(form, 'Father', rel1 === 'Father');
    setPdfCheckBox(form, 'Mother', rel1 === 'Mother');
    setPdfCheckBox(form, 'Employer', rel1 === 'Employer');
    setPdfCheckBox(form, 'undefined_10', rel1 === 'Others' || Boolean(rel1Others));
    setPdfTextField(form, 'Others specify', rel1Others || (rel1 !== 'Father' && rel1 !== 'Mother' && rel1 !== 'Employer' ? rel1 : ''), uppercaseOpts);

    const des1 = record.beneficiary1_designation || record.beneficiary_designation || 'Revocable';
    setPdfCheckBox(form, 'Revocable', des1 === 'Revocable');
    setPdfCheckBox(form, 'Irrevocable', des1 === 'Irrevocable');

    const type1 = record.beneficiary1_type || record.beneficiary_type || 'Primary';
    setPdfCheckBox(form, 'Primary', type1 === 'Primary');
    setPdfCheckBox(form, 'Contingent', type1 === 'Contingent');

    const shareAndPhone1 = [
      record.beneficiary1_share_percentage ? `${record.beneficiary1_share_percentage}%` : '',
      record.beneficiary1_phone || record.beneficiary_phone || ''
    ].filter(Boolean).join(' | ');
    setPdfTextField(form, 'undefined_8', shareAndPhone1, uppercaseOpts);
    setPdfTextField(form, 'undefined_9', record.beneficiary1_address || record.beneficiary_address || '', { ...uppercaseOpts, fontSize: SMALL_PDF_FONT_SIZE });

    // ─── Section B.1: Beneficiary 2 (Page 2) ───────────────────────────────────

    if (record.beneficiary2_name) {
      setPdfTextField(form, '12 Name Last First MICompany or Business Name', record.beneficiary2_name, uppercaseOpts);

      const b2Sex = record.beneficiary2_sex;
      setPdfCheckBox(form, 'Revocable_21', b2Sex === 'Male' || b2Sex === 'M');
      setPdfCheckBox(form, 'Irrevocable_21', b2Sex === 'Female' || b2Sex === 'F');

      const b2Date = formatDateAcro(record.beneficiary2_birthdate);
      if (b2Date && b2Date !== 'N/A' && b2Date.length === 9) {
        setPdfCharBoxes(form, ['14 Birthdate eg 01APR2020', 'Day'], b2Date.substring(0, 2));
        setPdfCharBoxes(form, ['Month', 'undefined_12', 'undefined_13'], b2Date.substring(2, 5));
        setPdfCharBoxes(form, ['undefined_14', 'Year', 'undefined_15', 'undefined_16'], b2Date.substring(5, 9));
      }

      setPdfTextField(form, '15 Country of BirthIncorporation or Business Registration', record.beneficiary2_country_birth, uppercaseOpts);
      setPdfTextField(form, 'fill_28', record.beneficiary2_citizenships, uppercaseOpts);

      const rel2 = record.beneficiary2_relationship || '';
      const rel2Others = record.beneficiary2_relationship_others || '';
      setPdfCheckBox(form, 'Father_2', rel2 === 'Father');
      setPdfCheckBox(form, 'Mother_2', rel2 === 'Mother');
      setPdfCheckBox(form, 'Employer_2', rel2 === 'Employer');
      setPdfCheckBox(form, 'undefined_17', rel2 === 'Others' || Boolean(rel2Others));
      setPdfTextField(form, 'Others specify_2', rel2Others || (rel2 !== 'Father' && rel2 !== 'Mother' && rel2 !== 'Employer' ? rel2 : ''), uppercaseOpts);

      const des2 = record.beneficiary2_designation || 'Revocable';
      setPdfCheckBox(form, 'Revocable_2', des2 === 'Revocable');
      setPdfCheckBox(form, 'Irrevocable_2', des2 === 'Irrevocable');

      const type2 = record.beneficiary2_type || 'Primary';
      setPdfCheckBox(form, 'undefined_18', type2 === 'Primary');
      setPdfCheckBox(form, 'undefined_19', type2 === 'Contingent');

      const share2 = record.beneficiary2_share_percentage ? `${record.beneficiary2_share_percentage}%` : (record.beneficiary2_share || '');
      setPdfTextField(form, '19 Designation Primary Contingent', share2, uppercaseOpts);
      setPdfTextField(form, '20 Home PhoneMobile No country code area code  tel no', record.beneficiary2_phone, uppercaseOpts);
    }
  }

  // ─── Section B.2: Remove Beneficiary (Page 2) ───────────────────────────────

  if (changeType === 'remove') {
    setPdfTextField(form, '22 Name Last First MICompany or Business Name', record.remove_beneficiary1_name || record.remove_beneficiary_name, uppercaseOpts);
    setPdfTextField(form, '23 Name Last First MICompany or Business Name', record.remove_beneficiary2_name, uppercaseOpts);
    setPdfTextField(form, 'fill_38', record.remove_beneficiary_notes || record.remove_beneficiary3_name, uppercaseOpts);
  }

  // ─── Section B.3: Change Beneficiary Information (Page 2) ───────────────────

  if (changeType === 'change') {
    setPdfCheckBox(form, 'Name', record.check_name);
    setPdfTextField(form, 'Last First MI', record.change_new_name || record.change_name, uppercaseOpts);

    setPdfCheckBox(form, 'New Other Legal Names', record.check_new_other_legal_names);
    setPdfTextField(form, 'undefined_20', record.change_new_other_legal_names, uppercaseOpts);

    const cSex = record.change_sex;
    setPdfCheckBox(form, 'Sex at birth', record.check_sex || Boolean(cSex));
    setPdfCheckBox(form, 'Name1', cSex === 'Male' || cSex === 'M');
    setPdfCheckBox(form, 'Name2', cSex === 'Female' || cSex === 'F');

    setPdfCheckBox(form, 'Birthdate eg 01APR2020', record.check_birthdate || Boolean(record.change_birthdate));
    const cbDate = formatDateAcro(record.change_birthdate);
    if (cbDate && cbDate !== 'N/A' && cbDate.length === 9) {
      setPdfCharBoxes(form, ['Day_2', 'undefined_22'], cbDate.substring(0, 2));
      setPdfCharBoxes(form, ['undefined_23', 'Month_2', 'undefined_24'], cbDate.substring(2, 5));
      setPdfCharBoxes(form, ['undefined_25', 'undefined_26', 'Year_2', 'undefined_27'], cbDate.substring(5, 9));
    }

    setPdfCheckBox(form, 'Country of Birth', record.check_country_birth || Boolean(record.change_country_birth));
    setPdfTextField(form, 'undefined_28', record.change_country_birth, uppercaseOpts);

    setPdfCheckBox(form, 'CitizenshipsNationalityies', record.check_citizenships || Boolean(record.change_citizenships));
    setPdfTextField(form, 'undefined_29', record.change_citizenships, uppercaseOpts);

    const relC = record.change_relationship;
    setPdfCheckBox(form, 'Relationship to the life insured', record.check_relationship || Boolean(relC));
    setPdfCheckBox(form, 'Father_3', relC === 'Father');
    setPdfCheckBox(form, 'Mother_3', relC === 'Mother');
    setPdfCheckBox(form, 'undefined_30', relC === 'Others' || Boolean(record.change_relationship_others));
    setPdfTextField(form, 'Others specify_3', record.change_relationship_others, uppercaseOpts);

    const desC = record.change_designation;
    setPdfCheckBox(form, 'toggle_24', record.check_designation || Boolean(desC));
    setPdfCheckBox(form, 'Revocable_3', desC === 'Revocable');
    setPdfCheckBox(form, 'Irrevocable_3', desC === 'Irrevocable');

    const typeC = record.change_beneficiary_type || record.change_type_beneficiary;
    setPdfCheckBox(form, 'Designation', record.check_beneficiary_type || Boolean(typeC));
    setPdfCheckBox(form, 'Primary_2', typeC === 'Primary');
    setPdfCheckBox(form, 'Contingent_2', typeC === 'Contingent');

    setPdfCheckBox(form, 'Home PhoneMobile No country code area code', record.check_phone || Boolean(record.change_phone));
    setPdfTextField(form, 'undefined_31', record.change_phone, uppercaseOpts);

    setPdfCheckBox(form, 'Address', record.check_address || Boolean(record.change_address));
    setPdfTextField(form, 'No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable', record.change_address, { ...uppercaseOpts, fontSize: SMALL_PDF_FONT_SIZE });
    setPdfTextField(form, 'undefined_32', record.change_address_line2, { ...uppercaseOpts, fontSize: SMALL_PDF_FONT_SIZE });
  }

  // ─── Section B.4: Corporate / Entity Beneficiary (Page 3) ───────────────────

  if (record.is_corporate_beneficiary || record.corporate_name) {
    setPdfCheckBox(form, 'Company or Business Name', true);
    setPdfTextField(form, 'undefined_33', record.corporate_name, uppercaseOpts);

    const corpRel = record.corporate_relationship || '';
    setPdfCheckBox(form, 'Relationship to the life insured_2', Boolean(corpRel));
    setPdfCheckBox(form, 'Employer_3', corpRel === 'Employer');
    setPdfCheckBox(form, 'Others specify_4', corpRel === 'Others' || Boolean(record.corporate_relationship_others));
    setPdfTextField(form, 'undefined_34', record.corporate_relationship_others || corpRel, uppercaseOpts);

    setPdfCheckBox(form, 'Country of Incorporation or Business Registration', Boolean(record.corporate_country));
    setPdfTextField(form, 'undefined_35', record.corporate_country, uppercaseOpts);

    const corpDes = record.corporate_designation;
    setPdfCheckBox(form, 'Designation_2', Boolean(corpDes));
    setPdfCheckBox(form, 'Primary_3', corpDes === 'Primary');
    setPdfCheckBox(form, 'Contingent_3', corpDes === 'Contingent');

    setPdfCheckBox(form, 'Business PhoneMobile No country code area code', Boolean(record.corporate_phone));
    setPdfTextField(form, 'undefined_36', record.corporate_phone, uppercaseOpts);

    setPdfCheckBox(form, 'Business Address', Boolean(record.corporate_address));
    setPdfTextField(form, 'No Street VillageSubdivision Barangay CityMunicipality ProvinceState Country PO Box is not acceptable_2', record.corporate_address, { ...uppercaseOpts, fontSize: SMALL_PDF_FONT_SIZE });
    setPdfTextField(form, 'undefined_37', record.corporate_address_line2, { ...uppercaseOpts, fontSize: SMALL_PDF_FONT_SIZE });
  }

  // ─── Section C: Tax Compliance / FATCA (Page 3) ─────────────────────────────

  const complianceType = record.compliance_type || 'none';
  setPdfCheckBox(form, 'Yes I am a citizennational and a legal resident of', complianceType === 'resident');
  setPdfTextField(form, 'specify country', record.compliance_resident_country, uppercaseOpts);

  setPdfCheckBox(form, 'Yes I am a citizennational of', complianceType === 'citizen');
  setPdfTextField(form, 'undefined_38', record.compliance_citizen_country, uppercaseOpts);
  setPdfTextField(form, 'specify country but I legally reside in', record.compliance_legally_reside_country, uppercaseOpts);

  setPdfCheckBox(form, 'None', complianceType === 'none' || !complianceType);

  // ─── Section D: Signatures & Dates (Page 3 & Page 4) ────────────────────────

  const signingDate = record.date_of_signing || new Date().toISOString().split('T')[0];
  const sDate = formatDateAcro(signingDate);

  // Page 3 Signing Date boxes
  if (sDate && sDate !== 'N/A' && sDate.length === 9) {
    setPdfCharBoxes(form, ['Day_3', 'undefined_39'], sDate.substring(0, 2));
    setPdfCharBoxes(form, ['Month_3', 'undefined_40', 'undefined_41'], sDate.substring(2, 5));
    setPdfCharBoxes(form, ['undefined_42', 'undefined_421', 'undefined_422', 'undefined_423'], sDate.substring(5, 9));
  }

  setPdfTextField(form, 'fill_16_2', record.place_of_signing || '', uppercaseOpts);

  const ownerPrintedName = record.policy_owner_printed_name || record.planholder_printed_name || `${firstName} ${lastName}`.trim();
  setPdfTextField(form, '29 Printed Name', ownerPrintedName, uppercaseOpts);
  setPdfTextField(form, '35 Printed Name', ownerPrintedName, uppercaseOpts);

  if (record.authorized_signatory1_title) {
    setPdfTextField(form, '31 Printed Name and Job Title', record.authorized_signatory1_title, uppercaseOpts);
  }
  if (record.authorized_signatory2_title) {
    setPdfTextField(form, '33 Printed Name and Job Title', record.authorized_signatory2_title, uppercaseOpts);
  }

  // Page 4: Irrevocable Beneficiary 1
  if (record.irrevocable_ben1_name || record.irrevocable_beneficiary1_name) {
    const ben1Name = record.irrevocable_ben1_name || record.irrevocable_beneficiary1_name;
    setPdfTextField(form, '39 Printed Name', ben1Name, uppercaseOpts);
    setPdfTextField(form, '41 Printed Name', record.irrevocable_ben1_witness_name || record.witness_name, uppercaseOpts);

    if (sDate && sDate !== 'N/A' && sDate.length === 9) {
      setPdfCharBoxes(form, ['Month_41', 'Month_42'], sDate.substring(0, 2));
      setPdfCharBoxes(form, ['Month_4', 'undefined_43', 'undefined_44'], sDate.substring(2, 5));
      setPdfCharBoxes(form, ['undefined_45', 'undefined_46', 'Year_4', 'undefined_47'], sDate.substring(5, 9));
    }
  }

  // Page 4: Irrevocable Beneficiary 2
  if (record.irrevocable_ben2_name || record.irrevocable_beneficiary2_name) {
    const ben2Name = record.irrevocable_ben2_name || record.irrevocable_beneficiary2_name;
    setPdfTextField(form, '47 Printed Name', ben2Name, uppercaseOpts);

    if (sDate && sDate !== 'N/A' && sDate.length === 9) {
      setPdfCharBoxes(form, ['Month_43', 'Month_44'], sDate.substring(0, 2));
      setPdfCharBoxes(form, ['undefined_48', 'undefined_49', 'Month_5'], sDate.substring(2, 5));
      setPdfCharBoxes(form, ['undefined_50', 'undefined_51', 'Year_5', 'undefined_52'], sDate.substring(5, 9));
    }
  }

  // Page 4: Assignee / Lender
  if (record.assignee_name || record.lender_institution) {
    setPdfTextField(form, '51 Printed Name', record.assignee_name, uppercaseOpts);
    setPdfTextField(form, '53 Printed Name and Job Title', record.assignee_signatory1_title, uppercaseOpts);
    setPdfTextField(form, '55 Printed Name and Job Title', record.assignee_signatory2_title, uppercaseOpts);

    if (sDate && sDate !== 'N/A' && sDate.length === 9) {
      setPdfCharBoxes(form, ['Day_6', 'undefined_53'], sDate.substring(0, 2));
      setPdfCharBoxes(form, ['undefined_54', 'undefined_55', 'Month_6'], sDate.substring(2, 5));
      setPdfCharBoxes(form, ['undefined_56', 'undefined_57', 'Year_6', 'undefined_58'], sDate.substring(5, 9));
    }
  }

  // Page 4: Marketing / Offers Consent
  const receiveOffers = record.receive_offers ?? record.wants_communication ?? true;
  setPdfCheckBox(form, 'Yes', receiveOffers === true);
  setPdfCheckBox(form, 'toggle_5', receiveOffers === false);

  // Page 4: Advisor Remarks
  if (record.advisor_remarks || record.remarks) {
    setPdfTextField(form, 'undefined_59', record.advisor_remarks || record.remarks, uppercaseOpts);
  }

  // ─── Digital Signature Canvas Image Stamping ────────────────────────────────
  // Page 3: Policy Owner Signature
  const ownerSig = record.policy_owner_signature || record.planholder_signature;
  if (ownerSig) {
    await embedPdfSignature(pdfDoc, 3, ownerSig, 33, 78, 280, 40);
  }

  // Page 4: Irrevocable Beneficiary 1 Signature & Witness
  const ben1Sig = record.irrevocable_ben1_signature || record.irrevocable_beneficiary1_signature;
  if (ben1Sig) {
    await embedPdfSignature(pdfDoc, 4, ben1Sig, 32, 690, 280, 35);
  }
  const ben1WitnessSig = record.irrevocable_ben1_witness_signature || record.witness_signature;
  if (ben1WitnessSig) {
    await embedPdfSignature(pdfDoc, 4, ben1WitnessSig, 32, 624, 280, 35);
  }

  // Page 4: Irrevocable Beneficiary 2 Signature
  const ben2Sig = record.irrevocable_ben2_signature || record.irrevocable_beneficiary2_signature;
  if (ben2Sig) {
    await embedPdfSignature(pdfDoc, 4, ben2Sig, 33, 556, 280, 35);
  }

  // Page 4: Assignee / Lender Signature
  const assigneeSig = record.assignee_signature || record.lender_signature;
  if (assigneeSig) {
    await embedPdfSignature(pdfDoc, 4, assigneeSig, 32, 386, 280, 35);
  }

  finalizePdfForm(form, font);

  return pdfDoc.save();
}

