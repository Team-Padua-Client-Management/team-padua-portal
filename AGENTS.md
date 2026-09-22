<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Team Padua Portal — System Rules & Architecture Conventions

## 1. Domain & Purpose
This codebase is the **Team Padua Portal**, an enterprise Financial Advisory Operations & Client Servicing CRM system. It handles:
- **CPST (CRM):** Master client registry, birthdays, leads, serviced client records.
- **Client Servicing Requests:** ACR (Advisor Change), BCR (Beneficiary Change), FST (Fund Switching), FWR (Fund Withdrawal), ACA (Auto Change Arrangement), ADA (Advisor Designation), SRO/PDI (Reinstatements), CPC (Policy Cards), PPU/PPTM (Premium Payments), and CSMV (Monitoring View).
- **Operations & Team Productivity:** Daily attendance logging, collaborative tasks, personal to-do list, and organizational calendar.
- **Document & PDF Engine:** AcroForm template filling with `pdf-lib` and digital signature stamping.

## 2. Technology & Architecture Standards
- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.
- **Styling:** Tailwind CSS v4, Radix UI, Framer Motion, Lucide Icons, HugeIcons.
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) on all tables.
  - Browser: `@src/lib/supabase/client` (`createClient()`).
  - Server (Components / Server Actions): `@src/lib/supabase/server` (`createClient()`).
  - Admin / Service Role: `@src/lib/supabase/admin` (`createAdminClient()`).
- **Authorization & RBAC:**
  - `Admin` has unrestricted access across all routes and bypasses maintenance mode.
  - `Advisor` has automatic full access to all Client Servicing modules (`/admin/acr`, `/admin/cpst`, etc.).
  - `Member` and `Bizdev` users only have access to modules explicitly granted in `profiles.client_servicing_permissions`.
- **Maintenance Mode:** Dynamically configured per module via `maintenance_settings` table.
- **PDF Generation & Form Synchronization Rules:**
  - All text inputs mapped to uppercase (`.toUpperCase()`).
  - Blank vector template overlay (`/public/forms/`) embedding with `pdf-lib`.
  - Date fields mapped to individual character boxes (2 Day, 3 Month, 4 Year) centered using `drawDateInBoxes`.
  - Signature pads (`react-signature-canvas` & file uploads) scaled to fit and centered inside bounding boxes.
  - Form UI inputs must cover all template fields and prioritize manual user edits over raw DB records.

## 3. Data Ingestion, Sanitization & Smart Upsert Conventions
- **Formula Injection Sanitization:** Strip/escape dangerous spreadsheet formula characters (`=`, `+`, `-`, `@`, `|`, `%`) with `sanitizeCsvField()` during all file imports.
- **Multi-Section Workbook Support:** Dynamically detect advisor section banners (e.g. `[ADVISOR] | CLIENTS & BENEFICIARIES`) and map advisor aliases (`Sir Pads`, `Kuya Wynn`, `Ate Rizza`, `Ate Mhalou`).
- **Smart Upsert Diff Engine:**
  - **🟢 New:** Insert new unique client records.
  - **🟡 Update:** Update existing records in-place when birthdates or relationships change (no duplicate rows created).
  - **⚪ Unchanged:** Skip identical rows with 0 unnecessary database writes.
- **Multi-Advisor Preservation:** If a client or beneficiary belongs to multiple advisors, retain their records under both advisors and synchronize birthdates (`YYYY-MM-DD`).

## 4. Skill & Reference Location
- Main Skill: `.agents/skills/team-padua-portal/SKILL.md`
- Database Schema: `.agents/skills/team-padua-portal/references/database_schema.md`
- Client Servicing Modules: `.agents/skills/team-padua-portal/references/client_servicing_modules.md`
