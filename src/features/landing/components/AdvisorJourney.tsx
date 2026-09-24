'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, HeartHandshake, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Users,
    title: 'Manage Clients',
    description:
      'Onboard client demographics, organize policy details, and maintain a complete relationship record in one unified profile.',
  },
  {
    number: '02',
    icon: FileText,
    title: 'Service Policies',
    description:
      'Submit ACR, BCR, fund switching, and withdrawal requests digitally — and track every step of the approval process in real time.',
    emphasized: true,
  },
  {
    number: '03',
    icon: HeartHandshake,
    title: 'Build Relationships',
    description:
      'Use birthday engagement, proactive reminders, and personalized touchpoints to strengthen client loyalty and retention.',
  },
];

export default function AdvisorJourney() {
  return (
    <section className="py-24 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3843B]"
          >
            Advisor Journey
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl"
          >
            From first meeting to lifelong trust.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm text-[#666666] leading-relaxed"
          >
            Three connected phases that define how the portal supports every advisor&apos;s workflow
            — from client acquisition to long-term relationship management.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-16 left-[16.5%] right-[16.5%] h-px bg-slate-200" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isEmphasized = step.emphasized;

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex flex-col items-center text-center px-6 lg:px-10 relative"
                >
                  {/* Step number circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold mb-6 relative z-10 ${
                      isEmphasized
                        ? 'bg-[#FFC72C] text-[#111111] shadow-lg shadow-[#FFC72C]/20'
                        : 'bg-white border-2 border-slate-200 text-[#111111]'
                    }`}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                      isEmphasized
                        ? 'bg-[#111111] text-[#FFC72C]'
                        : 'bg-slate-50 border border-slate-100 text-[#A3843B]'
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <h3 className="text-base font-bold text-[#111111] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#666666] leading-relaxed">{step.description}</p>

                  {isEmphasized && (
                    <span className="mt-5 text-[9px] font-bold uppercase tracking-[0.15em] bg-[#111111] text-white px-3 py-1.5 rounded-md">
                      Core Workflow
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
