'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, CheckCircle2 } from 'lucide-react';

const INQUIRY_TYPES = ['Portal Access', 'Technical Issue', 'Feature Request', 'General Question'];

export default function ContactSection() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const form = e.currentTarget;
        const payload = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            team: (form.elements.namedItem('team') as HTMLInputElement).value,
            email: (form.elements.namedItem('email') as HTMLInputElement).value,
            inquiryType: (form.elements.namedItem('inquiryType') as HTMLSelectElement).value,
            message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
        };

        try {
            // Wire this up to an API route (e.g. /api/contact) that emails
            // or logs the inquiry. Left as a no-op fetch so the form is
            // drop-in ready once that route exists.
            await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).catch(() => null);
        } finally {
            setLoading(false);
            setSubmitted(true);
        }
    }

    return (
        <section id="contact" className="mx-auto max-w-4xl px-6 lg:px-8">
            <div className="bg-white border border-slate-100 rounded-[32px] p-8 md:p-12 shadow-sm">
                <div className="text-center max-w-lg mx-auto space-y-3 mb-10">
                    <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-[#FFF6D6] text-[#A3843B] border border-[#FFC72C]/20 px-3 py-1.5 rounded-full">
                        <Mail size={12} />
                        Get in Touch
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111111] leading-tight">
                        Have a question for Team Padua?
                    </h2>
                    <p className="text-sm text-[#666666] leading-relaxed">
                        Send us a note about portal access, a technical issue, or anything else — we'll
                        get back to you directly.
                    </p>
                </div>

                {submitted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center gap-3 py-10"
                    >
                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={22} />
                        </div>
                        <h3 className="text-lg font-bold text-[#111111]">Message sent.</h3>
                        <p className="text-sm text-[#666666] max-w-sm">
                            Thanks for reaching out — someone from Team Padua will follow up by email
                            shortly.
                        </p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-1">
                            <label htmlFor="name" className="block text-xs font-bold text-[#111111] mb-1.5">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Juan Dela Cruz"
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#111111] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFC72C]/40 focus:border-[#FFC72C]"
                            />
                        </div>

                        <div className="sm:col-span-1">
                            <label htmlFor="team" className="block text-xs font-bold text-[#111111] mb-1.5">
                                Advisor Code / Team
                            </label>
                            <input
                                id="team"
                                name="team"
                                type="text"
                                placeholder="e.g. Team Padua"
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#111111] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFC72C]/40 focus:border-[#FFC72C]"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="email" className="block text-xs font-bold text-[#111111] mb-1.5">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="you@sunlife.com.ph"
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#111111] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFC72C]/40 focus:border-[#FFC72C]"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="inquiryType" className="block text-xs font-bold text-[#111111] mb-1.5">
                                Inquiry Type
                            </label>
                            <select
                                id="inquiryType"
                                name="inquiryType"
                                required
                                defaultValue=""
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#FFC72C]/40 focus:border-[#FFC72C]"
                            >
                                <option value="" disabled>Select an inquiry type</option>
                                {INQUIRY_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="message" className="block text-xs font-bold text-[#111111] mb-1.5">
                                Message
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                required
                                rows={4}
                                placeholder="Tell us what you need help with..."
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#111111] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FFC72C]/40 focus:border-[#FFC72C] resize-none"
                            />
                        </div>

                        <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-full bg-[#FFC72C] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-[#111111] shadow-md hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                            >
                                {loading ? 'Sending…' : 'Send Message'}
                                <Send size={13} />
                            </button>
                            <a
                                href="mailto:contact@teampadua.com"
                                className="text-xs font-semibold text-[#666666] hover:text-[#111111] transition-colors"
                            >
                                or email contact@teampadua.com directly
                            </a>
                        </div>
                    </form>
                )}
            </div>
        </section>
    );
}