# Team Padua Portal — Client Servicing Modules & Document Automation

## 1. Client Servicing Core Modules Overview

The portal supports 5 primary Client Servicing Request (CSR) document automation modules:

| Acronym / Code | Full Name | Route | PDF Template Source | Generation Strategy | Key Purpose |
|---|---|---|---|---|---|
| **ACR** | Advisor Change Request | `/admin/acr` | `/public/forms/SLOCPI_Advisor_Change_Request.pdf` | Vector Template Overlay (`embedPdf`) | Reassign servicing advisor with reason, new advisor code, client signature. |
| **ACIC / ACICR** | Address & Contact Info Change Request | `/admin/acicr` | `/public/forms/ACICR.pdf` | AcroForm (`pdfDoc.getForm()`) + Signatures | Direct updates to residential/work address, contacts, and tax info. |
| **BCR** | Beneficiary Change Request | `/admin/bcr` | `/public/forms/SLOCPI-beneficiary-change-request.pdf` | AcroForm (177 fields across 4 pages) | Add, remove, update revocable/irrevocable beneficiaries, corporate owners. |
| **FSR / FST** | Fund Switching Request | `/admin/fst` | `/public/forms/SLOCPI_Fund Switching.PDF` | Vector Template Overlay (`embedPdf`) | VUL investment reallocations, future allocations, excess premium changes. |
| **FWR** | Fund Withdrawal Request | `/admin/fwr` | `/public/forms/VRFW.07.24.pdf` | AcroForm (`pdfDoc.getForm()`) + Signatures | Full/partial cash surrenders, dividends, payout method, bank details. |

---

## 2. Core Engineering Standards & PDF Rules

1. **Upper-case Normalization Standard:**
   - All text inputs (except email addresses where case-sensitive or standard formatted) must be converted to uppercase (`.toUpperCase()`) before rendering on the PDF.
   - Form inputs should have `uppercase` CSS class and transform values during typing.

2. **Form-to-PDF State Priority:**
   - Web UI form inputs always take precedence over raw database lookup values from `cpst_clients`.
   - If a user manually overrides First Name, Last Name, Middle Initial, Phone, or Address in the form view, the generator MUST use the manual form state.

3. **Unified Signature Pad (`SignaturePad.tsx`):**
   - All forms must use `@src/components/ui/SignaturePad.tsx`.
   - Prop signature:
     ```tsx
     <SignaturePad
       title="Signature of Policy Owner"
       initialSignature={formData.signature_base64}
       onSignatureChange={(sig: string | null) => handleChange('signature_base64', sig)}
     />
     ```
   - Supports both touch/mouse drawing (`react-signature-canvas`) and high-resolution image upload / drag-and-drop.
   - Stamped onto PDFs via `embedPdfSignature` / `embedSignature` using `image.scaleToFit(areaW, areaH)` centered inside the target coordinate bounds.

4. **Segmented Character Box Date Centering:**
   - Standard Sun Life date fields are formatted with individual boxes (e.g. 2 Day, 3 Month, 4 Year).
   - In Vector Overlays, characters are centered using:
     ```ts
     const x = box.x + (box.w - charWidth) / 2;
     const y = box.y + (box.h - size * 0.75) / 2;
     ```
   - In AcroForms, `setPdfCharBoxes(form, namesArray, valueString, fontSize)` distributes characters into individual AcroForm text box elements.

---

## 3. Module Specifications & Field Layouts

### A. Advisor Change Request (ACR)
- **Template:** `/public/forms/SLOCPI_Advisor_Change_Request.pdf` (1 Page, Vector Overlay)
- **Generator:** `src/features/client-servicing/pdf/generateAdvisorChangeRequestPdf.ts`
- **Form UI:** `src/features/client-servicing/acr-engine/AcrStandardForm.tsx`
- **Key Coordinates & Sections:**
  - **Section A (Policy Owner Info):**
    - Policy Owner Last Name: `x: 36, y: 646`, First Name: `x: 200, y: 646`, Middle Initial: `x: 480, y: 646`
    - Policy Numbers (up to 4 lines): `x: 40, y: 618`
  - **Section B (Reason for Change):** Checkboxes for Relocation, Non-servicing, Advisor Resigned, Personal Choice, Others.
  - **Section D (New Advisor Details):**
    - New Advisor Name: `x: 40, y: 310`
    - Advisor Code (8 boxed characters): `x: 395 to 495, y: 310`
    - Unit Manager / Agency Name: `x: 40, y: 282`
  - **Section E.2 (Policy Owner Signature & Date):**
    - Signature stamp box: `x: 36, y: 155, w: 260, h: 42`
    - Date boxes (DD-MMM-YYYY): `x: 335 to 535, y: 165`

---

### B. Address & Contact Info Change Request (ACIC / ACICR)
- **Template:** `/public/forms/ACICR.pdf` (2 Pages, 106 AcroForm fields)
- **Generator:** `src/features/client-servicing/pdf/generateAcicrPdfFromTemplate.ts`
- **Form UI:** `src/features/client-servicing/acicr-engine/AcicrStandardForm.tsx`
- **Key Sections:**
  - **Section A (General Info):** Policy Number (`1 PolicyPlan Number`), Client Type (`Individual`, `Corporate`), Policy Owner Names (`undefined`, `undefined_2`, `undefined_3`), TIN (`2 Tax Identification Number TIN`), SSS/GSIS (`3 SSSGSIS Number`).
  - **Section B (Address & Contacts):** Residence Address (`No Street VillageBarangay`, `MunicipalityCity`, `ProvinceState`, `Zip Code`, `Country`), Work Address, Mobile Number (`7 Mobile Phone`), Home Phone, Email (`9 Email Address`).
  - **Section C (FATCA & Tax Residency):** US Citizenship/Permanent Resident radio buttons, TIN declaration, Tax Residency country inputs.
  - **Section D (Signatures):**
    - 18. Policy Owner Signature canvas stamp (`x: 32, y: 232, w: 250, h: 40` on Page 2)
    - 19. Policy Owner Printed Name (`fill_14`)
    - 20. Authorized Signatory #1 Signature (`x: 32, y: 168, w: 250, h: 40`) & Printed Name (`fill_16`)
    - 22. Authorized Signatory #2 Signature (`x: 32, y: 104, w: 250, h: 40`) & Printed Name (`fill_18`)
    - 24. Witness Signature (`x: 320, y: 232, w: 250, h: 40`) & Printed Name (`fill_20`)
    - 26. Place of Signing (`fill_21`) & 27. Date of Signing character boxes (`Day`, `Month`, `Year` series).

---

### C. Beneficiary Change Request (BCR)
- **Template:** `/public/forms/SLOCPI-beneficiary-change-request.pdf` (4 Pages, 177 AcroForm fields)
- **Generator:** `src/features/client-servicing/pdf/generateBeneficiaryChangeRequestPdfFromTemplate.ts`
- **Form UI:** `src/features/client-servicing/bcr-engine/BcrStandardForm.tsx`
- **Key Sections:**
  - **Page 1:**
    - Policy Numbers: `undefined`
    - Policy Owner: `undefined_2` (Last Name), `MI` (First Name), `undefined_3` (Middle Initial)
    - Corporate Owner: `For CompanyBusiness Policy Owner` (Company Name), `undefined_4` (Designation)
    - Change Type: `Add Beneficiaryies`, `Remove Beneficiaryies`, `Change of Beneficiary Information`
    - Beneficiary #1: Name (`2 Name Last...`), Sex (`undefined_5`/`undefined_6`), 9-box Birthdate (`undefined_7` series), Country of Birth (`5 Country of Birth...`), Citizenships (`6 Citizenships...`), Relationship (`Father`, `Mother`, `Employer`, `undefined_10`, `Others specify`), Revocability (`Revocable`, `Irrevocable`), Designation (`Primary`, `Contingent`), Share % & Phone (`undefined_8`), Address (`undefined_9`).
  - **Page 2:**
    - Beneficiary #2: Name (`12 Name...`), Sex (`Revocable_21`/`Irrevocable_21`), 9-box Birthdate (`14 Birthdate...`), Country & Citizenships (`15 Country...`, `fill_28`), Relationship (`Father_2` series), Share & Phone (`19 Designation...`, `20 Home Phone...`).
    - Beneficiary Removal List: `22 Name...`, `23 Name...`, `fill_38`.
    - Change Beneficiary Info: Field checkboxes & new details.
  - **Page 3:**
    - Corporate Beneficiary: `Company or Business Name`, `undefined_33` (Name), `undefined_34` (Relationship), `undefined_35` (Country), `undefined_36` (Phone), Address (`No Street..._2`, `undefined_37`).
    - FATCA Declarations: `Yes I am a citizennational...`, `None`, country inputs.
    - Policy Owner Signature: Bounding box `(x: 33, y: 78, w: 280, h: 40)` on Page 3, Printed Name `35 Printed Name`, Date boxes (`Day_3`, `Month_3` series), Signing Place `fill_16_2`.
  - **Page 4:**
    - Irrevocable Beneficiary 1 Signature: `(x: 32, y: 690, w: 280, h: 35)`, Printed Name `39 Printed Name`, Witness `41 Printed Name`.
    - Irrevocable Beneficiary 2 Signature: `(x: 33, y: 556, w: 280, h: 35)`, Printed Name `47 Printed Name`.
    - Assignee / Lender Signature: `(x: 32, y: 386, w: 280, h: 35)`, Printed Names `51 Printed Name`, `53 Printed Name`.
    - Marketing Consent: `Yes`, `toggle_5` (No).

---

### D. Fund Switching Request (FSR / FST)
- **Template:** `/public/forms/SLOCPI_Fund Switching.PDF` (2 Pages, Vector Overlay)
- **Generator:** `src/features/client-servicing/pdf/generateFundSwitchingPdf.ts`
- **Form UI:** `src/features/client-servicing/fund-switching-engine/FundSwitchingStandardForm.tsx`
- **Key Sections:**
  - **Section 1 (General Information):** Owner Last/First/Middle, Policy Number, Life Insured, Addresses, Contacts.
  - **Section 2 (Fund Switching Table Rows):** 4 predefined rows (Source Fund, Target Fund, Amount/Units/Percentage) rendered at `y: 430, 410, 390, 370`.
  - **Section 3 (Future Fund Allocation):** Peso & Dollar future portfolio breakdown tables rendered dynamically.
  - **Section 4 (Excess Premium Changes):** Add, Change, Cancel checkmarks, Currency (PHP/USD), Amount.
  - **Section 5 (Signatures & Dates - Page 2):**
    - Place of Signing: `x: 180, y: 505`
    - Date of Signing (Day `x: 350`, Month `x: 390`, Year `x: 440` at `y: 505`)
    - Owner Signature (`x: 45, y: 440, w: 200, h: 40`)
    - Witness Signature (`x: 45, y: 375, w: 200, h: 40`)
    - Assignee Signature (`x: 45, y: 310, w: 200, h: 40`)
    - Beneficiary Signature (`x: 45, y: 245, w: 200, h: 40`)

---

### E. Fund Withdrawal Request (FWR)
- **Template:** `/public/forms/VRFW.07.24.pdf` (3 Pages, 74 AcroForm fields)
- **Generator:** `src/features/client-servicing/pdf/generateFundWithdrawalPdfFromTemplate.ts`
- **Form UI:** `src/features/client-servicing/fund-withdrawal-engine/FundWithdrawalStandardForm.tsx`
- **Key Sections:**
  - **Page 1 (General Info & Withdrawal Type):** Policy Number `1`, Owner Name `2`, Withdrawal Type checkboxes (`Full Surrender`, `Partial Withdrawal`, `Dividend Settlement`, `Excess Premium`), Amount fields.
  - **Page 2 (Declarations & Signatures):**
    - Table 1: Owner Signature overlay `(x: 20, y: 577, w: 380, h: 45)`, Witness Signature `(x: 20, y: 523, w: 380, h: 45)`, Printed Name `26`, Signing Place `25_1`, Date `28_1`.
    - Table 2: Assignee (`34`, `27`), Beneficiaries 1 & 2 (`35`, `37`, `29`, `30`), Witness 2 (`36`, `31`).
  - **Page 3 (Payout Method & Banking Details):**
    - Payout Checkboxes: Check `40`, Demand Draft `41`, Telegraphic Transfer / Direct Credit `42`.
    - Encashment Branch `43` (For Check / Demand Draft).
    - Bank Details: Bank Account Name `55`, Bank Account Number `56`, Bank Name `57`, Bank Branch / Address `58`, Routing No. `59`, SWIFT Code `60`.
    - Proof of Account Checkboxes: Statement `50`, Passbook `51`, Deposit Cert `52`, Check `53`, ATM Card `54`.
