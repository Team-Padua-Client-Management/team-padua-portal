'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';

const navLinks = [
  { label: 'Overview', href: '#overview' },
  { label: 'Modules', href: '#modules' },
  { label: 'Team Padua', href: '#about' },
  { label: 'Security', href: '#security' },
  { label: 'Portal Preview', href: '#preview' },
  { label: 'FAQ', href: '#faq' },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 transition-all duration-300">
      <div className={`mx-auto max-w-[1400px] transition-all duration-300 ${scrolled ? 'px-4 lg:px-8 py-3' : 'px-6 lg:px-10 py-6'}`}>
        <nav
          className={`flex items-center justify-between transition-all duration-300 ${
            scrolled
              ? 'bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm rounded-2xl px-6 py-3'
              : 'bg-transparent px-2 py-2'
          }`}
        >
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-[#FFC72C] blur-md opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-xl" />
              <Image
                src="/Image/icon/new_logo.png"
                alt="Team Padua Logo"
                width={24}
                height={24}
                className="relative object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-widest text-[#111111] leading-tight">
                TEAMPADUA
              </span>
              <span className="text-[9px] uppercase font-bold text-[#A3843B] tracking-[0.25em]">
                Advisor Portal
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#555555] hover:text-[#111111] transition-colors duration-200 rounded-lg hover:bg-slate-50 group"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/auth/login"
              className="hidden sm:inline-flex group relative items-center gap-2 rounded-xl bg-[#111111] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 hover:bg-black shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <span>Login</span>
              <ArrowRight size={14} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`lg:hidden p-2.5 rounded-xl transition-all duration-200 ${
                menuOpen
                  ? 'bg-[#111111] text-white shadow-md'
                  : 'bg-white border border-slate-200 text-[#111111] hover:bg-slate-50 shadow-sm'
              }`}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-4 right-4 mt-2 origin-top"
          >
            <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-6 shadow-2xl flex flex-col gap-2 lg:hidden">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-base font-bold text-[#333333] hover:text-[#111111] hover:bg-slate-50 px-4 py-3 rounded-xl transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <hr className="border-slate-100 my-4" />
              <a
                href="/auth/login"
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-[#111111] py-4 text-sm font-bold uppercase tracking-wider text-white hover:bg-black transition-colors"
              >
                Access Portal <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
