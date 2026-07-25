# Team Padua Client Management Portal

> A centralized, production-grade client management platform designed to streamline operations, task management, attendance monitoring, and team collaboration.

![Build Status](https://img.shields.io/badge/build-passing-success)
![License](https://img.shields.io/badge/license-Proprietary-blue)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Architecture & Modules](#architecture--modules)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact & Maintainers](#contact--maintainers)

## Features

- **Role-Based Portals:** Dedicated access and dashboards for both administrators and general users.
- **Client Management:** Centralized hub for tracking client records, statuses, and service histories.
- **Task & Workflow Tracking:** Assign, monitor, and complete tasks seamlessly across the team.
- **Attendance & Calendar:** Integrated calendar and attendance monitoring system.
- **Communication & Notifications:** Built-in messaging, chatbot functionality, and automated email notifications.
- **Secure Authentication:** Powered by Supabase Auth with granular Row Level Security (RLS).

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, v16)
- **UI Library:** [React](https://react.dev/) (v19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4) & [shadcn/ui](https://ui.shadcn.com/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Email Service:** [Resend](https://resend.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Icons:** [Lucide React](https://lucide.dev/) & [Hugeicons](https://hugeicons.com/)

## Project Structure

```text
team-padua-portal/
├── app/
│   ├── (admin)/        # Administrator portal routes and dashboards
│   ├── (user)/         # End-user portal routes (attendance, calendar, profile)
│   ├── api/            # Next.js serverless API routes
│   └── auth/           # Authentication pages (login, register)
├── src/
│   ├── components/     # Reusable UI components (shadcn/ui, layout elements)
│   ├── features/       # Feature-based modular logic (clients, dashboard, tasks)
│   ├── lib/            # Utility functions and shared helpers
│   ├── constants/      # Global constants and configuration values
│   └── types/          # Global TypeScript type definitions
├── supabase/           # Supabase migrations and database configuration
├── public/             # Static assets (images, icons)
└── .env                # Environment variable configuration
```

## Prerequisites

- **Node.js:** v20 or higher
- **Package Manager:** npm
- **Database:** A [Supabase](https://supabase.com/) project
- **Email:** A [Resend](https://resend.com/) account (for email functionalities)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Team-Padua-Client-Management/team-padua-portal.git
   cd team-padua-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root of your project based on the required variables below.

## Environment Variables

The application requires the following environment variables. **Never commit actual values to version control.**

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous API key | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for secure server-side operations | Yes |
| `NEXT_PUBLIC_SITE_URL` | Base URL of the application (e.g., `http://localhost:3000`) | Yes |
| `RESEND_API_KEY` | API key for the Resend email service | Yes |
| `EMAIL_FROM` | Verified sender email address for Resend | Yes |

## Running Locally

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Architecture & Modules

The project is structured around standard Next.js App Router conventions with a feature-driven design approach:

- **`app/(admin)` & `app/(user)`:** Route groups separating the core portals. Each contains its own `layout.tsx` for distinct navigation, layouts, and access controls.
- **`app/api/`:** Serverless functions handling webhooks, integrations, and server-side operations that require the Service Role key.
- **`src/features/`:** Encapsulates complex logic by domain (e.g., `attendance`, `calendar`, `client-servicing`, `dashboard`). This keeps the Next.js routing layer thin and scalable.
- **`src/components/`:** Contains atomic UI elements, primarily driven by `shadcn/ui` and styled with Tailwind CSS v4.
- **`src/lib/`:** Houses Supabase client configurations, global utilities, and third-party wrappers.

## Deployment

This project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to a GitHub repository.
2. Import the project into Vercel.
3. Add the [Environment Variables](#environment-variables) in the Vercel project settings.
4. Deploy!

*Note: Ensure your Supabase instance is configured to accept requests from your production Vercel domain, and adjust your Auth Redirect URIs accordingly in the Supabase Dashboard.*

## Contributing

We welcome contributions to improve the project. Please adhere to the following workflow:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## License

This project is proprietary and developed specifically for Team Padua. Unauthorized redistribution or commercial use without permission may be restricted according to the project owner's policies.

## Contact & Maintainers

For questions, support, or access requests, please reach out to the project maintainers via the internal communications portal.