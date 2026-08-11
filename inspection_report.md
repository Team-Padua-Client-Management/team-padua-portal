# SYSTEM INSPECTION REPORT
### Team Padua Portal — Phase 1
**Inspection Date:** 2026-08-11
**Inspector:** Senior Software Architect / Systems Documentation Specialist
**Repository:** `c:\Users\William Kyle\Development\react\team-padua-portal`
**Branch inspected:** `main` (HEAD: `21fa958`)

---

> [!IMPORTANT]
> This is the **Phase 1 Inspection Report only**. No SRS, Technical Documentation, User Manual, or any other Phase 3 documents have been generated. The team must review, correct, and approve this report before Phase 3 proceeds.

---

## 1. Executive Summary

The **Team Padua Portal** is a comprehensive internal operations and client-servicing web application built for a financial advisory organization — identified in the codebase as **Sun Life of Canada (Philippines), Inc.** — operating under the team name **"Team Padua."** The system centralizes team productivity, client request tracking, document generation, and communications into a single unified platform accessible to multiple user roles.

The system is a **full-stack web application** built on **Next.js 16 (App Router)** with **Supabase** as its backend-as-a-service. It is in active development and production-ready for core workflows, though some modules are partially implemented or not yet fully verified.

---

## 2. Current System Purpose

The portal solves the following operational problems:

1. **Fragmented client servicing workflows** — Replaces manual tracking of insurance policy change requests (ACR, BCR, FST, FWR, ACA, ADA, SRO, PDI) with a centralized digital tracker.
2. **Manual PDF document generation** — Automates the filling and downloading of official insurance servicing forms using pdf-lib AcroForm templates.
3. **Team communication gaps** — Provides a centralized announcements, FAQ, and internal messaging hub.
4. **Attendance tracking gaps** — Enables team members to log daily time-in/out records.
5. **Ad-hoc task tracking** — Provides shared client servicing tasks and personal to-do lists.
6. **Visibility for administrators** — Gives admins a consolidated monitoring view (CSMV) across all request types plus maintenance controls.

---

## 3. Technology Stack

### Verified Technologies (with Evidence)

| Technology | Version | Role | Evidence |
|---|---|---|---|
| **Next.js** | 16.2.9 | Full-stack framework (App Router, RSC, Server Actions, API Routes) | `package.json`, `next.config.ts` |
| **React** | 19.2.4 | UI rendering | `package.json` |
| **TypeScript** | ^5.x | Type safety throughout | `tsconfig.json`, all `.ts`/`.tsx` files |
| **Supabase JS** | ^2.108.2 | Database client and Auth client | `src/lib/supabase/` |
| **Supabase SSR** | ^0.12.0 | Server-side session management | `src/lib/middleware.ts`, `app/action/auth.ts` |
| **PostgreSQL** | (Supabase-managed) | Primary data storage | `supabase/supabase_schema.sql` |
| **Tailwind CSS** | ^4.x | Utility-first CSS framework | `package.json`, `postcss.config.mjs` |
| **Radix UI** | ^1.6.0 | Headless UI primitives | `package.json` |
| **shadcn/ui** | ^4.11.0 | Pre-built component library (on top of Radix) | `components.json` |
| **Framer Motion** | ^12.41.0 | Animations and transitions | `app/(user)/dashboard/page.tsx` |
| **Lucide React** | ^1.21.0 | Primary icon set | Multiple pages |
| **HugeIcons** | ^4.2.1 | Extended icon set | `package.json` |
| **pdf-lib** | ^1.17.1 | AcroForm PDF template filling (primary PDF engine) | `src/features/client-servicing/pdf/` |
| **jsPDF + AutoTable** | ^4.2.1 | Programmatic PDF generation (used for FST and scratch generators) | `src/features/client-servicing/pdf/generateFundSwitchingPdf.ts` |
| **pdfjs-dist** | ^6.1.200 | PDF rendering/viewing in browser | `src/features/client-servicing/pdf-engine/PdfCanvas.tsx` |
| **react-signature-canvas** | ^1.1.0 | Digital signature capture | `src/features/client-servicing/pdf-engine/SignatureModal.tsx` |
| **Resend** | ^6.16.0 | Transactional email service | `src/lib/resend.ts`, `app/action/auth.ts` |
| **Google Generative AI** | ^0.24.1 | Listed as dependency (see note on chatbot below) | `package.json` |
| **OpenAI** | ^6.44.0 | Listed as dependency | `package.json` |
| **xlsx / xlsx-populate** | ^0.18.5 / ^1.21.0 | Excel import/export | `package.json` |
| **Mammoth** | ^1.12.0 | DOCX to HTML conversion | `package.json` |
| **React Easy Crop** | ^6.0.2 | Image cropping (profile avatars) | `package.json` |
| **React Markdown** | ^10.1.0 | Markdown rendering | `package.json` |
| **Tesseract.js** | ^7.0.0 | OCR (optical character recognition) | `package.json` |

> [!NOTE]
> **Chatbot note**: The `package.json` lists `@google/generative-ai` and `openai` as dependencies. However, the actual `/api/chatbot/route.ts` handler calls `chatWithOllama()` which connects to a **local Ollama server at `http://localhost:11434`** running `llama3:latest`. This means the chatbot currently requires a **locally running Ollama instance** and is **not connected to Google Generative AI or OpenAI** in the verified code path.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Browser / Client                    │
│  React 19, Tailwind CSS, Framer Motion, pdfjs-dist  │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
┌───────────────────▼─────────────────────────────────┐
│          Next.js 16 App Router (Turbopack)           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  Middleware (src/middleware.ts)              │   │
│  │  - Session validation (Supabase SSR)        │   │
│  │  - RBAC route guards (5 guard rules)        │   │
│  │  - Per-module maintenance checks            │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────┐   ┌──────────────────────────┐   │
│  │  App Routes  │   │  API Routes              │   │
│  │  (admin)     │   │  /api/acr, /api/chatbot  │   │
│  │  (user)      │   │  /api/clients, /api/fst  │   │
│  └──────┬───────┘   └──────────┬───────────────┘   │
│         │  Server Actions       │                   │
│         │  (app/action/auth.ts) │                   │
└─────────┼─────────────────────┼──────────────────┘
          │                     │
┌─────────▼─────────────────────▼──────────────────┐
│                    Supabase                        │
│                                                   │
│  ┌──────────┐  ┌────────┐  ┌────────────────┐    │
│  │  Auth    │  │  RLS   │  │  PostgreSQL DB  │    │
│  │ (Email + │  │Policies│  │  (20+ tables)  │    │
│  │  OAuth)  │  │        │  │                │    │
│  └──────────┘  └────────┘  └────────────────┘    │
│                                                   │
│  ┌──────────────┐  ┌────────────────────────┐    │
│  │  Realtime    │  │  RPC Functions         │    │
│  │  Channels    │  │  (search_admin, etc.)  │    │
│  └──────────────┘  └────────────────────────┘    │
└───────────────────────────────────────────────────┘
          │
┌─────────▼───────────────┐
│  External Services       │
│  - Resend (Email)        │
│  - Ollama (local AI)     │
│  - Google OAuth          │
└──────────────────────────┘
```

**Route Group Architecture:**

```
app/
├── (admin)/admin/          → Admin-only routes (role=Admin or Advisor w/ perms)
│   ├── (ClientServicing)/  → 22 client servicing modules
│   └── [other admin pages] → dashboard, members, settings, calendar, etc.
├── (user)/                 → Standard member routes
│   ├── dashboard/
│   ├── attendance/
│   ├── calendar/
│   ├── messages/
│   └── [etc.]
├── auth/                   → Login, signup, reset password, OAuth callback
├── api/                    → 13 REST API route handlers
├── action/                 → Server Actions (auth.ts)
├── 403/                    → Forbidden page
├── maintenance/            → Per-module maintenance pages
├── privacy/                → Privacy policy (static)
└── terms/                  → Terms of service (static)
```

---

## 5. User Roles

### Identified Roles (from code evidence)

| Role | Source | Description |
|---|---|---|
| **Admin** | `profiles.role`, `src/lib/middleware.ts` | Full access to all admin routes, bypasses all permission checks. Redirected to `/admin/dashboard`. |
| **Advisor** | `src/lib/permissions.ts` | Has **automatic access** to all Client Servicing modules without needing explicit per-module permission grants. Does NOT have access to general admin routes (members, settings, departments, etc.). |
| **Member** | `profiles.role` (default) | Standard team member. Can access user routes only (dashboard, attendance, etc.). Can access specific Client Servicing routes **only if granted explicit permissions** via `client_servicing_permissions` JSONB column. |
| **Bizdev** | Referenced in `middleware.ts` comments | Treated the same as Member for access control purposes — requires explicit CS module permissions. |

> [!NOTE]
> **Pending account status**: Newly registered users are created with `status = 'Pending'`. Login is blocked until an Admin changes the status to `Active`. This is enforced server-side in `app/action/auth.ts` via `checkAccountStatus()`. Suspended and Disabled statuses also block login.

### Permission Matrix (Client Servicing Modules)

| Module | Admin | Advisor | Member/Bizdev (with grant) | Notes |
|---|---|---|---|---|
| CPST | ✓ | ✓ | Conditional | Per-module JSONB grant in `profiles.client_servicing_permissions` |
| ACR | ✓ | ✓ | Conditional | |
| BCR (CPC) | ✓ | ✓ | Conditional | |
| FST | ✓ | ✓ | Conditional | |
| FWR (MNGT) | ✓ | ✓ | Conditional | |
| ACA (PPU) | ✓ | ✓ | Conditional | |
| ADA/ADAT | ✓ | ✓ | Conditional | |
| SRO | ✓ | ✓ | Conditional | |
| PDI | ✓ | ✓ | Conditional | |
| ACICR | ✓ | ✓ | Conditional | |
| CSMV | ✓ | ✓ | Conditional | |
| MNGT | ✓ | ✓ | Conditional | |
| Dashboard (admin) | ✓ | ✗ | ✗ | Admin-only route group |
| Members | ✓ | ✗ | ✗ | Admin-only |
| Settings | ✓ | ✗ | ✗ | Admin-only (exempt from maintenance blocking) |
| Departments | ✓ | ✗ | ✗ | Admin-only |
| User Dashboard | ✗ | ✓ | ✓ | Admins redirected away |
| Attendance | ✗ | ✓ | ✓ | User route |
| Calendar (view) | ✗ | ✓ | ✓ | User route |
| Messages | ✗ | ✓ | ✓ | User route |
| Profile | ✗ | ✓ | ✓ | User route |

> [!NOTE]
> **Granular actions (view/create/edit/delete/export)** per CS module are defined in the `ModulePermissions` type in `src/lib/permissions.ts`. The middleware only enforces `view`. Page-level enforcement of `create`/`edit`/`delete`/`export` actions is the responsibility of individual pages/server actions — **this was not verified in every page** during this inspection.

---

## 6. Application Modules

### 6.1 Authentication Module

**Purpose:** User sign-in, sign-up, password reset, Google OAuth  
**Implementation Status:** IMPLEMENTED (with advanced security features)  
**Evidence:** `app/auth/`, `app/action/auth.ts`, `src/lib/auth/`

**Key functions:**
- Email/password sign-in with pre-auth checks
- Google OAuth (via Supabase OAuth + callback at `/auth/callback`)
- Email/password sign-up with email verification requirement
- Account approval flow (Pending → Active by Admin)
- Forgot password with rate limiting (3 requests/hour)
- Password reset with password history check (last 5 passwords)
- Login lockout (5 failed attempts → 15-minute lockout)
- Security event logging (`auth_security_events` table)
- Timing-safe delay on forgot password to prevent enumeration
- Welcome email via Resend on signup

---

### 6.2 Client Servicing — CPST (Client Prospect Servicing Tracker)

**Purpose:** CRM-style tracker for all client records (Prospects, Leads, Serviced clients)  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/cpst/CPSTClient.tsx` (155KB — largest component), `app/(admin)/admin/(ClientServicing)/cpst/`, `supabase/schema/20260718000001_create_clients_table.sql`

**Key functions:**
- Add / Edit / Delete client records
- Client status: Prospect, Lead, Serviced
- Analytics sub-page
- Greetings/birthday tracking

---

### 6.3 Client Servicing — ACR (Advisor Change Request)

**Purpose:** Track and process requests to change a client's financial advisor  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `app/(admin)/admin/(ClientServicing)/acr/page.tsx` (32KB), `app/api/acr/route.ts`, `src/features/client-servicing/acr-engine/AcrStandardForm.tsx`, `src/features/client-servicing/pdf/generateAdvisorChangeRequestPdfFromTemplate.ts`, `src/features/client-servicing/config/acrConfig.ts`

**Key functions:**
- CRUD operations on `advisor_change_requests` table (FK to `clients`)
- Form data capture with configurable field layout (AcrStandardForm)
- PDF generation from official template (pdf-lib AcroForm)
- Processor and progress tracking via lookup tables

---

### 6.4 Client Servicing — BCR / CPC (Beneficiary Change Request)

**Purpose:** Track and process requests to change policy beneficiaries  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `app/(admin)/admin/(ClientServicing)/bcr/page.tsx` (33KB), `src/features/client-servicing/bcr-engine/BcrStandardForm.tsx` (68KB — largest engine), `src/features/client-servicing/pdf/generateBeneficiaryChangeRequestPdfFromTemplate.ts`

**Key functions:**
- CRUD on `cpc_records` table
- Configurable form layout via `bcrConfig.ts`
- PDF generation from template
- Multi-beneficiary support
- PDF canvas-based preview

---

### 6.5 Client Servicing — ACICR (Address and Contact Information Change Request)

**Purpose:** Track and process changes to client addresses and contact details  
**Implementation Status:** IMPLEMENTED (active development — dev server shows `date_of_signing` field warning at startup)  
**Evidence:** `app/(admin)/admin/(ClientServicing)/acicr/page.tsx` (24KB), `src/features/client-servicing/acicr-engine/AcicrStandardForm.tsx` (48KB), `src/features/client-servicing/pdf/generateAcicrPdfFromTemplate.ts`, `src/features/client-servicing/acicr/ACICRForm.tsx`

---

### 6.6 Client Servicing — FST/Fund Switching

**Purpose:** Track and process fund switching requests  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/fund-switching-engine/FundSwitchingStandardForm.tsx`, `src/features/client-servicing/pdf/generateFundSwitchingPdf.ts`, `app/api/fst/route.ts`

---

### 6.7 Client Servicing — Fund Withdrawal (MNGT/FWR)

**Purpose:** Track and process fund withdrawal requests  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/fund-withdrawal-engine/FundWithdrawalStandardForm.tsx`, `src/features/client-servicing/pdf/generateFundWithdrawalPdfFromTemplate.ts`, `app/api/mngt/route.ts`

---

### 6.8 Client Servicing — ACA/PPU (Address Change / Policy Update)

**Purpose:** Track and process policy address and update requests  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `app/api/ppu/route.ts`, `src/features/client-servicing/pdf/generateAcaPdfFromTemplate.ts`

---

### 6.9 Client Servicing — ADA (Appointment of Advisor / Advisor Designation)

**Purpose:** Track and process appointment of new advisors for orphaned policies  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/ada-engine/AdaStandardForm.tsx`, `src/features/client-servicing/pdf/generateAdaPdfFromTemplate.ts`, `supabase/schema/20260727000001_create_ada_requests.sql`

---

### 6.10 Client Servicing — SRO (Reinstatement)

**Purpose:** Track policy reinstatement requests  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/sro-engine/SroStandardForm.tsx`, `src/features/client-servicing/pdf/generateSroPdfFromTemplate.ts`

---

### 6.11 Client Servicing — PDI (Premium Due/Default Investigation)

**Purpose:** Track premium due/default cases  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/pdi-engine/PdiStandardForm.tsx`, `src/features/client-servicing/pdf/generatePdiPdfFromTemplate.ts`

---

### 6.12 CSMV (Client Servicing Monitoring View)

**Purpose:** Unified dashboard widget showing aggregated counts and statuses across all CS request types  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/csmv/CSMVClient.tsx` (20KB)

---

### 6.13 PDF Viewer Engine

**Purpose:** In-browser PDF preview with field overlay and signature capture  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/client-servicing/pdf-engine/` (9 files: `PdfViewerEngine.tsx`, `PdfCanvas.tsx`, `PdfSidebar.tsx`, `PdfToolbar.tsx`, `PdfFieldOverlay.tsx`, `SignatureModal.tsx`, `FieldInspector.tsx`, `CompareMode.tsx`)

---

### 6.14 Dashboard — Admin

**Purpose:** Central command view for administrators  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `app/(admin)/admin/dashboard/page.tsx` (15KB), supporting `analytics/` and `history/` sub-routes

---

### 6.15 Dashboard — User (Member/Advisor)

**Purpose:** Personalized productivity hub for non-admin users  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `app/(user)/dashboard/page.tsx` (380 lines), with Supabase Realtime integration, Pomodoro timer, tasks, to-do, calendar, birthday tracker, CS request forms accordion

---

### 6.16 Attendance Module

**Purpose:** Daily time-in/break/time-out logging  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/attendance/`, `supabase/supabase_schema.sql` (attendance table), `app/(user)/attendance/`, `app/(admin)/admin/attendance/`

---

### 6.17 Calendar Module

**Purpose:** Organization-wide event scheduling and viewing  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/calendar/`, `supabase/supabase_schema.sql` (calendar_events table), `app/(user)/calendar/`, `app/(admin)/admin/calendar/`

---

### 6.18 Announcements Module

**Purpose:** Admin broadcasts to team members  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `supabase/supabase_schema.sql` (announcements table), `app/(admin)/admin/announcements/`

---

### 6.19 FAQ Module

**Purpose:** Categorized knowledge base with helpfulness ratings  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `supabase/supabase_schema.sql` (faqs table), `app/(user)/faq/`, `app/(admin)/admin/faq/`

---

### 6.20 Notifications System

**Purpose:** In-app alerts (global and per-user)  
**Implementation Status:** IMPLEMENTED (database and write paths confirmed; realtime subscription scope partially verified)  
**Evidence:** `supabase/supabase_schema.sql` (notifications table), `src/lib/notifications.ts`, `app/action/auth.ts` (insert on signup)

---

### 6.21 Portal Resources Module

**Purpose:** Curated external links organized by category  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/features/portals/`, `supabase/supabase_schema.sql` (portal_categories + portal_resources tables), `app/api/portals/route.ts`

---

### 6.22 User Management / Members

**Purpose:** Admin control over user accounts, roles, and status  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `app/(admin)/admin/members/page.tsx` (8KB)

---

### 6.23 Settings Module

**Purpose:** System-wide configuration including maintenance mode management  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `app/(admin)/admin/settings/page.tsx` (64KB — very large), `supabase/supabase_schema.sql` (maintenance_settings table)

---

### 6.24 Maintenance Mode System

**Purpose:** Toggle system-wide or per-module maintenance to redirect non-admin users  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `src/lib/maintenance.ts`, `src/lib/middleware.ts`, `app/maintenance/`, `supabase/supabase_schema.sql`

---

### 6.25 AI Chatbot

**Purpose:** Built-in AI conversational assistant  
**Implementation Status:** PARTIALLY IMPLEMENTED  
**Evidence:** `app/api/chatbot/route.ts`, `src/features/chatbot/services/ollama.ts`

> [!WARNING]
> The chatbot API currently connects to a **local Ollama server** at `http://localhost:11434`. This means the chatbot is **non-functional in a deployed/production environment** unless Ollama is separately provisioned on the server. The `@google/generative-ai` and `openai` packages are installed but are **not connected** in the verified chatbot code path.

---

### 6.26 Search System

**Purpose:** Cross-module admin search (clients, requests, tasks, events)  
**Implementation Status:** IMPLEMENTED  
**Evidence:** `supabase/schema/20260725000001_create_search_admin_rpc.sql` (defines `search_admin()` RPC function), `src/lib/search/`

---

### 6.27 Email System

**Purpose:** Transactional emails (welcome, verification)  
**Implementation Status:** IMPLEMENTED (conditional — only sends if `RESEND_API_KEY` and `EMAIL_FROM` env vars are set)  
**Evidence:** `src/lib/resend.ts`, `app/action/auth.ts`, `src/features/users/emails/`

---

### 6.28 Departments Module

**Purpose:** Organizational department information and registration/onboarding context  
**Implementation Status:** IMPLEMENTED (client-side static data, not database-driven)  
**Evidence:** `src/lib/departments.ts` (332 lines of static department definitions for ASA, BDR, and other roles)

---

### 6.29 JF Application / JF BizDev / PPTM / CGPT (Ancillary Modules)

**Purpose:** Additional specialized forms/trackers referenced in the route structure  
**Implementation Status:** NOT VERIFIED — Routes exist in `app/(admin)/admin/(ClientServicing)/` but individual page contents were not inspected  
**Evidence:** Directory presence in `(ClientServicing)/` route group

---

### 6.30 Playground Module

**Purpose:** Experimental feature sandbox  
**Implementation Status:** NOT VERIFIED  
**Evidence:** `app/(user)/playground/`, `supabase/schema/create_playground_scores.sql`

---

## 7. Database Overview

### Primary Tables (from SQL schema files)

```
auth.users (Supabase-managed)
  │
  └── profiles (public, extended user data)
        ├── role: Admin | Advisor | Member | Bizdev
        ├── status: pending | active | suspended | disabled
        ├── client_servicing_permissions: JSONB (per-module CRUD flags)
        ├── failed_login_count
        ├── locked_until
        ├── phone
        ├── terms_accepted_at
        └── terms_version
  │
  └── attendance (time-in/out records)
  └── notifications (alerts, user_id nullable for global)
  └── tasks (client_servicing_tasks + general tasks)
  └── todo_tasks (personal user checklists)
  └── password_history (SHA-256 hashes for reuse prevention)
  └── auth_security_events (security event log)

clients (CPST registry — TEXT primary key)
  │
  ├── client_policy_cards
  ├── premium_payments
  ├── social_visibility_records
  ├── advisor_change_requests ─── acr_progress (lookup)
  │                           └── acr_processors (lookup)
  ├── beneficiary_change_requests (cpc_records also referenced separately)
  ├── fund_switching_requests ─── fst_progress (lookup)
  │                           └── fst_processors (lookup)
  ├── fund_withdrawal_requests
  ├── auto_change_arrangements
  ├── reinstatement_sro (and reinstatement_sro_requests)
  ├── reinstatement_pdi (and reinstatement_pdi_requests)
  └── advisor_daily_activity

acr_requests (separate table — policy_owner + policy_number, not FK to clients)
  └── acr_files (attached documents)

acr_progress (lookup table)
acr_processors (lookup table)

cpc_records (BCR records — client_name text, no FK)
fst_requests (fund switching — client_name text, no FK)
mngt_records (fund withdrawal — client_name text, no FK)
ppu_records (address change — client_name text, no FK)
ada_requests (advisor designation)
reinstatement_sro_requests (FK to cpst_clients)
reinstatement_pdi_requests (FK to cpst_clients)

announcements
faqs
calendar_events
notifications
portal_categories
  └── portal_resources

maintenance_settings (module_key → enabled flag)

roles (static lookup)
  └── team_members
```

> [!WARNING]
> **Data integrity gap (confirmed):** The main request tables (`acr_requests`, `cpc_records`, `fst_requests`, `mngt_records`, `ppu_records`) use **loose `TEXT` fields** for client names rather than foreign key references to the `clients` table. This is acknowledged in the `README.md` as a known issue and planned improvement. Two parallel table structures for some request types also exist (e.g., both `advisor_change_requests` and `acr_requests`).

### RLS Summary

| Table | RLS | Policy Style |
|---|---|---|
| `profiles` | ✓ Enabled | Public read; owner-only update |
| `attendance` | ✓ Enabled | User sees only own records |
| `clients` | ✓ Enabled | Service role full access (permissive) |
| `announcements` | ✓ Enabled | Public read; authenticated write |
| `faqs` | ✓ Enabled | Public read; authenticated write |
| `notifications` | ✓ Enabled | User sees own or global (null user_id) |
| `acr_requests` | ✓ Enabled | Service role full access (permissive) |
| `acr_files` | ✓ Enabled | Service role full access (permissive) |
| `acr_progress` | ✓ Enabled | Service role full access (permissive) |
| `acr_processors` | ✓ Enabled | Service role full access (permissive) |
| `calendar_events` | ✓ Enabled | Public read; authenticated write |
| `portal_categories` | ✓ Enabled | Public read; authenticated CRUD |
| `portal_resources` | ✓ Enabled | Public read; authenticated CRUD |
| `maintenance_settings` | ✓ Enabled | Public read; authenticated write |
| `tasks` | ✓ Enabled | All authenticated users full access |

> [!CAUTION]
> Several tables use `USING (true)` policies (effectively bypassing row-level filtering) and rely on the `service_role` key for access control rather than row-level predicates. This is a pragmatic choice for administrative tables but means **any authenticated user with the service role key** could access all records. The service role key should never be exposed client-side.

---

## 8. Major Workflows

### 8.1 Login Workflow

```
User visits /auth/login
  ↓
AuthForm (client component — app/auth/AuthForm.tsx)
  ↓
User submits email + password
  ↓
[Client] Google OAuth option → supabase.auth.signInWithOAuth()
         OR
[Server] SignIn() Server Action (app/action/auth.ts)
  ↓
1. Validate email and password format
2. Look up user by email (supabaseAdmin)
3. checkAccountStatus() — block if pending/suspended/disabled
4. checkLoginLockout() — block if 5+ failed attempts within 15 min
5. Check email_confirmed_at — block if unverified
6. supabase.auth.signInWithPassword()
7. On failure: recordFailedLogin(), logSecurityEvent()
8. On success: resetFailedLoginCount(), logSecurityEvent()
9. Fetch role from profiles
10. redirect('/admin/dashboard') or redirect('/dashboard')
```

### 8.2 Client Servicing Request Workflow (ACR example)

```
Admin navigates to /admin/acr
  ↓
Middleware checks:
  - User authenticated?
  - Role = Admin? OR (isClientServicingRoute + Advisor/Member with view perm?)
  ↓
Page loads — ACR list fetched from Supabase (supabase.from('advisor_change_requests'))
  ↓
User clicks "+ New" button
  ↓
AcrStandardForm renders (dynamic import, SSR:false)
  ↓
User fills form fields (client selection, policy number, advisor details, signatures)
  ↓
Form submitted → INSERT to advisor_change_requests
  ↓
User clicks "Download PDF"
  ↓
generateAdvisorChangeRequestPdfFromTemplate():
  - Fetch PDF template (AcroForm PDF stored in /public or fetched)
  - PDFDocument.load(templateBytes)
  - pdfDoc.getForm() → fill text fields, check boxes
  - Embed signature images
  - pdfDoc.save() → Uint8Array
  - Download as blob
```

### 8.3 Registration / Account Approval Workflow

```
New user visits /auth/login → clicks "Sign up"
  ↓
Fills: full name, role selection, email, phone, password, confirm password, terms checkbox
  ↓
SignUp() Server Action:
1. Validate all fields server-side
2. Check for duplicate email (supabaseAdmin.auth.admin.listUsers)
3. supabase.auth.signUp() → sends verification email
4. supabaseAdmin.from('profiles').upsert({ status: 'Pending', ... })
5. addPasswordToHistory()
6. Insert notification for admin ("New Member Registration")
7. Send welcome email via Resend (if API key configured)
  ↓
User receives verification email → clicks link → /auth/callback
  ↓
User attempts login → blocked by checkAccountStatus() → "awaiting approval"
  ↓
Admin sees notification → navigates to /admin/members
  ↓
Admin sets status = 'Active' → user can now log in
```

### 8.4 Maintenance Mode Workflow

```
Admin navigates to /admin/settings
  ↓
Toggles maintenance for a module (e.g., 'acr')
  ↓
UPDATE maintenance_settings SET enabled = true WHERE module_key = 'acr'
  ↓
Non-admin user navigates to /admin/acr
  ↓
Middleware: isModuleMaintenance(settings, 'acr') → true
  ↓
Redirect to /maintenance/acr
  ↓
Maintenance page shown; Admin users bypass this check
```

---

## 9. Authentication & Security

### Implemented Security Mechanisms

| Mechanism | Implementation |
|---|---|
| Email/Password Authentication | Supabase Auth — `supabase.auth.signInWithPassword()` |
| Google OAuth | Supabase OAuth — `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| Email verification required | `checkAccountStatus()` checks `email_confirmed_at` before allowing login |
| Account status gating | `pending`, `active`, `suspended`, `disabled` — only `active` can log in |
| Login lockout | 5 failed attempts → 15-minute lockout (stored in `profiles.locked_until`) |
| Security event logging | All login attempts, lockouts, resets, registrations logged to `auth_security_events` |
| Password history | Last 5 passwords stored as SHA-256 hashes; reuse blocked on reset |
| Forgot password rate limiting | Max 3 requests per email per hour |
| Timing-safe delay | 500ms ± 100ms artificial delay on forgot password to prevent timing enumeration |
| Session management | Supabase SSR — cookie-based, refreshed on every middleware call |
| RBAC — Route level | Middleware guards (5 guard rules) enforce role-based routing |
| RBAC — Module level | `client_servicing_permissions` JSONB per user for granular CS module access |
| Profile enforcement | Missing profile = sign out + redirect to login |
| Admin action bypass | `admin@teampadua.com` email bypasses account status check (hardcoded) |
| RLS Policies | Enabled on all user-facing tables |
| Server-side env separation | `supabaseAdmin` (service role) used only in Server Actions and API routes |

### Observed Security Concerns

| Concern | Severity | Details |
|---|---|---|
| Hardcoded admin email bypass | **Medium** | `email.toLowerCase() !== 'admin@teampadua.com'` skips account status check in `auth.ts` line 83. This is a brittle privileged bypass. |
| SHA-256 for password history | **Low** | SHA-256 is used for password history comparison (not credential storage). This is acceptable for history checking but should be documented clearly. Credentials are managed by Supabase's bcrypt. |
| Permissive RLS policies | **Medium** | Several tables use `USING (true)` or `auth.role() = 'authenticated'` which allows any authenticated user to perform operations. Not row-scoped to user or role in all cases. |
| Chatbot Ollama endpoint | **Medium** | The chatbot service calls `http://localhost:11434` without authentication. If deployed to a server, this requires firewall controls. |
| `listUsers` pagination | **Low** | Duplicate email check in `SignUp()` calls `listUsers({ perPage: 1000 })` — this may miss users if the organization grows beyond 1,000 accounts. |
| Page-level permission enforcement | **Not Verified** | Middleware enforces `view` permission. Whether individual pages enforce `create`/`edit`/`delete` at the server action or API level was not verified for all CS modules. |
| `debug-db` API route | **High** | An `/api/debug-db` endpoint exists. Its access controls and data exposure were not fully inspected. |

---

## 10. PDF / Document Generation

The system has **two distinct PDF generation approaches**:

### Approach 1: AcroForm Template Filling (pdf-lib)
Used by: ACR, BCR, ACICR, ACA, ADA, SRO, PDI, Fund Withdrawal (template variant)

**How it works:**
1. A PDF AcroForm template is fetched (presumed stored in `/public` or fetched from a URL)
2. `PDFDocument.load(templateBytes)` loads the template
3. `pdfDoc.getForm()` gives access to form fields
4. `setPdfTextField()` / `setCheck()` helpers normalize values (uppercase, N/A for empty, date formatting)
5. Signature images (base64 PNG/JPG) are embedded directly on the page
6. `pdfDoc.save()` exports the filled PDF as bytes
7. A browser download is triggered client-side

**Missing value handling:** Empty fields are filled with `"N/A"` by default

**Notable warnings seen at runtime:** `date_of_signing not found in ACICR PDF` — indicates a field name mismatch between the form data and the AcroForm template field name

### Approach 2: Programmatic PDF Generation (jsPDF)
Used by: FST (Fund Switching), ACA "from scratch" variant

**How it works:**
1. A `jsPDF` document is created programmatically
2. Text, tables (via `jspdf-autotable`), and layout drawn directly
3. No external template required

### PDF Viewer Engine
- `pdfjs-dist` is used to render PDF pages to `<canvas>` elements
- `PdfFieldOverlay` overlays interactive field positions on the rendered pages
- `SignatureModal` captures digital signatures using `react-signature-canvas`
- `CompareMode` and `FieldInspector` are auxiliary developer/QA tools

---

## 11. Testing Status

**Finding: No automated tests are present in the repository.**

- **No test files found**: A comprehensive search across all `.ts`, `.tsx`, and `.json` files returned zero matches for `test`, `spec`, `jest`, `vitest`, `cypress`, or `playwright`.
- **No test runner configured**: `package.json` contains only `dev`, `build`, `start`, and `lint` scripts.
- **No test directories**: No `__tests__`, `test/`, `e2e/`, or `spec/` directories found.

**Conclusion:** The system has no automated testing infrastructure of any kind. All verification is presumed to be manual.

---

## 12. Deployment

### Target Platform
- **Vercel** (confirmed in `README.md` — optimized for Vercel's Next.js detection)
- No `vercel.json` was observed in the repository

### Build Process
```bash
npm run build   # next build (Turbopack)
npm start       # next start
npm run dev     # next dev (Turbopack) — used in development
```

### Environment Variables Required

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (public, browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key (public, browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (server-only — NEVER expose client-side) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key (referenced in README; usage not verified in all paths) |
| `NEXT_PUBLIC_SITE_URL` | Base URL for auth redirects (e.g., `https://yourportal.com`) |
| `RESEND_API_KEY` | Resend email service API key |
| `EMAIL_FROM` | Sender address for transactional emails |

### Database Setup
- All migrations are in `supabase/schema/` (18 SQL files) and `supabase/supabase_schema.sql`
- Must be applied to Supabase project via SQL Editor
- RLS policies must be active in production

### Image Sources Allowed (next.config.ts)
- `lh3.googleusercontent.com` (Google profile photos)
- `*.supabase.co` (Supabase storage)

---

## 13. Feature Implementation Matrix

| Feature | Status | Evidence | Notes |
|---|---|---|---|
| Email/Password Auth | ✅ Implemented | `app/action/auth.ts` | Advanced security features included |
| Google OAuth | ✅ Implemented | `app/auth/AuthForm.tsx`, `/auth/callback` | Verified in code |
| Account Status Gating | ✅ Implemented | `src/lib/auth/security.ts` | Pending/Suspended/Disabled block login |
| Login Lockout | ✅ Implemented | `src/lib/auth/security.ts` | 5 attempts, 15min lockout |
| Password History | ✅ Implemented | `src/lib/auth/security.ts` | Last 5 passwords, SHA-256 hash |
| Password Reset | ✅ Implemented | `app/action/auth.ts` | With rate limiting |
| Welcome Email | ✅ Implemented | `app/action/auth.ts` | Conditional on env vars |
| RBAC Middleware Guards | ✅ Implemented | `src/lib/middleware.ts` | 5 guard rules |
| Maintenance Mode | ✅ Implemented | `src/lib/maintenance.ts` | Per-module + global |
| Admin Dashboard | ✅ Implemented | `app/(admin)/admin/dashboard/page.tsx` | |
| User Dashboard | ✅ Implemented | `app/(user)/dashboard/page.tsx` | Pomodoro, tasks, calendar, forms |
| CPST (Client CRM) | ✅ Implemented | `src/features/client-servicing/cpst/` | Largest single component (155KB) |
| ACR (Advisor Change) | ✅ Implemented | `app/(admin)/admin/(ClientServicing)/acr/` | Full CRUD + PDF |
| BCR/CPC (Beneficiary) | ✅ Implemented | `app/(admin)/admin/(ClientServicing)/bcr/` | Full CRUD + PDF |
| ACICR (Address Change) | ✅ Implemented | `app/(admin)/admin/(ClientServicing)/acicr/` | Active dev — runtime field warning |
| FST (Fund Switching) | ✅ Implemented | `src/features/client-servicing/fund-switching-engine/` | |
| FWR/MNGT (Withdrawal) | ✅ Implemented | `src/features/client-servicing/fund-withdrawal-engine/` | |
| ACA/PPU (Policy Update) | ✅ Implemented | `src/features/client-servicing/aca-engine/` | |
| ADA (Advisor Appoint.) | ✅ Implemented | `src/features/client-servicing/ada-engine/` | |
| SRO (Reinstatement) | ✅ Implemented | `src/features/client-servicing/sro-engine/` | |
| PDI (Premium Due) | ✅ Implemented | `src/features/client-servicing/pdi-engine/` | |
| CSMV (Monitoring View) | ✅ Implemented | `src/features/client-servicing/csmv/` | |
| PDF Viewer Engine | ✅ Implemented | `src/features/client-servicing/pdf-engine/` | 9 components |
| PDF Generation (AcroForm) | ✅ Implemented | `src/features/client-servicing/pdf/` | 14 generator files |
| Attendance Tracking | ✅ Implemented | `src/features/attendance/`, DB table | |
| Calendar | ✅ Implemented | `src/features/calendar/`, DB table | |
| Announcements | ✅ Implemented | DB table + admin route | |
| FAQ | ✅ Implemented | DB table + user/admin routes | |
| Notifications (in-app) | ✅ Implemented | DB table + write paths confirmed | Realtime read scope partially verified |
| Portal Resources | ✅ Implemented | DB tables + API route | |
| Internal Messaging | ✅ Implemented | `src/features/messages/` | DB scope not fully verified |
| User Management | ✅ Implemented | `app/(admin)/admin/members/` | |
| Settings / System Config | ✅ Implemented | `app/(admin)/admin/settings/` (64KB) | |
| Department Configuration | ✅ Implemented (static) | `src/lib/departments.ts` | Client-side static data only |
| Global Search (RPC) | ✅ Implemented | `search_admin()` PostgreSQL function | |
| AI Chatbot | ⚠️ Partially Implemented | `src/features/chatbot/` | Requires local Ollama server |
| JF Application / BizDev | ❓ Not Verified | Directory exists in routes | Page content not inspected |
| PPTM Records | ❓ Not Verified | Directory exists in routes | Page content not inspected |
| CGPT (CS AI Tool) | ❓ Not Verified | Directory exists in routes | Likely connects to chatbot |
| Playground | ❓ Not Verified | Route + DB table (scores) | Experimental |
| Reports | ❓ Not Verified | Referenced in README | No route directory confirmed |
| Teams Module | ❓ Not Verified | User route exists | DB tables (roles, team_members) minimal |
| Email System (Resend) | ✅ Implemented (conditional) | `src/lib/resend.ts` | Requires env vars to activate |
| Automated Testing | ❌ Not Implemented | No test files found | No test runner configured |

---

## 14. Gaps and Risks

### Critical

| Gap | Description |
|---|---|
| No automated testing | Zero unit, integration, or E2E tests. System correctness relies entirely on manual testing. High risk for regressions in a codebase with 22+ modules. |
| Chatbot production gap | The AI chatbot requires a locally running Ollama server. In a hosted Vercel deployment, this will silently fail. |
| `debug-db` API route | An endpoint at `/api/debug-db` was not inspected. If it exposes raw database data without strict authorization, it is a significant security risk. |

### High

| Gap | Description |
|---|---|
| Loose client-name references | `acr_requests`, `cpc_records`, `fst_requests`, `mngt_records`, `ppu_records` use `TEXT` client names with no FK to `clients`. Data integrity is not enforced at the database level. |
| Dual/overlapping table structures | Both `advisor_change_requests` (child of `clients`) and `acr_requests` (standalone) appear to exist. Similarly for reinstatement and other types. The active table in production needs clarification. |
| Hardcoded admin email bypass | `admin@teampadua.com` skips account status checks server-side. If this email is compromised, status gating is bypassed. |
| Granular permission enforcement (page-level) | The middleware enforces `view`. Whether all CS pages enforce `create`/`edit`/`delete` at the server action level was not verified for every module. |
| No error monitoring | No Sentry, Datadog, or equivalent error tracking was found. Production errors may go undetected. |

### Medium

| Gap | Description |
|---|---|
| RLS over-permissiveness | Several tables allow all authenticated users full access without row-level scoping. Suitable for admin tables but should be reviewed. |
| `listUsers` pagination limit | Duplicate email check fetches max 1,000 users. Will break silently for organizations exceeding 1,000 accounts. |
| Not all modules have DB-driven content | Departments module is static TypeScript data. If department structures change, code must be updated. |
| Reinstatement route inconsistency | README notes potential routing overlaps between `reinstatement`, `sro`, and `pdi` maintenance keys. |
| ACICR `date_of_signing` field mismatch | Seen in dev server logs at startup. The PDF template field name does not match the code expectation. Likely a template naming inconsistency. |
| Missing `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` usage verification | Listed in README env vars but not confirmed used in all client code paths. |

### Low

| Gap | Description |
|---|---|
| `todo_tasks` and `client_servicing_tasks` schema consolidation | README notes these could be merged. |
| Password strength validation is weak | The UI shows strength but the server only validates minimum 8 characters. |
| No HTTPS enforcement in code | HTTPS should be enforced at hosting layer (Vercel handles this). |
| OCR (Tesseract.js) usage not verified | The package is installed but its active usage in the UI was not confirmed during this inspection. |
| `Mammoth` / `xlsx-populate` usage not verified | Installed but specific feature using these was not traced in this inspection. |

### Documentation Gaps

| Gap | Description |
|---|---|
| No API documentation (inline) | API routes lack OpenAPI/JSDoc annotations |
| No onboarding guide for developers | README is good but no local dev environment setup walkthrough exists |
| No deployment runbook | Step-by-step deployment and migration guide is missing |
| Comments in Tagalog | Some code comments are in Tagalog (e.g., `// Nasa taas para malinis`), which may confuse international developers |

### Testing Gaps

| Gap | Description |
|---|---|
| Zero automated tests | No test suite of any kind exists |
| No acceptance criteria documented | No formal test cases or acceptance criteria for any feature |
| No CI/CD pipeline visible | No GitHub Actions or similar automated build/test pipeline was found |

---

## 15. Recommendations

### Priority 1 — Critical (Before Production Scaling)

1. **Fix the chatbot production gap** — Either provision Ollama on the server, connect to Google Generative AI / OpenAI (already installed), or disable the chatbot in production with a clear message.
2. **Audit and restrict `/api/debug-db`** — Inspect this route and either remove it or add strict Admin-only authorization.
3. **Introduce automated testing** — Start with auth flows, PDF generation correctness, and CS module CRUD operations.

### Priority 2 — High (Within Next Sprint)

4. **Resolve the dual table issue** — Determine which table is authoritative for each request type (e.g., `acr_requests` vs `advisor_change_requests`) and consolidate.
5. **Add FK constraints to request tables** — Migrate `acr_requests.client_name` → `client_id` FK reference to enforce data integrity.
6. **Remove or rotate the hardcoded admin email bypass** — Use a proper admin role check instead of an email string comparison.
7. **Audit page-level permission enforcement** — Confirm all CS pages enforce `create`/`edit`/`delete` server-side, not just in middleware.

### Priority 3 — Medium (Next 1–2 Months)

8. **Set up error monitoring** — Integrate Sentry or equivalent.
9. **Create a CI/CD pipeline** — GitHub Actions for automated build + lint on every push.
10. **Increase RLS specificity** — Scope permissive `USING (true)` policies more tightly where appropriate.
11. **Fix ACICR `date_of_signing` field name** — Align the PDF template field name with the code.
12. **Database-driven departments** — Move static department data to a database table to allow admin configuration.

### Priority 4 — Low (Future Roadmap)

13. **Realtime expansion** — Add Supabase Realtime subscriptions for `notifications` and `messages` live updates.
14. **Task consolidation** — Merge `todo_tasks` and `client_servicing_tasks` into a unified task schema.
15. **Password strength improvement** — Enforce stronger complexity rules server-side (not just length).
16. **Internationalize code comments** — Replace Tagalog inline comments with English for broader maintainability.

---

## 16. Evidence Index

| File / Path | Relevance |
|---|---|
| [package.json](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/package.json) | Full dependency list and versions |
| [next.config.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/next.config.ts) | Next.js configuration, image domains |
| [src/middleware.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/middleware.ts) | Entry point for middleware |
| [src/lib/middleware.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/lib/middleware.ts) | Full middleware logic: 5 auth guards + maintenance |
| [src/lib/permissions.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/lib/permissions.ts) | RBAC permission types, role checks, route-to-module mapping |
| [src/lib/maintenance.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/lib/maintenance.ts) | Maintenance mode logic, path mapping |
| [src/lib/auth/types.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/lib/auth/types.ts) | Auth constants, account status types |
| [src/lib/auth/security.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/lib/auth/security.ts) | Lockout, login tracking, password history, security events |
| [app/action/auth.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/app/action/auth.ts) | SignIn, SignUp, SignOut, ForgotPassword, ResetPassword Server Actions |
| [app/auth/AuthForm.tsx](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/app/auth/AuthForm.tsx) | Auth UI (email+pw, Google OAuth, signup, forgot pw) |
| [supabase/supabase_schema.sql](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/supabase/supabase_schema.sql) | Primary DB schema (profiles, attendance, clients, announcements, etc.) |
| [supabase/schema/01_cams_schema.sql](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/supabase/schema/01_cams_schema.sql) | CAMS child tables schema |
| [supabase/schema/20260709000002_add_client_servicing_permissions.sql](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/supabase/schema/20260709000002_add_client_servicing_permissions.sql) | JSONB permissions column migration |
| [supabase/schema/20260725000001_create_search_admin_rpc.sql](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/supabase/schema/20260725000001_create_search_admin_rpc.sql) | search_admin() RPC function |
| [supabase/schema/20260722000001_create_enterprise_tasks_and_comments.sql](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/supabase/schema/20260722000001_create_enterprise_tasks_and_comments.sql) | Tasks table and RLS |
| [src/features/client-servicing/index.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/features/client-servicing/index.ts) | CS feature module exports |
| [src/features/client-servicing/pdf/pdfFormUtils.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/features/client-servicing/pdf/pdfFormUtils.ts) | Shared PDF utility (field setting, font, N/A handling) |
| [src/features/client-servicing/pdf/generateAcicrPdfFromTemplate.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/features/client-servicing/pdf/generateAcicrPdfFromTemplate.ts) | ACICR PDF generator |
| [src/features/client-servicing/bcr-engine/BcrStandardForm.tsx](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/features/client-servicing/bcr-engine/BcrStandardForm.tsx) | BCR form engine (68KB) |
| [src/features/client-servicing/cpst/CPSTClient.tsx](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/features/client-servicing/cpst/CPSTClient.tsx) | CPST client tracker (155KB) |
| [src/features/chatbot/services/ollama.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/features/chatbot/services/ollama.ts) | Chatbot Ollama connection (localhost:11434) |
| [app/api/chatbot/route.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/app/api/chatbot/route.ts) | Chatbot API route handler |
| [src/lib/resend.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/lib/resend.ts) | Resend email client initialization |
| [src/lib/departments.ts](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/src/lib/departments.ts) | Static department definitions (332 lines) |
| [README.md](file:///c:/Users/William%20Kyle/Development/react/team-padua-portal/README.md) | Project overview, known issues, future improvements |

---

## ⚠️ END OF PHASE 1

**This inspection report is now complete.**

Please review all findings, correct any inaccuracies, and confirm or clarify the following open items before Phase 3 documentation begins:

1. **Which tables are authoritative for each request type?** (e.g., `acr_requests` vs `advisor_change_requests`, the cpst-linked child tables vs standalone tables)
2. **What is the intended production AI backend?** (Google Generative AI, OpenAI, or Ollama on server?)
3. **What is the deployment target URL / domain?**
4. **Are JF Application, JF BizDev, PPTM, and CGPT modules considered production features or internal tools?**
5. **What is the correct name and scope for the organization?** (Team Padua? Sun Life Philippines? A specific agency/team?)
6. **Should the static `departments.ts` content be treated as part of the system requirements?**
7. **Is the `Advisor` role intended to have access to general admin pages (announcements, members, departments) or only Client Servicing pages?**

**Phase 3 documentation will not be generated until you explicitly respond:**
> "Inspection Report approved. Proceed to documentation."
