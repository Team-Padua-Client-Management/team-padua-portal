'use client';

import React from 'react';
import { motion } from 'framer-motion';

const leadershipMembers = [
  {
    name: 'Daniel Padua',
    role: 'Founder & Business Development Lead',
    bio: 'Provides strategic direction, advisor development, business growth, client servicing leadership, and operational excellence for Team Padua.',
    image: '/Image/padua.jpg',
    responsibility: 'Strategic Direction & Team Strategy',
    tag: 'BD Lead',
  },
  {
    name: 'Triwynn Branzuela',
    role: 'Senior Team Mentor',
    bio: 'Supports advisor development, mentoring, operations, and quality client servicing across the entire team.',
    image: '/Image/triwynn.jpg',
    responsibility: 'Mentorship & Operational Coaching',
    tag: 'Mentor',
  },
  {
    name: 'Isabel Francisco',
    role: 'Senior Team Coordinator',
    bio: 'Leads recruitment coordination, intern onboarding, administrative support, and team development programs.',
    image: '/Image/isabel.png',
    responsibility: 'Operations & Recruitment Sync',
    tag: 'Coordinator',
  },
];

const internDepartments = [
  {
    name: 'Advisor Support Associates',
    role: 'Operational Optimization',
    desc: 'Facilitates day-to-day administrative support for financial advisors — processing service requests, organizing documents, and maintaining continuous workflow support.',
  },
  {
    name: 'Business Support Associates',
    role: 'Strategic Coordination',
    desc: 'Focuses on team logistics, meeting management, and internal analytics. Keeps Team Padua synchronized and operational metrics transparent.',
  },
  {
    name: 'Client Relations Associates',
    role: 'Communications & Engagement',
    desc: 'Manages birthday logs, communications lists, and welcome notes — reinforcing personalized client experiences that drive retention.',
  },
  {
    name: 'Design & Content Associates',
    role: 'Visual Communication',
    desc: 'Owns presentations, training materials, and digital templates. Maintains the premium visual identity of Team Padua Business Development.',
  },
];

export default function TeamSection() {
  return (
    <section id="team" className="mx-auto max-w-7xl px-6 lg:px-8 space-y-24">

      {/* About narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-7 space-y-5"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B]">
            The Organization
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl leading-tight">
            Meet Team Padua <br />
            <span className="text-[#FFC72C]">Business Development.</span>
          </h2>
          <p className="text-sm text-[#666666] leading-relaxed">
            Team Padua is a Business Development Team under Sun Life Philippines dedicated to
            supporting financial advisors through operational excellence, client servicing,
            mentorship, recruitment, and continuous professional development.
          </p>
          <p className="text-sm text-[#666666] leading-relaxed">
            By combining specialized human expertise and purpose-built technology, Team Padua
            empowers advisors to maximize client outcomes, mentor incoming talent, and operate
            at the highest standard of financial advisory practice.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 bg-[#FFF6D6]/60 border border-[#FFC72C]/15 rounded-[28px] p-6 space-y-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A3843B] mb-4">
            Intern Departments
          </p>
          {internDepartments.map((dept) => (
            <div key={dept.name} className="bg-white border border-slate-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-bold text-[#111111]">{dept.name}</h4>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FFF6D6] text-[#A3843B] px-2 py-0.5 rounded-full border border-[#FFC72C]/20">
                  {dept.role}
                </span>
              </div>
              <p className="text-[11px] text-[#666666] leading-relaxed">{dept.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Leadership cards */}
      <div>
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#A3843B]">
            Leadership
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#111111] sm:text-4xl">
            The people behind the portal.
          </h2>
          <p className="text-sm text-[#666666]">
            Steering operational strategies and mentoring advisors for client success.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {leadershipMembers.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="group flex flex-col items-center p-8 bg-white border border-slate-100 rounded-[32px] hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-8 right-8 h-px bg-[#FFC72C]/30 group-hover:bg-[#FFC72C] transition-colors duration-500" />

              <div className="relative mb-6">
                <div className="absolute inset-0 bg-[#FFC72C] blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md relative z-10 grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>

              <h3 className="text-base font-bold text-[#111111]">{member.name}</h3>
              <p className="text-[10px] text-[#A3843B] font-bold mt-1.5 uppercase tracking-widest text-center">
                {member.role}
              </p>
              <p className="text-xs text-[#666666] text-center leading-relaxed mt-4 px-2">
                {member.bio}
              </p>

              <div className="mt-6 py-1.5 px-3 rounded-full bg-slate-50 border border-slate-100 text-[9px] font-bold text-[#666666] uppercase tracking-wider">
                {member.responsibility}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
}
