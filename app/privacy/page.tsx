import React from 'react';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Team Padua Advisor Portal',
  description: 'Privacy Policy and data protection terms for the Team Padua Advisor Client Servicing Platform.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#FFC72C]/30">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-3">
            <Image src="/Image/icon/TPC.png" alt="Team Padua Logo" width={32} height={32} className="object-contain" priority />
            <span className="text-sm font-semibold tracking-wider text-slate-900">TEAMPADUA</span>
          </a>
          <a href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft size={14} /> Back to Landing
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3 text-[#A3843B]">
            <ShieldCheck size={28} />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Privacy Policy</h1>
          </div>
          <p className="mt-2 text-xs text-slate-500">Last updated: July 14, 2026</p>

          <div className="mt-8 border-t border-slate-100 pt-8 space-y-8 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">1. Overview & Scope</h2>
              <p className="mt-2">
                This Privacy Policy describes how the Team Padua Advisor Portal collects, uses, and safeguards information when authorized Sun Life Financial Advisors and personnel access our Client Servicing Platform.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">2. Database Synchronization & Security</h2>
              <p className="mt-2">
                We operate under strict database rules. All active client records, policy listings, premium monitoring logs, and related information are stored securely in Supabase using PostgreSQL Row Level Security (RLS). No external placeholder statistics or third-party tracking cookies are deployed without explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">3. Information We Collect</h2>
              <p className="mt-2">
                To facilitate advisor workflows, client servicing, and administration, we process:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1 pl-2">
                <li>Advisor credentials (names, emails, active logins, roles)</li>
                <li>Client and prospect profiles (names, birthdates, contact info, policy details)</li>
                <li>Request logs (ACR, BCR, Fund Switching, Premium Payments)</li>
                <li>Uploaded documents (IDs, forms, signed PDFs)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">4. Third-Party Integrations</h2>
              <p className="mt-2">
                The portal integrates securely with external resource links (e.g. Canva, Microsoft Teams, Zoom, JotForm, and Sun Life Advisor Office) to streamline advisor productivity. We do not transmit client PII (Personally Identifiable Information) to these services unless explicitly initiated by the servicing advisor via approved forms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">5. Access & Deletion</h2>
              <p className="mt-2">
                Authorized users may view, edit, or delete client records according to regulatory compliance. Action logs and activity histories are permanently recorded in the database audit timeline.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">6. Inquiries</h2>
              <p className="mt-2">
                If you have questions regarding data privacy or security measures, please consult the Lead System Developer or administrator.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 TeamPadua. Built exclusively for authorized Sun Life advisors.</p>
      </footer>
    </div>
  );
}
