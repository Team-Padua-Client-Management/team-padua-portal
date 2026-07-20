/**
 * fundSwitchingTemplate.ts
 *
 * Coordinate map for the Sun Life "Fund Switching" PDF template:
 *   /public/forms/SLOCPI_Fund Switching.PDF
 *
 * COORDINATE SYSTEM:
 *   - Page size : US Letter  612 × 792 pt
 *   - Origin    : (0, 0) = BOTTOM-LEFT corner
 *   - Increasing Y moves text UP
 *   - Increasing X moves text RIGHT
 *
 * HOW TO FINE-TUNE:
 *   Every entry below has a // COORD comment — search for "COORD" to jump
 *   to any field quickly.  Change x/y here, save, and the next PDF export
 *   picks up the new position immediately.
 *
 * PAGE NUMBERING:
 *   page: 1 → first embedded page (index 0)
 *   page: 2 → second embedded page (index 1)
 *   page: 3 → third embedded page (index 2)  ← if the PDF has 3 pages
 */

export interface FieldCoord {
  page: number;
  x: number;
  y: number;
}

export interface CheckCoord {
  page: number;
  x: number;
  y: number;
  size?: number;
}

// ─── Section 1 — General Information ─────────────────────────────────────────

export const S1 = {
  policyOwnerLast:    { page: 1, x: 45,  y: 680 } as FieldCoord, // COORD S1 Policy Owner Last Name
  policyOwnerFirst:   { page: 1, x: 200, y: 680 } as FieldCoord, // COORD S1 Policy Owner First Name
  policyOwnerMiddle:  { page: 1, x: 355, y: 680 } as FieldCoord, // COORD S1 Policy Owner Middle Name

  policyNumber:       { page: 1, x: 45,  y: 652 } as FieldCoord, // COORD S1 Policy Number
  lifeInsured:        { page: 1, x: 300, y: 652 } as FieldCoord, // COORD S1 Life Insured

  citizenship:        { page: 1, x: 45,  y: 624 } as FieldCoord, // COORD S1 Citizenship
  emailAddress:       { page: 1, x: 300, y: 624 } as FieldCoord, // COORD S1 Email Address

  mobilePhone:        { page: 1, x: 45,  y: 597 } as FieldCoord, // COORD S1 Mobile Phone
  homePhone:          { page: 1, x: 200, y: 597 } as FieldCoord, // COORD S1 Home Phone
  workPhone:          { page: 1, x: 355, y: 597 } as FieldCoord, // COORD S1 Work Phone

  presentAddress:     { page: 1, x: 45,  y: 570 } as FieldCoord, // COORD S1 Present Address
  permanentAddress:   { page: 1, x: 45,  y: 543 } as FieldCoord, // COORD S1 Permanent Address
  workAddress:        { page: 1, x: 45,  y: 516 } as FieldCoord, // COORD S1 Work Address

  countryOfLegalRes:  { page: 1, x: 45,  y: 489 } as FieldCoord, // COORD S1 Country of Legal Residence
};

// ─── Section 2 — Fund Switching Rows ─────────────────────────────────────────
// The form has a fixed table with pre-printed rows; we write into each row.
// Row 1 starts at rowStartY; each subsequent row is rowHeight pt lower.

export const S2 = {
  tableStartPage: 1,
  rowStartY: 440,    // COORD S2 first fund switch row Y baseline
  rowHeight: 22,     // COORD S2 vertical gap between rows (pt)

  colFromFund:  45,  // COORD S2 "Switch From" column X
  colToFund:    215, // COORD S2 "Switch To" column X
  colFullCheck: 387, // COORD S2 "Full" checkbox X
  colPartCheck: 418, // COORD S2 "Partial" checkbox X
  colAmount:    449, // COORD S2 Amount column X
  colPercent:   530, // COORD S2 Percentage column X
};

// ─── Section 3 — Future Fund Allocation ──────────────────────────────────────

export const S3 = {
  // Peso funds — start on page that contains the allocation table
  pesoTablePage: 1,
  pesoRowStartY: 308,  // COORD S3 first Peso allocation row Y
  pesoRowHeight: 18,   // COORD S3 Peso row gap
  colPesoFundName:  45,  // COORD S3 Peso fund name X
  colPesoPercent:   480, // COORD S3 Peso percentage X

  // Dollar funds — below Peso table (same page or next page)
  dollarTablePage: 1,
  dollarRowStartY: 218, // COORD S3 first Dollar allocation row Y
  dollarRowHeight: 18,  // COORD S3 Dollar row gap
  colDollarFundName:  45,  // COORD S3 Dollar fund name X
  colDollarPercent:   480, // COORD S3 Dollar percentage X
};

// ─── Section 4 — Excess Premium Changes ──────────────────────────────────────

export const S4 = {
  // Option checkboxes
  checkAddPremium:    { page: 1, x: 51, y: 148, size: 9 } as CheckCoord, // COORD S4 Add To Regular Premium
  checkChangePremium: { page: 1, x: 51, y: 133, size: 9 } as CheckCoord, // COORD S4 Change Existing Excess Premium
  checkCancelPremium: { page: 1, x: 51, y: 118, size: 9 } as CheckCoord, // COORD S4 Cancel Excess Premium

  // Currency
  checkPHP: { page: 1, x: 200, y: 133, size: 9 } as CheckCoord, // COORD S4 PHP currency
  checkUSD: { page: 1, x: 240, y: 133, size: 9 } as CheckCoord, // COORD S4 USD currency

  // Amount text
  amount: { page: 1, x: 310, y: 133 } as FieldCoord, // COORD S4 Excess premium amount
};

// ─── Section 5 — Acknowledgement & Signatures ────────────────────────────────

export const S5 = {
  placeOfSigning: { page: 2, x: 45,  y: 500 } as FieldCoord, // COORD S5 Place of Signing

  // Date of Signing (split by day / month / year)
  sigDay:   { page: 2, x: 390, y: 500 } as FieldCoord, // COORD S5 Signing Day
  sigMonth: { page: 2, x: 430, y: 500 } as FieldCoord, // COORD S5 Signing Month
  sigYear:  { page: 2, x: 480, y: 500 } as FieldCoord, // COORD S5 Signing Year

  // Policy Owner Signature image area (bottom-left x, bottom-left y, width, height)
  ownerSigArea:  { page: 2, areaX: 45,  areaY: 430, areaW: 200, areaH: 45 }, // COORD S5 owner sig area
  // Witness Signature image area
  witnessSigArea: { page: 2, areaX: 300, areaY: 430, areaW: 200, areaH: 45 }, // COORD S5 witness sig area

  witnessName:    { page: 2, x: 300, y: 420 } as FieldCoord, // COORD S5 Witness Name
  witnessAddress: { page: 2, x: 300, y: 405 } as FieldCoord, // COORD S5 Witness Address

  // Assignee Signature image area
  assigneeSigArea: { page: 2, areaX: 45,  areaY: 340, areaW: 200, areaH: 45 }, // COORD S5 assignee sig area
  // Beneficiary Signature image area
  beneficiarySigArea: { page: 2, areaX: 300, areaY: 340, areaW: 200, areaH: 45 }, // COORD S5 beneficiary sig area
};
