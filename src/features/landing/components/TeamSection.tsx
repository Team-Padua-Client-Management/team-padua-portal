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
  },
  {
    name: 'Triwynn Branzuela',
    role: 'Senior Team Mentor',
    bio: 'Supports advisor development, mentoring, operations, and quality client servicing across the entire team.',
    image: '/Image/triwynn.jpg',
    responsibility: 'Mentorship & Operational Coaching',
  },
  {
    name: 'Isabel Francisco',
    role: 'Senior Team Coordinator',
    bio: 'Leads recruitment coordination, intern onboarding, administrative support, and team development programs.',
    image: '/Image/isabel.png',
    responsibility: 'Operations & Recruitment Sync',
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
    <section id="team" className="mx-auto max-w-[1200px] px-6 lg:px-8 space-y-32 py-10">

      {/* About narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#555555]">
              The Organization
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#111111] md:text-5xl leading-[1.1]">
            Meet Team Padua <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#111111] to-[#888888]">
              Business Development
            </span>.
          </h2>
          <p className="text-base text-[#666666] leading-relaxed">
            Team Padua is a Business Development Team under Sun Life Philippines dedicated to
            supporting financial advisors through operational excellence, client servicing,
            mentorship, recruitment, and continuous professional development.
          </p>
          <p className="text-base text-[#666666] leading-relaxed">
            By combining specialized human expertise and purpose-built technology, Team Padua
            empowers advisors to maximize client outcomes, mentor incoming talent, and operate
            at the highest standard of financial advisory practice.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 md:p-10"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#A3843B] mb-6">
            Intern Departments
          </p>
          <div className="space-y-4">
            {internDepartments.map((dept, i) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200/60 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <h4 className="text-sm font-bold text-[#111111]">{dept.name}</h4>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#A3843B] bg-[#FFF6D6] px-2.5 py-1 rounded-md shrink-0 self-start sm:self-auto">
                    {dept.role}
                  </span>
                </div>
                <p className="text-xs text-[#666666] leading-relaxed">{dept.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Leadership cards */}
      <div>
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center justify-center rounded-full bg-[#FFF6D6] px-4 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3843B]">
              Leadership
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight text-[#111111]">
            The people behind the portal.
          </h2>
          <p className="text-base text-[#666666]">
            Steering operational strategies and mentoring advisors for client success.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {leadershipMembers.map((member, idx) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="group flex flex-col items-center p-8 lg:p-10 bg-white border border-slate-200/80 rounded-[2.5rem] hover:border-[#FFC72C]/40 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#FFF6D6]/0 to-[#FFF6D6]/0 group-hover:from-[#FFF6D6]/20 transition-colors duration-700 pointer-events-none" />

              <div className="relative mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>

              <h3 className="text-lg font-bold text-[#111111] mb-1">{member.name}</h3>
              <p className="text-[10px] text-[#A3843B] font-bold mb-4 uppercase tracking-[0.15em] text-center">
                {member.role}
              </p>
              <p className="text-sm text-[#666666] text-center leading-relaxed flex-1 px-2">
                {member.bio}
              </p>

              <div className="mt-8 py-2 px-4 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-[#888888] uppercase tracking-wider text-center w-full group-hover:bg-white group-hover:border-[#FFC72C]/20 transition-colors duration-300">
                {member.responsibility}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

    </section>
  );
}
