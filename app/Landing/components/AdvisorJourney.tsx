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
    emphasized: false,
    bg: 'bg-white',
    border: 'border-slate-100',
  },
  {
    number: '02',
    icon: FileText,
    title: 'Service Policies',
    description:
      'Submit ACR, BCR, fund switching, and withdrawal requests digitally — and track every step of the approval process in real time.',
    emphasized: true,
    bg: 'bg-[#FFC72C]',
    border: 'border-[#FFC72C]',
  },
  {
    number: '03',
    icon: HeartHandshake,
    title: 'Build Relationships',
    description:
      'Use birthday engagement, proactive reminders, and personalized touchpoints to strengthen client loyalty and retention.',
    emphasized: false,
    bg: 'bg-white',
    border: 'border-slate-100',
  },
];

export default function AdvisorJourney() {
  return (
    <section className="bg-[#FFF6D6]/50 border-y border-[#FFC72C]/10 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B]"
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
            Three connected phases that define how the portal supports every advisor's workflow
            — from client acquisition to long-term relationship management.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch gap-0 lg:gap-0 max-w-5xl mx-auto">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === steps.length - 1;

            return (
              <React.Fragment key={step.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className={`flex-1 ${step.bg} border-2 ${step.border} rounded-[28px] p-8 flex flex-col gap-5 relative
                    ${step.emphasized ? 'shadow-lg shadow-[#FFC72C]/30 scale-[1.02] z-10' : 'shadow-sm'}`}
                >
                  {/* Step number */}
                  <span className={`text-4xl font-serif font-bold leading-none ${step.emphasized ? 'text-[#111111]/30' : 'text-[#FFC72C]'}`}>
                    {step.number}
                  </span>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                    ${step.emphasized
                      ? 'bg-[#111111]/10 text-[#111111]'
                      : 'bg-[#FFF6D6] text-[#A3843B] border border-[#FFC72C]/20'}`}
                  >
                    <Icon size={20} />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className={`text-lg font-bold mb-2 ${step.emphasized ? 'text-[#111111]' : 'text-[#111111]'}`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${step.emphasized ? 'text-[#111111]/80' : 'text-[#666666]'}`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Emphasized badge */}
                  {step.emphasized && (
                    <span className="self-start text-[10px] font-bold uppercase tracking-wider bg-[#111111] text-white px-3 py-1 rounded-full">
                      Core Workflow
                    </span>
                  )}
                </motion.div>

                {/* Arrow connector (between steps, not after last) */}
                {!isLast && (
                  <div className="hidden lg:flex items-center justify-center px-2 shrink-0">
                    <ArrowRight size={18} className="text-[#FFC72C]" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
