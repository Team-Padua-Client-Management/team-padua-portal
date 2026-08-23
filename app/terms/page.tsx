import React from 'react';
import Image from 'next/image';
import { ArrowLeft, FileText, Scale } from 'lucide-react';

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

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-12 shadow-[0_20px_50px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3 text-[#A3843B]">
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/60 text-[#A3843B]">
                <FileText size={26} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Terms of Service</h1>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Team Padua Advisor Portal (tpclientportal.vercel.app)</p>
              </div>
            </div>
            <div className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Last updated: August 23, 2026
            </div>
          </div>

          <div className="mt-8 space-y-7 text-sm leading-relaxed text-slate-600">
            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">1.</span> Acceptance of Terms
              </h2>
              <p className="mt-1.5">
                By logging into, accessing, or using the Team Padua Advisor Portal (the &quot;Portal&quot;), you confirm that you are an authorized Sun Life Financial Advisor or administrative staff member affiliated with Team Padua Business Development. Your access constitutes an express agreement to comply with these Terms of Service, all applicable internal operating guidelines, and relevant Philippine laws. If you do not agree to these terms or lose authorization status, you must immediately discontinue all access and use.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">2.</span> Permitted Use
              </h2>
              <p className="mt-1.5">
                This platform is exclusively designed to facilitate client relationship management, policy servicing workflows (including Advisor/Client Requests [ACR], Beneficiary/Change Requests [BCR], fund switching, policy withdrawals, and reinstatement monitoring), premium tracking, client birthday engagements, scheduling, and internal performance reports. Access is strictly limited to records relevant to your assigned clientele and authorized servicing scope. Any automated scraping, unauthorized data extraction, bulk export, or use of platform tools for non-Sun Life business or third-party commercial purposes is strictly prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">3.</span> Integrity of Database Records
              </h2>
              <p className="mt-1.5">
                All client profiles, servicing records, policy numbers, and status updates stored within the Portal must reflect truthful, verifiable, and up-to-date information. Creating fictitious profiles, manipulating policy tracking statuses, or entering fraudulent data severely compromises database integrity and operational compliance. Any intentional falsification of database records will result in immediate termination of portal privileges and referral for formal administrative or disciplinary review.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">4.</span> Document Management &amp; Data Compliance
              </h2>
              <p className="mt-1.5">
                Users uploading physical or digital documents—including signed client forms, government IDs, and policy documents—must ensure their validity, legibility, and legal authenticity. All processing, storage, and handling of personal data within the portal must strictly comply with Republic Act No. 10173 (the Data Privacy Act of 2012), its Implementing Rules and Regulations, and National Privacy Commission issuances. While the Portal stores client demographics, policy parameters, and payment status flags, users are strictly prohibited from uploading or storing sensitive financial payment credentials such as credit card CVVs, full card numbers, or online banking authentication credentials.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">5.</span> Service Disclaimers
              </h2>
              <p className="mt-1.5">
                The Portal is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, whether express or implied. While Team Padua endeavors to maintain accurate data synchronizations, continuous uptime, and timely notification delivery, uninterrupted availability is not guaranteed. System operations may be temporarily suspended or delayed due to routine maintenance, network dependencies, or third-party infrastructure outages.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">6.</span> Account Security and User Responsibilities
              </h2>
              <p className="mt-1.5">
                Portal access is strictly governed by authenticated, role-based credentials. Users are individually responsible for safeguarding their login credentials, passwords, and session tokens. Sharing user accounts, allowing secondary individuals to operate an active session, or bypassing authentication protocols is strictly prohibited. You must immediately notify the platform administration at contact@teampadua.com if you detect or suspect any unauthorized access, compromised passwords, or security incidents.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">7.</span> Relationship to Sun Life Financial
              </h2>
              <p className="mt-1.5">
                The Team Padua Advisor Portal is an internal management and productivity tool operated independently by Team Padua Business Development, a Business Development Team under Sun Life Financial Philippines. This platform complements internal advisor workflows but does NOT replace or supersede official Sun Life enterprise systems, databases, or submission channels. All official policy alterations, binding client transactions, fund switches, and servicing requests must be finalized through standard, approved Sun Life enterprise applications.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">8.</span> Intellectual Property Rights
              </h2>
              <p className="mt-1.5">
                All platform architecture, custom software code, database structures, user interfaces, branding assets, graphics, and documentation are the proprietary intellectual property of Team Padua Business Development and its technology partners. Authorized users are granted a limited, revocable, non-exclusive, and non-transferable license to access the portal solely for legitimate advisory servicing duties. Users may not copy, modify, distribute, reverse-engineer, or create derivative works from any component of this platform.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">9.</span> Limitation of Liability
              </h2>
              <p className="mt-1.5">
                To the fullest extent permitted under Philippine law, Team Padua Business Development, its management, developers, and administrators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from portal use, technical downtime, data inaccuracies, or missed servicing deadlines. Advisors retain sole professional responsibility for verifying critical client policy data and ensuring timely transaction fulfillment via official Sun Life corporate systems.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">10.</span> Termination and Suspension of Access
              </h2>
              <p className="mt-1.5">
                Team Padua reserves the right to immediately suspend or permanently revoke access credentials at its sole discretion, without prior notice, upon any violation of these Terms, unauthorized security activities, or upon the disaffiliation or transfer of an advisor from Team Padua or Sun Life Financial Philippines. User permissions and role assignments are subject to continuous administrative oversight and periodic access reviews.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">11.</span> Governing Law and Jurisdiction
              </h2>
              <p className="mt-1.5">
                These Terms of Service shall be governed by, interpreted, and enforced in accordance with the laws of the Republic of the Philippines, including Republic Act No. 10173 (Data Privacy Act of 2012) and Republic Act No. 8792 (Electronic Commerce Act of 2000). Any legal actions, proceedings, or claims arising out of or related to these terms or platform usage shall be instituted exclusively in the competent courts of the Philippines.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">12.</span> Changes to These Terms
              </h2>
              <p className="mt-1.5">
                Team Padua Business Development reserves the right to amend or update these Terms of Service as necessary to reflect system enhancements, operational policies, or regulatory requirements. Any modifications will be posted directly within this page with an updated revision date. Continued utilization of the portal following such revisions constitutes your acknowledgment and binding acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <span className="text-[#A3843B] font-mono font-bold">13.</span> Contact Information
              </h2>
              <p className="mt-1.5">
                For administrative inquiries, role permission adjustments, security incident reporting, or questions regarding these Terms of Service, please reach out to Team Padua Business Development at{' '}
                <a href="mailto:contact@teampadua.com" className="font-semibold text-[#A3843B] hover:underline">
                  contact@teampadua.com
                </a>
                .
              </p>
            </section>
          </div>

          {/* Legal Review Advisory Notice */}
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-amber-900">
            <div className="flex items-start gap-3.5">
              <Scale className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-amber-950 uppercase tracking-wider text-[11px]">Legal Advisory Notice</p>
                <p className="mt-1 text-amber-900/90">
                  This document serves as an operational Terms of Service framework tailored for internal advisor use within Team Padua Business Development. Prior to official organizational finalization or legal enforcement, formal review and validation by a licensed attorney familiar with Philippine data privacy regulations (RA 10173) and financial services guidelines is recommended.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <p>© 2026 Team Padua Business Development. Built exclusively for authorized Sun Life Financial advisors.</p>
      </footer>
    </div>
  );
}
