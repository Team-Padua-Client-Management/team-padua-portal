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
    <section id="security" className="mx-auto max-w-[1200px] px-6 lg:px-8 py-20">
      <div className="relative rounded-[3rem] overflow-hidden bg-[#0A0A0A] border border-white/10 shadow-2xl">
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, white, transparent)'
          }}
        />
        {/* Accent glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-[#FFC72C]/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-white/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none blur-3xl opacity-50" />

        <div className="relative z-10 px-8 py-16 md:px-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
            {/* Left copy */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFC72C]">
                  <ShieldCheck size={14} />
                  Enterprise Grade
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight">
                  Uncompromising data security.
                </h2>
                <p className="text-base text-white/50 leading-relaxed max-w-md">
                  Built internally with strict access controls, the Team Padua portal ensures client records and operational data are handled with the highest standards of confidentiality and privacy.
                </p>
              </motion.div>
            </div>

            {/* Right cards */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <motion.div
                    key={p.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
                    className="group relative bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex flex-col gap-4 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.05] flex items-center justify-center text-white/80 shrink-0 group-hover:text-[#FFC72C] group-hover:bg-[#FFC72C]/10 group-hover:border-[#FFC72C]/20 transition-all duration-300">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white/90 mb-2">{p.title}</h3>
                      <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors duration-300">{p.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
