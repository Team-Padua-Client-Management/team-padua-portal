# Team Padua Portal

## Overview

The **Team Padua Portal** is a comprehensive internal management and client servicing system built for financial advisors and administrative staff. Its primary business purpose is to centralize and streamline operations—ranging from client prospect tracking to servicing requests, team communications, and task management. By unifying these workflows into a single application, the portal reduces manual tracking, improves response times for client requests, and provides admins with clear visibility into team performance and operational bottlenecks. 

**Main Workflows:**
- **Client Servicing:** End-to-end tracking of client requests like Advisor Changes (ACR), Fund Switching (FST), and Withdrawals (FWR).
- **Productivity & Tracking:** Managing personal to-dos, team tasks, calendar events, and tracking user attendance.
- **Team Communication:** Broadcasting announcements, managing FAQs, and delivering real-time notifications.

**Target Users:**
- **Admins / Operations:** Oversight of all client requests, task assignments, and global maintenance settings.
- **Members / Advisors:** Submitting requests, managing personal clients, tracking daily tasks, and logging attendance.

---

## Features

### Authentication
- Secure Login & Signup
- Session Management
- Role-Based Access Control (RBAC) via Supabase Profiles
- Route Protection (Middleware-based)

### Dashboard
- **Admin Dashboard:** Global overview of pending requests, team tasks, announcements, and system maintenance toggles.
- **User Dashboard:** Personalized view of assigned tasks, to-do items, recent notifications, and quick links.
- **Client Servicing Monitoring:** Consolidated widget for tracking ACR, BCR, FST, and other request statuses.
- **Calendar of Activities:** Upcoming scheduled events and locations.
- **Personal To-Do:** Private user-specific task management.
- **Client Birthdays:** Notifications and reminders for client milestones (derived from CPST data).

### Client Servicing
- **CPST:** Client Prospect Servicing Tracker (Client CRM)
- **ACR:** Advisor Change Request
- **BCR (CPC):** Beneficiary Change Request
- **FST (FSR):** Fund Switching Request
- **FWR (MNGT):** Fund Withdrawal Request
- **ACA (PPU):** Address Change / Policy Update
- **SRO:** Reinstatement Requests
- **PDI:** Premium Due/Default Tracking

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

---

## System Architecture

The application is built on a modern serverless stack leveraging React Server Components and Edge functions. 

```text
Browser / Client
       │
       ▼
Next.js (App Router)
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

| Technology   | Purpose            | Version |
| ------------ | ------------------ | ------- |
| Next.js      | Frontend & Backend | 16.2.9  |
| TypeScript   | Type Safety        | ^5.x    |
| Supabase     | Database & Auth    | ^2.108.2|
| PostgreSQL   | Data Storage       | Native  |
| Tailwind CSS | Styling            | ^4.x    |
| Shadcn UI    | Components         | ^4.11.0 |
| Resend       | Email Service      | ^6.16.0 |

---

## Folder Structure

```text
project-root/
├── app/                  # Next.js App Router root
│   ├── (admin)/          # Admin-only routes and dashboards
│   ├── (user)/           # Standard user routes
│   ├── api/              # API endpoints for integrations/emails
│   ├── auth/             # Authentication pages (login, callback)
│   ├── maintenance/      # Maintenance fallback pages
│   └── lib/              # App-level utilities
├── src/                  # Source code for features and UI
│   ├── components/       # Global shared components (Shadcn UI)
│   ├── constants/        # System-wide static variables
│   ├── features/         # Domain-driven feature modules (dashboard, messages, etc.)
│   ├── lib/              # Core utilities (search, auth wrappers)
│   └── types/            # TypeScript database and application types
├── supabase/             # Database schemas, migrations, and RPC functions
│   └── migrations/       # SQL scripts for database schema setup
├── public/               # Static assets (images, fonts, icons)
├── styles/               # Global CSS and Tailwind configurations
└── scripts/              # Build and utility scripts
```

---

## Database Schema

| Table Name             | Purpose                                           | Primary Key | Relationships & Foreign Keys |
| ---------------------- | ------------------------------------------------- | ----------- | ---------------------------- |
| `profiles`             | Extended user data mapped to Auth                 | `id` (UUID) | `REFERENCES auth.users(id)` |
| `attendance`           | User time-in/out and daily records                | `id` (UUID) | `user_id REFERENCES auth.users(id)` |
| `clients`              | CPST records (Client Prospects)                   | `id` (TEXT) | N/A |
| `announcements`        | Broadcasted news and updates                      | `id` (UUID) | N/A |
| `faqs`                 | Help center questions and answers                 | `id` (UUID) | N/A |
| `notifications`        | System and user alerts                            | `id` (UUID) | `user_id REFERENCES auth.users(id)` |
| `acr_requests`         | Advisor Change Requests                           | `id` (UUID) | `progress_id`, `processed_by_id` |
| `acr_files`            | Attached documents for ACR                        | `id` (UUID) | `request_id REFERENCES acr_requests(id)` |
| `cpc_records`          | Beneficiary Change Requests (BCR)                 | `id` (UUID) | N/A |
| `fst_requests`         | Fund Switching Requests                           | `id` (UUID) | N/A |
| `mngt_records`         | Fund Withdrawal Requests (FWR)                    | `id` (UUID) | N/A |
| `ppu_records`          | Address Change / Policy Updates (ACA)             | `id` (UUID) | N/A |
| `calendar_events`      | Organizational activities and events              | `id` (UUID) | N/A |
| `portal_categories`    | Categorization for portal resources               | `id` (UUID) | N/A |
| `portal_resources`     | Reusable external links and portal tools          | `id` (UUID) | `category_id REFERENCES portal_categories(id)` |
| `maintenance_settings` | Global module toggle states                       | `id` (UUID) | N/A |
| `client_servicing_tasks`| Shared tasks related to client requests          | `id` (UUID) | N/A |
| `todo_tasks`           | Personal user checklists                          | `id` (UUID) | N/A |

---

## Authentication & Authorization

- **Login Flow:** Users authenticate via Supabase Auth (Email/Password or OAuth). Upon creation, a trigger automatically provisions a `profiles` record.
- **Session Management:** Supabase SSR handles session cookies across the Next.js App Router environment.
- **Role-Based Access Control (RBAC):** 
  - `profiles.role` dictates access permissions (`Admin` vs `Member`).
- **Middleware Protection:** The `middleware.ts` intercepts requests to `/(admin)` and `/(user)` routes, ensuring that unauthenticated users are redirected to `/auth/login` and standard users cannot access admin paths.

---

## API Documentation

| Route                 | Method | Description                                    | Auth Required |
| --------------------- | ------ | ---------------------------------------------- | ------------- |
| `/api/acr`            | GET/POST| Manages Advisor Change Requests               | Yes           |
| `/api/admin`          | GET/POST| Admin-level data aggregations and controls    | Yes (Admin)   |
| `/api/chatbot`        | POST   | Handles AI/Chatbot interactions                | Yes           |
| `/api/clients`        | GET/POST| CPST Client directory and prospect operations | Yes           |
| `/api/cpc`            | GET/POST| Beneficiary Change Requests (BCR)             | Yes           |
| `/api/fst`            | GET/POST| Fund Switching Requests                       | Yes           |
| `/api/mngt`           | GET/POST| Fund Withdrawal Requests                      | Yes           |
| `/api/ppu`            | GET/POST| Address Change Requests (ACA)                 | Yes           |
| `/api/send-email`     | POST   | Trigger transactional emails (Resend)          | Yes           |
| `/api/portals`        | GET    | Retrieves active portal links and categories   | Yes           |

---

## Dashboard Modules

### Admin Dashboard
- **Widgets:** Active system announcements, team attendance overview, maintenance module toggles, pending requests summary.
- **Statistics:** Global counts for CPST, ACR, FST, etc.
- **Monitoring Features:** Real-time visibility into all staff activity and client servicing request states.

### User Dashboard
- **Widgets:** Personal To-Do list, upcoming calendar activities, unread notifications.
- **Personal Features:** Quick actions for submitting new requests, logging attendance, and viewing assigned tasks.

---

## Client Servicing Module

This domain acts as the core CRM and ticketing system:
- **CPST:** Base registry tracking leads, prospects, and serviced clients.
- **Client Registry:** Central repository of client details (`clients` table).
- **Request Modules:** ACR (Advisor Change), BCR (Beneficiary), FST (Fund Switch), FWR (Withdrawal), ACA (Address Change), SRO (Reinstatement), PDI (Premium Due).
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

- **Team Padua Engineering** - *Initial Work & Architecture*
