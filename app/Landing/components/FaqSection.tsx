'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { LandingStats } from '@/app/api/landing-stats/route';

const STATIC_FAQS = [
  {
    question: 'What is the primary purpose of the Team Padua Advisor Portal?',
    answer:
      'The portal is a private, secure client servicing workspace built to centralize client policy cards, premium updates, and administrative change workflows for Sun Life Financial Advisors operating under Team Padua Business Development.',
    category: 'General',
    is_pinned: true,
  },
  {
    question: 'Who can access the portal?',
    answer:
      'Access is limited strictly to authorized Sun Life Financial Advisors and team members affiliated with Team Padua. Eligible members sign in using their registered internal accounts. For new account setups, contact Isabel Francisco (Senior Team Coordinator).',
    category: 'Access',
    is_pinned: false,
  },
  {
    question: 'Is client information secure on this platform?',
    answer:
      'Yes. The portal uses role-based access controls and secure sign-in so client policy records and advisor workflows stay confidential. Data is handled in line with the Data Privacy Act of 2012 (RA 10173), and the platform does not store or transmit payment credentials.',
    category: 'Security',
    is_pinned: false,
  },
  {
    question: 'Does this replace official Sun Life systems?',
    answer:
      "No. The portal is an operational layer on top of your existing process — a place to organize and track client and policy information your team already manages. All official transactions and submissions still go through Sun Life's standard channels.",
    category: 'General',
    is_pinned: false,
  },
  {
    question: 'How do I get onboarded if I\'m a new advisor under Team Padua?',
    answer:
      'New advisors are onboarded directly by the team. Reach out through the contact form below or your team lead, and you\'ll receive login credentials along with a short walkthrough of the portal\'s modules before your first session.',
    category: 'Access',
    is_pinned: false,
  },
];

interface FaqSectionProps {
  stats: LandingStats;
}

export default function FaqSection({ stats }: FaqSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  // Use live DB FAQs if available, otherwise fall back to static list
  const faqs = stats.faqs.length > 0 ? stats.faqs : STATIC_FAQS;

  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 lg:px-8">
      <div className="text-center mb-14 space-y-4">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B]"
        >
          FAQ
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl font-extrabold tracking-tight text-[#111111]"
        >
          Questions & Answers
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[#666666]"
        >
          Common inquiries about access, security, and platform capabilities.
        </motion.p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = activeIndex === index;
          return (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="rounded-[20px] border border-slate-100 bg-white overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md"
            >
              <button
                id={`faq-toggle-${index}`}
                className="flex w-full items-center justify-between p-6 text-left cursor-pointer group"
                onClick={() => setActiveIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                <span className="text-sm font-bold text-[#111111] group-hover:text-[#A3843B] transition-colors leading-snug pr-4">
                  {faq.question}
                </span>
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen
                      ? 'bg-[#FFC72C] border-[#FFC72C] text-[#111111] rotate-180'
                      : 'border-slate-200 text-[#666666]'
                    }`}
                >
                  <ChevronDown size={13} />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 pt-0 text-sm text-[#666666] leading-relaxed border-t border-slate-50">
                      <div className="pt-4">{faq.answer}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}