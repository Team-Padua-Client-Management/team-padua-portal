# Team Padua Portal — Database Schema Reference

This reference documents the complete database schema implemented in Supabase PostgreSQL for the Team Padua Portal.

---

## 1. Identity, Profiles & Access Control

### `public.profiles`
Extends `auth.users` with application-specific user metadata.
- **`id`** `UUID` (PK, FK `auth.users.id` ON DELETE CASCADE)
- **`full_name`** `TEXT`
- **`email`** `TEXT`
- **`avatar_url`** `TEXT`
- **`role`** `TEXT` (Default: `'Member'`. Values: `'Admin'`, `'Advisor'`, `'Member'`, `'Bizdev'`)
- **`department`** `TEXT` (Default: `'General'`)
- **`client_servicing_permissions`** `JSONB` (Granular per-module permissions for non-admin/advisor users)
- **`display_order`** `INTEGER`
- **`last_seen`** `TIMESTAMPTZ`
- **`updated_at`** `TIMESTAMPTZ`

### `public.roles` & `public.team_members`
- `roles`: `id` (UUID PK), `name` (TEXT), `title` (TEXT)
- `team_members`: `id` (UUID PK), `name` (TEXT), `avatar` (TEXT), `progress` (INTEGER), `role_id` (UUID FK `roles.id`)

---

## 2. Team Productivity & Operations

### `public.attendance`
Daily time-in, break, and time-out tracking for agency members.
- **`id`** `UUID` (PK)
- **`user_id`** `UUID` (FK `auth.users.id`)
- **`attendance_date`** `DATE` (Unique with `user_id`)
- **`time_in`**, **`break_out`**, **`break_in`**, **`time_out`** `TEXT`
- **`total_hours`** `NUMERIC(4, 2)`
- **`daily_record`** `TEXT`
- **`admin_feedback`** `TEXT`
- **`status`** `TEXT` (Default `'Absent'`)

### `public.todo_tasks`
Personal to-do list items for individual users.
- **`id`** `UUID` (PK)
- **`user_id`** `UUID` (FK `profiles.id`)
- **`created_by`** `UUID` (FK `profiles.id`)
- **`title`** `TEXT`
- **`description`** `TEXT`
- **`completed`** `BOOLEAN`
- **`due_date`** `TIMESTAMPTZ`

### `public.client_servicing_tasks` / `public.tasks`
Collaborative operational tasks assigned across members.
- **`id`** `UUID` (PK)
- **`user_id`** `UUID` (FK `profiles.id`)
- **`title`** `TEXT`, **`client_name`** `TEXT`, **`service_type`** `TEXT`, **`notes`** `TEXT`
- **`category`** `TEXT`, **`status`** `TEXT`
- **`assigned_to`** `UUID` (FK `profiles.id`), **`processed_by`** `UUID` (FK `profiles.id`)
- **`completed`** `BOOLEAN`, **`service_request_number`** `TEXT`

### `public.calendar_events`
- **`id`** `UUID` (PK), **`title`** `TEXT`, **`description`** `TEXT`, **`event_date`** `DATE`, **`start_time`** `TIME`, **`location_name`** `TEXT`

---

## 3. Client Prospect Servicing Tracker (CPST CRM)

### `public.clients`
The central CRM registry of all client leads, prospects, and policyholders.
- **`id`** `TEXT` (PK)
- **`name`** `TEXT` (NOT NULL)
- **`client_code`** `TEXT`
- **`relationship`** `TEXT`
- **`birthdate`** `TEXT`
- **`policy_number`** `TEXT`
- **`product`** `TEXT`
- **`advisor`** `TEXT`
- **`annual_premium`** `NUMERIC`
- **`mobile_number`** `TEXT`, **`email`** `TEXT`, **`address`** `TEXT`
- **`status`** `TEXT` (`'Prospect'`, `'Lead'`, `'Serviced'`)
- **`notes`** / **`remarks`** `TEXT`

---

## 4. Servicing Request Tables

1. **`public.acr_requests`**: Advisor Change Requests (`policy_owner`, `policy_number`, `date_processed`, `progress_id`, `processed_by_id`, `comments`, `agent_confirmation`).
2. **`public.acr_progress` & `public.acr_processors`**: Lookup tables for ACR workflow status tags and assigned processors.
3. **`public.acr_files`**: Uploaded supporting documentation and signed PDFs (`request_id`, `file_name`, `file_path`, `file_size`, `mime_type`).
4. **`public.client_policy_cards`**: Status of digital basic, premium, and hard copy policy cards (`digital_basic_id`, `digital_premium_id`, `hard_copy_id`, `signature_data`).
5. **`public.premium_payments`**: Premium payment notifications, due date monitoring, and confirmation signatures.
6. **`public.fund_switching_requests`**: VUL fund switching allocation percentages and amounts (`from_fund`, `to_fund`, `amount`, `signature_data`).
7. **`public.fund_withdrawal_requests`**: Fund withdrawal requests and payout tracking (`amount`, `status`, `comments`).
8. **`public.beneficiary_change_requests`**: Beneficiary designations, updates, and shares.
9. **`public.auto_change_arrangements`**: Recurring payment method updates and address modifications.
10. **`public.reinstatement_sro_requests` & `public.reinstatement_pdi_requests`**: Lapsed policy reinstatement requests and premium default investigations.
11. **`public.social_visibility_records`**: Social media profiles (Facebook, Instagram, LinkedIn) and visibility audits for prospecting.
12. **`public.advisor_daily_activities`**: Daily advisor sales activities, calls, and meetings linked to clients.

---

## 5. Portal Management, Broadcast & Maintenance

1. **`public.maintenance_settings`**: Switchboard for per-module or full-system maintenance mode (`module_key`, `enabled`, `updated_at`).
2. **`public.announcements`**: Broadcast messages (`title`, `category`, `priority`, `audience`, `content`, `is_pinned`, `views`).
3. **`public.faqs`**: Frequently asked questions with helpfulness counter (`question`, `answer`, `category`, `helpful_count`, `not_helpful_count`, `tags`).
4. **`public.notifications`**: In-app notifications targeting specific users (`user_id`, `title`, `description`, `type`, `is_read`).
5. **`public.portal_categories` & `public.portal_resources`**: Categorized internal tools, links, portals, and materials.
