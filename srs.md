# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Team Padua Portal — Financial Advisory Operations & Client Servicing System

**Version:** 1.0  
**Status:** Approved  
**Date:** 2026-08-11  
**Author:** Software Architecture & Systems Documentation Team  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) documents the detailed functional and non-functional requirements for the **Team Padua Portal**. The portal is an enterprise web application designed to centralize, streamline, and automate financial advisor support operations, client servicing requests, policy document generation, internal messaging, attendance tracking, and administrative oversight.

### 1.2 Scope
The scope of the system encompasses:
- **Client Prospect Servicing Tracker (CPST):** Managing client leads, active prospects, serviced client registries, and birthday milestone tracking.
- **Client Servicing Request Engines:** End-to-end tracking and processing of insurance policy change requests including Advisor Change Requests (ACR), Beneficiary Change Requests (BCR/CPC), Fund Switching Requests (FST), Fund Withdrawal Requests (FWR/MNGT), Address Change & Policy Updates (ACA/PPU), Appointment of Advisor (ADA/ADAT), Policy Reinstatements (SRO/PDI), and Address/Contact Change Requests (ACICR).
- **Automated Document & PDF Generation:** Filling official AcroForm PDF templates and programmatically rendering PDF documents with digital signature embedding.
- **Client Servicing Monitoring View (CSMV):** Aggregating real-time status counts across all request types for administrative oversight.
- **Team Productivity & Attendance:** Daily time-in/out logging, personal to-do checklists, shared operational tasks, and organizational calendar events.
- **Communication & AI Support:** Broadcast announcements, categorized FAQs, internal messaging, and AI chatbot assistance.
- **System Administration & Security:** Role-based access control (RBAC), multi-tiered authentication, email notification integration, global search, and per-module maintenance controls.

### 1.3 Intended Audience
This document is intended for software engineers, database administrators, QA analysts, system administrators, business stakeholders, and client representatives participating in system onboarding, maintenance, testing, or commercialization.

### 1.4 Definitions and Acronyms

| Term / Acronym | Definition |
|---|---|
| **ACA / PPU** | Auto Change Arrangement / Policy Update (Address Change) |
| **ACICR** | Address and Contact Information Change Request |
| **ACR** | Advisor Change Request |
| **ADA / ADAT** | Appointment of Advisor / Advisor Designation |
| **BCR / CPC** | Beneficiary Change Request / Client Policy Card |
| **CPST** | Client Prospect Servicing Tracker (Core Client CRM) |
| **CSMV** | Client Servicing Monitoring View |
| **FST / FSR** | Fund Switching Request |
| **FWR / MNGT** | Fund Withdrawal Request |
| **PDI** | Premium Due / Default Investigation & Reinstatement |
| **RBAC** | Role-Based Access Control |
| **RLS** | Row Level Security (PostgreSQL / Supabase) |
| **SRO** | Service Request Organization / Policy Reinstatement |

---

## 2. Overall Description

### 2.1 Product Perspective
The Team Padua Portal operates as a cloud-hosted full-stack web application built on **Next.js 16 (App Router)** and **Supabase (PostgreSQL, Auth, SSR)**. It interfaces with external services including **Resend** (transactional email) and optional local/cloud AI backends (**Ollama / Google Gemini**).

### 2.2 Product Functions Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                      TEAM PADUA PORTAL                          │
├───────────────────┬──────────────────────┬──────────────────────┤
│  Client Servicing │ Team Productivity    │ Platform Admin       │
│  - CPST Registry  │ - Activity Attendance│ - Role Control (RBAC)│
│  - 8+ Request Mod │ - Shared Tasks       │ - Maintenance System │
│  - CSMV Monitoring│ - Personal To-Do     │ - Announcements/FAQs │
│  - PDF Generator  │ - Org Calendar       │ - Global Search RPC  │
└───────────────────┴──────────────────────┴──────────────────────┘
```

### 2.3 User Classes & Characteristics

| User Class | Roles Included | Permissions & Functions |
|---|---|---|
| **Administrator** | `Admin` | Access to all system modules, user administration, role assignment, global search, maintenance toggles, department configuration, full CS request oversight. |
| **Financial Advisor** | `Advisor` | Automatic full access to all Client Servicing modules (CPST, ACR, BCR, FST, etc.), request creation, client management, PDF generation, personal dashboard. |
| **Associate / Member** | `Member`, `Bizdev` | Standard user dashboard, attendance logging, personal to-do list, calendar view. Client Servicing modules accessible **only when explicitly granted** via user profile permissions. |

### 2.4 Operating Environment
- **Client Side:** Web browsers (Chrome, Edge, Firefox, Safari) on desktop and mobile devices.
- **Server Environment:** Serverless Node.js environment (Vercel / Next.js SSR runtime).
- **Database Environment:** Supabase managed PostgreSQL instance with PostgREST API and Realtime channels.

---

## 3. Functional Requirements

### 3.1 Authentication & Security (`FR-AUTH`)

- **FR-AUTH-001:** The system shall allow users to authenticate using valid email and password credentials. *(Implemented)*
- **FR-AUTH-002:** The system shall support single sign-on authentication via Google OAuth 2.0. *(Implemented)*
- **FR-AUTH-003:** The system shall enforce account status gating during sign-in (`pending`, `active`, `suspended`, `disabled`), blocking login attempts for non-active accounts. *(Implemented)*
- **FR-AUTH-004:** The system shall enforce a 15-minute account lockout after 5 consecutive failed login attempts. *(Implemented)*
- **FR-AUTH-005:** The system shall log security events (`login_success`, `login_failed`, `lockout_triggered`, `registration`, `password_reset_request`) to an audited security log table. *(Implemented)*
- **FR-AUTH-006:** The system shall enforce password history validation, preventing users from reusing any of their last 5 passwords. *(Implemented)*
- **FR-AUTH-007:** The system shall rate-limit password reset requests to a maximum of 3 requests per hour per email address. *(Implemented)*
- **FR-AUTH-008:** The system shall enforce server-side validation on user sign-up data including email format, password complexity, phone number format, and terms acceptance. *(Implemented)*

### 3.2 Client Prospect Servicing Tracker (`FR-CPST`)

- **FR-CPST-001:** The system shall maintain a centralized client registry (`clients`) storing client names, birthdates, relationships, notes, and statuses (`Prospect`, `Lead`, `Serviced`). *(Implemented)*
- **FR-CPST-002:** The system shall enable authorized users to create, view, update, and soft-delete client records. *(Implemented)*
- **FR-CPST-003:** The system shall calculate upcoming client birthdays and surface notifications/reminders on user and admin dashboards. *(Implemented)*

### 3.3 Client Servicing Requests (`FR-CSR`)

- **FR-CSR-001 (ACR):** The system shall allow authorized users to submit Advisor Change Requests with policy numbers, reason details, new advisor information, and digital signatures. *(Implemented)*
- **FR-CSR-002 (BCR):** The system shall support Beneficiary Change Requests capturing primary/contingent beneficiary details, shares, relationships, and signatures. *(Implemented)*
- **FR-CSR-003 (FST):** The system shall process Fund Switching Requests capturing policy details, source funds, destination funds, switching percentages/amounts, and owner consent. *(Implemented)*
- **FR-CSR-004 (FWR):** The system shall process Fund Withdrawal Requests recording withdrawal amounts, bank payout details, and policy owner signatures. *(Implemented)*
- **FR-CSR-005 (ACA):** The system shall process Address Change and Policy Update Requests capturing permanent, present, work, and preferred mailing addresses. *(Implemented)*
- **FR-CSR-006 (ADA):** The system shall process Advisor Designation Requests for orphaned policies. *(Implemented)*
- **FR-CSR-007 (SRO/PDI):** The system shall process Policy Reinstatement Requests and Premium Due/Default investigations. *(Implemented)*
- **FR-CSR-008 (CSMV):** The system shall provide a consolidated Client Servicing Monitoring View displaying live metrics and progress bars across all request types. *(Implemented)*

### 3.4 PDF Document Generation (`FR-PDF`)

- **FR-PDF-001:** The system shall fill official AcroForm PDF templates using `pdf-lib` for ACR, BCR, ACICR, ACA, ADA, SRO, and PDI requests. *(Implemented)*
- **FR-PDF-002:** The system shall automatically convert text inputs to uppercase and map empty/whitespace fields to `"N/A"`. *(Implemented)*
- **FR-PDF-003:** The system shall embed base64 PNG/JPG digital signature images onto designated PDF page coordinates. *(Implemented)*
- **FR-PDF-004:** The system shall provide an in-browser PDF viewer engine (`PdfViewerEngine`) rendering interactive field overlays on canvas elements. *(Implemented)*

### 3.5 Productivity & Task Management (`FR-PROD`)

- **FR-PROD-001:** The system shall allow users to log daily attendance records with time-in, break-out, break-in, and time-out timestamps. *(Implemented)*
- **FR-PROD-002:** The system shall provide a personal to-do list (`todo_tasks`) for individual member task tracking. *(Implemented)*
- **FR-PROD-003:** The system shall support shared client servicing tasks (`client_servicing_tasks`) with user assignment and status toggles. *(Implemented)*
- **FR-PROD-004:** The system shall maintain an organizational calendar (`calendar_events`) displaying events, times, and locations. *(Implemented)*

### 3.6 Communications & AI Support (`FR-COMM`)

- **FR-COMM-001:** The system shall display broadcasted system announcements with priority levels and audience targeting. *(Implemented)*
- **FR-COMM-002:** The system shall provide a categorized FAQ knowledge base with helpfulness rating counts. *(Implemented)*
- **FR-COMM-003:** The system shall deliver in-app user notifications for new account approvals and request updates. *(Implemented)*
- **FR-COMM-004:** The system shall provide an AI chatbot interface (`/api/chatbot`) with graceful offline fallback when the underlying LLM service is unavailable. *(Implemented)*

### 3.7 Platform Administration & Maintenance (`FR-ADMIN`)

- **FR-ADMIN-001:** The system shall provide a unified PostgreSQL search RPC (`search_admin`) returning cross-table search results for clients, requests, tasks, and calendar events. *(Implemented)*
- **FR-ADMIN-002:** The system shall provide a global maintenance management system enabling administrators to toggle full-system or per-module maintenance modes. *(Implemented)*
- **FR-ADMIN-003:** The system shall automatically redirect non-admin users attempting to access modules under active maintenance to dedicated maintenance status pages. *(Implemented)*

---

## 4. Non-Functional Requirements

### 4.1 Security Requirements
- **NFR-SEC-001:** All client-database communications must be authenticated via Supabase session tokens.
- **NFR-SEC-002:** Service Role keys (`SUPABASE_SERVICE_ROLE_KEY`) must remain server-side and never be exposed to browser clients.
- **NFR-SEC-003:** Sensitive operations must enforce Row Level Security (RLS) policies at the PostgreSQL database layer.

### 4.2 Performance Requirements
- **NFR-PERF-001:** Page load time for main dashboard routes shall be under 2.5 seconds on standard broadband connections.
- **NFR-PERF-002:** PDF document generation shall complete within 3 seconds of user invocation.
- **NFR-PERF-003:** Global search RPC queries shall execute in under 300ms for database tables containing up to 100,000 records.

### 4.3 Availability & Maintainability
- **NFR-AVAIL-001:** System architecture must support 99.9% uptime when deployed to serverless infrastructure (Vercel + Supabase Managed Cloud).
- **NFR-MAINT-001:** Application code must compile without TypeScript errors (`npx tsc --noEmit`) and build cleanly via Next.js Turbopack (`npm run build`).
