# Team Padua Portal

## Overview

The **Team Padua Portal** is a comprehensive internal management and client servicing system built for financial advisors and administrative staff. Its primary business purpose is to centralize and streamline operations—ranging from client prospect tracking to servicing requests, team communications, and task management. By unifying these workflows into a single application, the portal reduces manual tracking, improves response times for client requests, and provides admins with clear visibility into team performance and operational bottlenecks.

**Main Workflows:**
- **Client Servicing:** End-to-end tracking of client requests like Advisor Changes (ACR), Fund Switching (FST), Withdrawals (FWR), Beneficiary Changes (BCR), Address Changes (ACA), Reinstatements (SRO), Premium Due/Default (PDI), and Appointment of Advisors (ADA).
- **Productivity & Tracking:** Managing personal to-dos, team tasks, calendar events, and tracking user attendance.
- **Team Communication:** Broadcasting announcements, managing FAQs, internal messaging, and delivering real-time notifications.
- **AI Assistant:** Built-in chatbot powered by Google Generative AI and OpenAI for contextual assistance.

**Target Users:**
- **Admins / Operations:** Oversight of all client requests, task assignments, department/team management, reporting, and global maintenance settings.
- **Members / Advisors:** Submitting requests, managing personal clients, tracking daily tasks, and logging attendance.

---

## Features

### Authentication
- Secure Login & Signup
- Session Management via Supabase SSR
- Role-Based Access Control (RBAC) via Supabase Profiles
- Route Protection (Middleware-based)

### Dashboard
- **Admin Dashboard:** Global overview of pending requests, team tasks, announcements, and system maintenance toggles.
- **User Dashboard:** Personalized view of assigned tasks, to-do items, recent notifications, and quick links.
- **Client Servicing Monitoring (CSMV):** Consolidated widget for tracking ACR, BCR, FST, and other request statuses across all modules.
- **Calendar of Activities:** Upcoming scheduled events and locations.
- **Personal To-Do:** Private user-specific task management.
- **Client Birthdays:** Notifications and reminders for client milestones (derived from CPST data).

### Client Servicing
- **CPST:** Client Prospect Servicing Tracker (Client CRM)
- **CSMV:** Client Servicing Monitoring View — unified dashboard across all request types
- **ACR:** Advisor Change Request
- **BCR (CPC):** Beneficiary Change Request
- **FST (FSR):** Fund Switching Request
- **FWR (MNGT):** Fund Withdrawal Request
- **ACA (PPU):** Address Change / Policy Update
- **ADA (ADAT):** Appointment of Advisor / Advisor Designation
- **SRO:** Reinstatement Requests
- **PDI:** Premium Due/Default Tracking
- **PDF Generation:** Automated PDF document generation for ACR, BCR, FST, and other request types using `jsPDF` and template-based engines.
- **Form Engine:** Configurable form system with standard form layouts (`AcrStandardForm`, `BcrStandardForm`) driven by config objects.

### Communication
- **Messaging:** Internal user communication system.
- **Notifications:** Read/Unread global and personalized alerts.
- **Announcements:** Broadcasted updates with priority levels and audience targeting.
- **FAQ:** Categorized knowledge base with helpfulness ratings.

### Productivity
- **Activity Tracker (Attendance):** Time-in, Time-out, and daily record logging.
- **Calendar:** Organization-wide events scheduling.
- **Tasks (Client Servicing):** Shared tracking of operations tasks (`client_servicing_tasks`).
- **To-Do System:** Personal checklist (`todo_tasks`).

### AI & Chatbot
- **AI Chatbot (CGPT):** Built-in conversational assistant powered by Google Generative AI (`@google/generative-ai`) and OpenAI.
- **Playground:** Experimental feature sandbox for testing new capabilities.

### Administration
- **Department Management:** Organizational structure and department configuration.
- **Team Management:** Team creation, member assignment, and hierarchy.
- **User Management:** Admin controls for user accounts and roles.
- **Reports:** Operational and performance reporting dashboards.
- **Portal Resources:** Curated external links and tools organized by category.
- **Settings:** System-wide configuration and preferences.
- **Profile Management:** User profile editing and customization.

---

## System Architecture

The application is built on a modern serverless stack leveraging React Server Components and Edge functions.

```text
Browser / Client
       │
       ▼
Next.js 16 (App Router)
       │
       ├─ Middleware (Auth, RBAC, Maintenance Checks)
       │
       ▼
Server Components & Server Actions (Data Fetching / Mutations)
       │
       ▼
Supabase (PostgreSQL)
       │
       ├─ Auth (Users & Sessions)
       ├─ Row Level Security (RLS)
       ├─ Realtime Channels
       └─ RPC (Search Functions)
```

---

## Tech Stack

| Technology              | Purpose                      | Version   |
| ----------------------- | ---------------------------- | --------- |
| Next.js                 | Frontend & Backend           | 16.2.9    |
| React                   | UI Framework                 | 19.2.4    |
| TypeScript              | Type Safety                  | ^5.x      |
| Supabase JS             | Database & Auth Client       | ^2.108.2  |
| Supabase SSR            | Server-side Auth             | ^0.12.0   |
| PostgreSQL              | Data Storage                 | Native    |
| Tailwind CSS            | Styling                      | ^4.x      |
| Radix UI                | Headless Components          | ^1.6.0    |
| Shadcn UI               | Component Library            | ^4.11.0   |
| Framer Motion           | Animations                   | ^12.41.0  |
| Lucide React            | Icons                        | ^1.21.0   |
| HugeIcons               | Extended Icon Set            | ^4.2.1    |
| Resend                  | Email Service                | ^6.16.0   |
| Google Generative AI    | AI Chatbot                   | ^0.24.1   |
| OpenAI                  | AI Chatbot                   | ^6.44.0   |
| jsPDF / jsPDF-AutoTable | PDF Generation               | ^4.2.1    |
| pdf-lib                 | PDF Manipulation             | ^1.17.1   |
| pdfjs-dist              | PDF Viewing                  | ^6.1.200  |
| xlsx / xlsx-populate    | Excel Import/Export          | ^0.18.5   |
| Mammoth                 | DOCX to HTML Conversion      | ^1.12.0   |
| React Signature Canvas  | Digital Signatures           | ^1.1.0    |
| React Easy Crop         | Image Cropping               | ^6.0.2    |
| React Markdown          | Markdown Rendering           | ^10.1.0   |

---

## Folder Structure

```text
project-root/
├── app/                           # Next.js App Router root
│   ├── (admin)/admin/             # Admin-only routes and dashboards
│   │   ├── (ClientServicing)/     # Client servicing request routes
│   │   │   ├── aca/               # Address Change requests
│   │   │   ├── acr/               # Advisor Change requests
│   │   │   ├── ada/               # Advisor Designation
│   │   │   ├── adat/              # Advisor Designation (alternate)
│   │   │   ├── bcr/               # Beneficiary Change requests
│   │   │   ├── cgpt/              # AI Chatbot interface
│   │   │   ├── cpc/               # CPC records
│   │   │   ├── cpst/              # Client Prospect Tracker
│   │   │   ├── csmv/              # Client Servicing Monitoring View
│   │   │   ├── cv/                # Client View
│   │   │   ├── form/              # Dynamic form pages
│   │   │   ├── fst/               # Fund Switching
│   │   │   ├── fund-switching/    # Fund Switching (alternate)
│   │   │   ├── fund-withdrawal/   # Fund Withdrawal
│   │   │   ├── jf-application/    # JF Application
│   │   │   ├── jf-bizdev/         # JF Business Development
│   │   │   ├── mngt/              # Fund Withdrawal (MNGT)
│   │   │   ├── pptm/              # PPTM records
│   │   │   ├── ppu/               # Policy Update / Address Change
│   │   │   ├── reinstatement-pdi/ # PDI Reinstatement
│   │   │   └── reinstatement-sro/ # SRO Reinstatement
│   │   ├── announcements/         # Announcement management
│   │   ├── attendance/            # Attendance tracking
│   │   ├── calendar/              # Calendar management
│   │   ├── chatbot/               # AI Chatbot
│   │   ├── dashboard/             # Admin dashboard
│   │   ├── departments/           # Department management
│   │   ├── Design/                # Design resources
│   │   ├── faq/                   # FAQ management
│   │   ├── members/               # Member management
│   │   ├── messages/              # Internal messaging
│   │   ├── portals/               # Portal resource management
│   │   ├── profile/               # Profile management
│   │   ├── reports/               # Reporting dashboards
│   │   ├── settings/              # System settings
│   │   ├── teams/                 # Team management
│   │   └── users/                 # User management
│   ├── (user)/                    # Standard user routes
│   │   ├── attendance/            # Personal attendance
│   │   ├── calendar/              # Calendar view
│   │   ├── dashboard/             # User dashboard
│   │   ├── faq/                   # FAQ browsing
│   │   ├── messages/              # Messaging
│   │   ├── playground/            # Feature playground
│   │   ├── portals/               # Portal resources
│   │   ├── profile/               # User profile
│   │   ├── settings/              # User settings
│   │   ├── teams/                 # Team view
│   │   └── users/                 # User directory
│   ├── api/                       # API route handlers
│   │   ├── acr/                   # ACR API
│   │   ├── admin/                 # Admin aggregation API
│   │   ├── chatbot/               # AI Chatbot API
│   │   ├── clients/               # Clients API
│   │   ├── cpc/                   # CPC API
│   │   ├── debug-db/              # Database debug API
│   │   ├── fst/                   # FST API
│   │   ├── import/                # Data import API
│   │   ├── landing-stats/         # Landing page statistics API
│   │   ├── mngt/                  # MNGT API
│   │   ├── portals/               # Portals API
│   │   ├── ppu/                   # PPU API
│   │   └── send-email/            # Email sending API (Resend)
│   ├── auth/                      # Authentication pages
│   ├── action/                    # Server action routes
│   ├── maintenance/               # Maintenance fallback pages
│   ├── privacy/                   # Privacy policy page
│   ├── terms/                     # Terms of service page
│   └── lib/                       # App-level utilities
├── src/                           # Source code for features and UI
│   ├── components/                # Global shared components (Shadcn UI, Radix UI)
│   ├── constants/                 # System-wide static variables
│   ├── features/                  # Domain-driven feature modules
│   │   ├── attendance/            # Attendance feature logic
│   │   ├── calendar/              # Calendar feature logic
│   │   ├── chatbot/               # AI Chatbot feature logic
│   │   ├── client-servicing/      # Client servicing engines & configs
│   │   │   ├── aca-engine/        # Address Change engine
│   │   │   ├── acr-engine/        # Advisor Change engine & form
│   │   │   ├── ada-engine/        # Advisor Designation engine
│   │   │   ├── bcr-engine/        # Beneficiary Change engine & form
│   │   │   ├── config/            # Shared form configurations
│   │   │   ├── cpst/              # Client Prospect Tracker logic
│   │   │   ├── csmv/              # Client Servicing Monitoring View
│   │   │   ├── fund-switching-engine/  # Fund Switching engine
│   │   │   ├── fund-withdrawal-engine/ # Fund Withdrawal engine
│   │   │   ├── pdf/               # PDF generation templates
│   │   │   ├── pdf-engine/        # PDF viewer engine (PdfViewerEngine)
│   │   │   ├── pdi-engine/        # Premium Due/Default engine
│   │   │   └── sro-engine/        # Reinstatement engine
│   │   ├── clients/               # Client data management
│   │   ├── dashboard/             # Dashboard components, hooks, utils
│   │   ├── landing/               # Landing page feature
│   │   ├── messages/              # Messaging feature
│   │   ├── playground/            # Experimental features
│   │   ├── portals/               # Portal resources feature
│   │   └── users/                 # User management feature
│   ├── lib/                       # Core utilities (search, auth wrappers)
│   ├── middleware.ts              # Auth & route protection middleware
│   └── types/                     # TypeScript database and application types
├── supabase/                      # Database schemas, migrations, and RPC functions
│   ├── migrations/                # SQL scripts for database schema setup
│   ├── supabase_schema.sql        # Full database schema definition
│   └── maintenance_migration.sql  # Maintenance settings migration
├── public/                        # Static assets (images, fonts, icons)
├── styles/                        # Global CSS and Tailwind configurations
└── scripts/                       # Build and utility scripts
```

---

## Database Schema

| Table Name               | Purpose                                           | Primary Key | Relationships & Foreign Keys            |
| ------------------------ | ------------------------------------------------- | ----------- | --------------------------------------- |
| `profiles`               | Extended user data mapped to Auth                 | `id` (UUID) | `REFERENCES auth.users(id)`            |
| `attendance`             | User time-in/out and daily records                | `id` (UUID) | `user_id REFERENCES auth.users(id)`    |
| `clients`                | CPST records (Client Prospects)                   | `id` (TEXT) | N/A                                     |
| `announcements`          | Broadcasted news and updates                      | `id` (UUID) | N/A                                     |
| `faqs`                   | Help center questions and answers                 | `id` (UUID) | N/A                                     |
| `notifications`          | System and user alerts                            | `id` (UUID) | `user_id REFERENCES auth.users(id)`    |
| `acr_requests`           | Advisor Change Requests                           | `id` (UUID) | `progress_id`, `processed_by_id`       |
| `acr_files`              | Attached documents for ACR                        | `id` (UUID) | `request_id REFERENCES acr_requests(id)` |
| `cpc_records`            | Beneficiary Change Requests (BCR)                 | `id` (UUID) | N/A                                     |
| `fst_requests`           | Fund Switching Requests                           | `id` (UUID) | N/A                                     |
| `mngt_records`           | Fund Withdrawal Requests (FWR)                    | `id` (UUID) | N/A                                     |
| `ppu_records`            | Address Change / Policy Updates (ACA)             | `id` (UUID) | N/A                                     |
| `calendar_events`        | Organizational activities and events              | `id` (UUID) | N/A                                     |
| `portal_categories`      | Categorization for portal resources               | `id` (UUID) | N/A                                     |
| `portal_resources`       | Reusable external links and portal tools          | `id` (UUID) | `category_id REFERENCES portal_categories(id)` |
| `maintenance_settings`   | Global module toggle states                       | `id` (UUID) | N/A                                     |
| `client_servicing_tasks` | Shared tasks related to client requests           | `id` (UUID) | N/A                                     |
| `todo_tasks`             | Personal user checklists                          | `id` (UUID) | N/A                                     |

---

## Authentication & Authorization

- **Login Flow:** Users authenticate via Supabase Auth (Email/Password or OAuth). Upon creation, a trigger automatically provisions a `profiles` record.
- **Session Management:** Supabase SSR (`@supabase/ssr`) handles session cookies across the Next.js App Router environment.
- **Role-Based Access Control (RBAC):**
  - `profiles.role` dictates access permissions (`Admin` vs `Member`).
- **Middleware Protection:** The `middleware.ts` intercepts all requests (except static assets), delegating to `@src/lib/middleware` for session validation. Unauthenticated users are redirected to `/auth/login` and standard users cannot access admin paths.

---

## API Documentation

| Route                | Method   | Description                                    | Auth Required |
| -------------------- | -------- | ---------------------------------------------- | ------------- |
| `/api/acr`           | GET/POST | Manages Advisor Change Requests                | Yes           |
| `/api/admin`         | GET/POST | Admin-level data aggregations and controls     | Yes (Admin)   |
| `/api/chatbot`       | POST     | Handles AI/Chatbot interactions                | Yes           |
| `/api/clients`       | GET/POST | CPST Client directory and prospect operations  | Yes           |
| `/api/cpc`           | GET/POST | Beneficiary Change Requests (BCR)              | Yes           |
| `/api/fst`           | GET/POST | Fund Switching Requests                        | Yes           |
| `/api/mngt`          | GET/POST | Fund Withdrawal Requests                       | Yes           |
| `/api/ppu`           | GET/POST | Address Change Requests (ACA)                  | Yes           |
| `/api/send-email`    | POST     | Trigger transactional emails (Resend)          | Yes           |
| `/api/portals`       | GET      | Retrieves active portal links and categories   | Yes           |
| `/api/import`        | POST     | Bulk data import (Excel/CSV)                   | Yes (Admin)   |
| `/api/landing-stats` | GET      | Public landing page statistics                 | No            |
| `/api/debug-db`      | GET      | Database debugging and diagnostics             | Yes (Admin)   |

---

## Dashboard Modules

### Admin Dashboard
- **Widgets:** Active system announcements, team attendance overview, maintenance module toggles, pending requests summary.
- **Statistics:** Global counts for CPST, ACR, BCR, FST, FWR, ACA, ADA, SRO, PDI, and more.
- **Monitoring Features:** Real-time visibility into all staff activity and client servicing request states via CSMV.
- **Event Details:** Modal-based event detail viewer for calendar activities.

### User Dashboard
- **Widgets:** Personal To-Do list, upcoming calendar activities, unread notifications.
- **Personal Features:** Quick actions for submitting new requests, logging attendance, and viewing assigned tasks.

---

## Client Servicing Module

This domain acts as the core CRM and ticketing system:
- **CPST:** Base registry tracking leads, prospects, and serviced clients.
- **CSMV:** Client Servicing Monitoring View — unified dashboard for tracking all request types at a glance.
- **Request Modules:**
  - **ACR** — Advisor Change Request
  - **BCR (CPC)** — Beneficiary Change Request
  - **FST** — Fund Switching Request
  - **FWR (MNGT)** — Fund Withdrawal Request
  - **ACA (PPU)** — Address Change / Policy Update
  - **ADA (ADAT)** — Appointment / Designation of Advisor
  - **SRO** — Reinstatement Request
  - **PDI** — Premium Due/Default Tracking
  - **JF Application** — JF Application processing
  - **JF BizDev** — JF Business Development tracking
  - **PPTM** — PPTM records
- **Form Engines:** Configurable form components (`AcrStandardForm`, `BcrStandardForm`) driven by JSON config objects for consistent form layouts.
- **PDF Generation:** Automated document generation for ACR, BCR, FST, and other request types with template-based engines.
- **PDF Viewer:** Built-in PDF viewer engine (`PdfViewerEngine`) for previewing generated documents.
- **Relationships:** Most requests are loosely coupled to the CPST registry via `client_name` or policy references, enabling flexible data entry while maintaining searchability.

---

## Notification System

- **Notifications Table:** Stores `title`, `description`, `type`, and `is_read` status.
- **Flow:** When a request is updated or a task is assigned, a record is inserted into `public.notifications` tied to a specific `user_id` (or globally if NULL). The UI queries this table and displays real-time badges for unread alerts.
- **Read/Unread Status:** Handled via the `is_read` boolean, which updates when a user acknowledges the notification in the UI.

---

## Search System

- **`search_admin(query)`:** A custom PostgreSQL RPC function deployed to Supabase.
- **Architecture:** It takes a text query and performs a `UNION ALL` across multiple tables (`clients`, `acr_requests`, `cpc_records`, `fst_requests`, `mngt_records`, `ppu_records`, `calendar_events`, `client_servicing_tasks`, `todo_tasks`).
- **Search Coverage:** Returns a normalized schema (`id`, `label`, `subtitle`, `type`, `href`) to render a unified search results dropdown in the Next.js frontend.

---

## To-Do & Task System

- **`todo_tasks`:** Private, user-specific checklist items. Used for day-to-day personal organization.
- **`client_servicing_tasks`:** Shared, operational tasks tied directly to client servicing workflows. Visible to admins and assignees for collaborative tracking.
- **Usage:** Users manage their own `todo_tasks` via their dashboard, while `client_servicing_tasks` are often generated or assigned during the lifecycle of an ACR, BCR, or FST request.

---

## Calendar System

- **Calendar Events:** Stored in `calendar_events` with `title`, `date`, `time`, and `location`.
- **Activity Tracker:** Syncs with the user's dashboard to display upcoming organizational activities.
- **Calendar of Activities:** Admin-controlled global calendar visible to all authenticated members for tracking company-wide events and deadlines.
- **Event Details Modal:** Detailed view for individual events with full context and metadata.

---

## Environment Variables

| Variable                               | Description                                         |
| -------------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase Project URL                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`        | Supabase Public Anonymous Key                       |
| `SUPABASE_SERVICE_ROLE_KEY`            | Supabase Admin Key (Server-side ONLY)               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable key for integrations             |
| `NEXT_PUBLIC_SITE_URL`                 | Base URL for absolute links (e.g. auth redirects)   |
| `RESEND_API_KEY`                       | API Key for sending emails via Resend               |
| `EMAIL_FROM`                           | Default sender address for transactional emails     |

*(Note: Never commit actual secrets to version control. Use `.env.local` for development.)*

---

## Installation

### Clone
```bash
git clone <repository>
cd project
```

### Install
```bash
npm install
```

### Environment
Create a `.env.local` file at the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=your_resend_key
EMAIL_FROM=onboarding@resend.dev
```

### Run Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Production
```bash
npm start
```

---

## Deployment

- **Vercel Deployment:** The application is optimized for Vercel. Connect the GitHub repository and Vercel will automatically detect the Next.js framework.
- **Supabase Configuration:** Ensure all migrations in `supabase/migrations` are applied to the production database and that RLS policies are strictly enforced.
- **Environment Variables:** Add all production keys from the `.env` section into the Vercel project settings.
- **Production Setup:** Set `NEXT_PUBLIC_SITE_URL` to your production domain to ensure Auth redirects resolve correctly.

---

## Security

- **RLS Policies:** All Supabase tables enforce Row Level Security. Users can generally only `SELECT`, `INSERT`, or `UPDATE` records where `auth.uid() = user_id`, while Admins (via Service Role or specific claims) have broader access.
- **Middleware Protection:** Next.js `middleware.ts` validates the Supabase session on every request to protected routes.
- **Authentication Flow:** Passwords and OTPs are managed entirely by Supabase Auth, preventing direct credential exposure.
- **Authorization Rules:** Handled contextually in Server Actions and API Routes by verifying the `profiles.role` before executing mutations.

---

## Known Issues

- **Maintenance Module Inconsistencies:** The `maintenance_settings` table contains seeds for `reinstatement`, `sro`, and `pdi`, but routing patterns for these features may overlap or be incomplete depending on active deployments.

---

## Future Improvements

- **Foreign Key Relationships:** Transition loose text-based `client_name` references in servicing tables (ACR, BCR, FST) to strict UUID foreign keys referencing `clients.id` for better data integrity.
- **Consolidated Task Engine:** Merge `todo_tasks` and `client_servicing_tasks` into a unified task schema with polymorphic relations to reduce UI redundancy.
- **Realtime Optimizations:** Expand Supabase Realtime subscriptions beyond `maintenance_settings` to include live UI updates for `notifications` and `messages`.

---

## License

MIT License. See the `LICENSE` file for details.

---

## Contributors

- **Team Padua Engineering** — *Initial Work & Architecture*
