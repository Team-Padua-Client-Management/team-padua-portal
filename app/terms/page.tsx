import React from 'react';
import Image from 'next/image';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Team Padua Advisor Portal',
  description: 'Terms of Service for accessing and using the Team Padua Advisor Client Servicing Platform.',
};

export default function TermsOfService() {
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
            <FileText size={28} />
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
          </div>
          <p className="mt-2 text-xs text-slate-500">Last updated: July 14, 2026</p>

          <div className="mt-8 border-t border-slate-100 pt-8 space-y-8 text-sm leading-7 text-slate-600">
            <section>
              <h2 className="text-lg font-semibold text-slate-900">1. Acceptance of Terms</h2>
              <p className="mt-2">
                By logging into and utilizing the Team Padua Advisor Client Servicing Platform, you acknowledge that you are an authorized Sun Life Financial Advisor or authorized member of Team Padua, and agree to comply with these terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">2. Permitted Use</h2>
              <p className="mt-2">
                This portal is exclusively designed for managing client policy services, premium updates, adviser request management, and client relationships. Any unauthorized data extraction, sharing of advisor accounts, or use of platform tools for non-Sun Life business is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">3. Integrity of Database Records</h2>
              <p className="mt-2">
                All records, notifications, counts, and client policy listings within this application represent live information derived directly from the Supabase database. Creating fake profiles, entering false policy IDs, or using temporary/placeholder names violates portal integrity rules and may result in immediate access revocation.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">4. Document Management & Compliance</h2>
              <p className="mt-2">
                Advisors are responsible for validating the accuracy and legitimacy of all uploaded files (including Signed Client Forms, IDs, and Policy PDFs). Uploads must comply with Sun Life Financial regulatory requirements and local data privacy laws (e.g., Data Privacy Act of 2012).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-900">5. Service Disclaimers</h2>
              <p className="mt-2">
                While the system aims to provide real-time updates and notifications on premium collections, upcoming birthdays, and status distributions, Team Padua does not guarantee 100% uninterrupted operations. Automated task synchronization depends on active network services and backend API availability.
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
