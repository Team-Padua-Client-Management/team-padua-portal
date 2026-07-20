'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, KeyRound, Lock, UserCog } from 'lucide-react';

const pillars = [
    {
        icon: KeyRound,
        title: 'Restricted access',
        desc: 'Only authorized Sun Life advisors and staff under Team Padua can sign in — there is no public sign-up.',
    },
    {
        icon: UserCog,
        title: 'Role-based permissions',
        desc: 'What a user can view or edit is scoped to their role, so client records are only visible to the people who need them.',
    },
    {
        icon: Lock,
        title: 'Secure authentication',
        desc: 'Sign-in is protected by secure authentication — no shared logins or open access links.',
    },
    {
        icon: ShieldCheck,
        title: 'Privacy-first handling',
        desc: 'Client data is handled in line with the Data Privacy Act of 2012 (RA 10173), and the portal does not store or transmit payment credentials.',
    },
];

export default function SecuritySection() {
    return (
        <section id="security" className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="relative bg-[#111111] rounded-[36px] px-8 py-14 md:px-14 md:py-16 overflow-hidden">
                {/* subtle accent glow */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#FFC72C]/10 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none blur-3xl" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-4 space-y-4">
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-[#FFC72C]/15 text-[#FFC72C] border border-[#FFC72C]/25 px-3 py-1.5 rounded-full">
                            <ShieldCheck size={12} />
                            Security &amp; Data Privacy
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                            Built with client trust in mind.
                        </h2>
                        <p className="text-sm text-white/60 leading-relaxed">
                            The Team Padua Advisor Portal is developed and maintained internally, with
                            access restricted to authorized team members only. As an internal tool, it's
                            continuously reviewed to match Team Padua's operational and confidentiality
                            standards — client trust is the whole point of the platform.
                        </p>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {pillars.map((p, i) => {
                            const Icon = p.icon;
                            return (
                                <motion.div
                                    key={p.title}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-[#FFC72C]/15 border border-[#FFC72C]/25 flex items-center justify-center text-[#FFC72C] shrink-0">
                                        <Icon size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white mb-1">{p.title}</h3>
                                        <p className="text-xs text-white/50 leading-relaxed">{p.desc}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}