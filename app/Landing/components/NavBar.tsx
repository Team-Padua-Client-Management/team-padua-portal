'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Overview', href: '#overview' },
  { label: 'Modules', href: '#modules' },
  { label: 'Team Padua', href: '#about' },
  { label: 'Portal Preview', href: '#preview' },
  { label: 'FAQ', href: '#faq' },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-4 inset-x-0 mx-auto z-50 max-w-7xl px-4 lg:px-8">
      <div className="rounded-full border border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-sm flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-[#FFC72C] blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-full" />
            <Image
              src="/Image/icon/TPC.png"
              alt="Team Padua Logo"
              width={32}
              height={32}
              className="relative object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-[0.15em] text-[#111111] leading-tight">
              TEAMPADUA
            </p>
            <p className="text-[9px] uppercase font-bold text-[#A3843B] tracking-widest">
              Advisor Portal
            </p>
          </div>
        </a>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#666666]">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-[#111111] transition-colors duration-200 relative group"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#FFC72C] group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/auth/login"
            id="nav-access-portal"
            className="hidden sm:inline-flex relative overflow-hidden rounded-full bg-[#111111] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:scale-105 hover:bg-[#222222] group"
          >
            <span className="relative z-10">Access Portal</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </a>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            id="nav-mobile-menu-toggle"
            className="lg:hidden p-2 rounded-full border border-slate-200 text-slate-600"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-2 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-xl flex flex-col gap-4 lg:hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-semibold text-[#666666] hover:text-[#111111] transition-colors"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-slate-100" />
            <a
              href="/auth/login"
              className="w-full text-center rounded-full bg-[#111111] py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              Access Portal
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
