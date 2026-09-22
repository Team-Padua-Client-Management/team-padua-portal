---
name: team-padua-portal
description: >-
  Expert guide, architecture reference, database schema, and operational workflows for Team Padua Portal — Financial Advisory Operations & Client Servicing System. Use whenever developing, debugging, querying, modifying, or creating features in this codebase.
---

# Team Padua Portal — Engineering & System Guide

## System Purpose & Domain
Team Padua Portal is an enterprise-grade web application built to streamline financial advisor operations, client prospecting & servicing workflows (CPST), insurance change requests (ACR, BCR, FST, FWR, ACA, ADA, SRO, PDI, ACICR), automated PDF AcroForm document generation, daily attendance tracking, internal communications, and role-gated administration for insurance and financial advisory teams.

---

## Core Technology Stack
- **Framework:** Next.js 16 (App Router, Server Components & Server Actions)
- **UI & Design:** Tailwind CSS v4, Radix UI, Framer Motion, Lucide Icons, HugeIcons
- **Database & Auth:** Supabase (PostgreSQL 15+, Supabase SSR Auth, Row-Level Security, Realtime Channels, Custom RPCs)
- **Document & PDF Generation:** `pdf-lib` (AcroForm template filling, digital signature embedding), `jspdf`, `jspdf-autotable`, `xlsx`, `xlsx-populate`, `mammoth`
- **AI & Integrations:** Resend (Transactional Emails), Google Generative AI, OpenAI, Tesseract.js (OCR)

---

## Key Workflows & Procedures

### 1. Database & Supabase Conventions
- **Client Helpers:**
  - Browser: Use `@src/lib/supabase/client` (`createClient()`).
  - Server (Server Components/Actions/Route Handlers): Use `@src/lib/supabase/server` (`createClient()`).
  - Administrative / Background Scripts: Use `@src/lib/supabase/admin` with `SUPABASE_SERVICE_ROLE_KEY`.
- **Row Level Security (RLS):** Always ensure tables have RLS enabled. If adding new child tables or servicing modules, add corresponding RLS policies for `authenticated` and `service_role`.
- **Database Schemas & Migrations:** SQL files reside in `supabase/schema/` and `supabase/supabase_schema.sql`.

### 2. Client Servicing & Request Engine (CSR)
The system supports multiple life insurance servicing request workflows:
- **ACR:** Advisor Change Request (`acr_requests`, `acr_progress`, `acr_processors`, `acr_files`)
- **BCR / CPC:** Beneficiary Change Request (`beneficiary_change_requests`) & Client Policy Card (`client_policy_cards`)
- **FST:** Fund Switching Request (`fund_switching_requests`)
- **FWR / MNGT:** Fund Withdrawal Request (`fund_withdrawal_requests`)
- **ACA / ACICR:** Auto Change Arrangement & Address / Contact Info Change (`auto_change_arrangements`)
- **ADA / ADAT:** Advisor Designation Request (`ada_requests`)
- **SRO / PDI:** Policy Reinstatements & Premium Due Investigations (`reinstatement_sro_requests`, `reinstatement_pdi_requests`)
- **CSMV:** Client Servicing Monitoring View aggregating metrics across all modules.

### 3. Role-Based Access Control (RBAC) & Middleware
- **Roles:** `Admin`, `Advisor`, `Member`, `Bizdev`.
- **Automatic Access:** `Admin` and `Advisor` have automatic full access to all Client Servicing modules (`/admin/acr`, `/admin/cpst`, etc.).
- **Granular Permissions:** `Member` and `Bizdev` users require explicit boolean flags (`view`, `create`, `edit`, `delete`, `export`) within `profiles.client_servicing_permissions`.
- **Maintenance Mode:** Controlled dynamically in `maintenance_settings`. Admins bypass maintenance mode; non-admins are redirected to `/maintenance` or `/maintenance/[module]`.

### 4. PDF Generation & Digital Signature Engine (`pdf-lib`)
- **Template Embedding Pattern:**
  - Official Sun Life PDF templates reside in `/public/forms/` (e.g. `SLOCPI_Advisor_Change_Request.pdf`).
  - Read native template dimensions (US Letter: `612 × 792 pt`).
  - Create a new `PDFDocument`, embed template pages with `pdfDoc.embedPdf()`, draw each page as background with `pg.drawPage(embedded, ...)`, and overlay dynamic data on top.
- **Form-to-PDF Synchronization Priority:**
  - Client details prioritize form-edited values (`client_last_name`, `client_first_name`, `client_middle_name`, `client_dob`), falling back to DB `cpst_clients` records.
- **Text & Casing Standards:**
  - Enforce `.toUpperCase()` across all string entries via `txt()` and `wrappedTxt()` helper functions.
  - Multi-line textareas use `wrappedTxt()` with `maxWidth` word-wrap calculation.
- **Date Box Character Centering:**
  - Sun Life forms use segmented character boxes: 2 Day boxes, 3 Month boxes, 4 Year boxes.
  - Never draw dates across text sub-headers.
  - Use `drawDateInBoxes(page, dateObj, config, font, size)`:
    - Centers each character horizontally: `x = box.x + (box.w - charWidth) / 2`
    - Centers vertically: `y = box.y + (box.h - size * 0.75) / 2`
    - Dates parsed into Day (`DD`), Month (`3-letter abbreviation` like `JAN`, `SEP`), and Year (`YYYY`).
- **Signature Canvas Embedding:**
  - Captured via `SignaturePad` (`react-signature-canvas`) or image drag-and-drop file upload.
  - Embedded using `embedSignature` with `image.scaleToFit(areaW, areaH)` centered inside the target coordinate bounds.

### 5. Data Ingestion, Sanitization & Smart Upsert Engine
- **CSV / Formula Injection Sanitization:**
  - All parsed spreadsheet cells are processed with `sanitizeCsvField()`.
  - Leading formula triggers (`=`, `+`, `-`, `@`, `|`, `%`) are escaped with a leading apostrophe (`'`) to prevent formula execution during spreadsheet export/import.
- **Multi-Section Workbook Awareness:**
  - Ingestion recognizes advisor banner rows (e.g. `[ADVISOR NAME] | CLIENTS & BENEFICIARIES`) and switches the active `advisor_id` dynamically.
  - Resolves advisor aliases (`Sir Pads` $\rightarrow$ Daniel Padua, `Kuya Wynn` $\rightarrow$ Triwynn Branzuela, `Ate Rizza` $\rightarrow$ Rizza, `Ate Mhalou` $\rightarrow$ Marilou Lacsamana).
- **Clean Parenthetical Extraction:**
  - Separates names and relationships: `Kidlat Zion De Jesus Amores (Anthony Ibañez Amores' Son)` $\rightarrow$ Name: `Kidlat Zion De Jesus Amores`, Relationship: `Son`, Beneficiary: `Anthony Ibañez Amores`.
- **Smart 3-Bucket Diff & Upsert Engine (Zero-Duplicate Updates):**
  - **🟢 New:** Client not found in DB under advisor $\rightarrow$ `INSERT`.
  - **🟡 Update:** Client exists under advisor, but birthdate or details changed $\rightarrow$ `UPDATE in-place` (e.g. correcting a birthdate typo from 2012 to 2014).
  - **⚪ Unchanged:** Exact match in DB $\rightarrow$ Skipped (zero unnecessary writes).
  - Pre-import preview displays diff statistics and old $\rightarrow$ new value comparisons before user confirmation.

---

## Detailed References
For in-depth schema definitions and module breakdowns, refer to:
- [Database Schema Reference](./references/database_schema.md)
- [Client Servicing Modules Reference](./references/client_servicing_modules.md)
