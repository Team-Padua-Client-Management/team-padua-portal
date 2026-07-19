'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  UserCog,
  Users,
  ArrowLeftRight,
  Banknote,
  RefreshCw,
  FileCheck,
  ClipboardList,
  type LucideIcon
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import styles from '@/styles/admin/cpst/page.module.css';

interface FormDirectoryItem {
  id: string;
  name: string;
  description: string;
  href: string;        // route to navigate to
  available: boolean;  // controls badge + click behavior
  icon: LucideIcon;
}

const formList: FormDirectoryItem[] = [
  {
    id: 'acr',
    name: 'Advisor Change Request',
    description: 'Submit and manage requests to change policy advisors.',
    href: '/admin/acr',
    available: true,
    icon: UserCog,
  },
  {
    id: 'bcr',
    name: 'Beneficiary Change Request',
    description: 'Update and manage beneficiaries for client policies.',
    href: '#',
    available: false,
    icon: Users,
  },
  {
    id: 'fund-switching',
    name: 'Fund Switching',
    description: 'Request allocation changes between investment funds.',
    href: '#',
    available: false,
    icon: ArrowLeftRight,
  },
  {
    id: 'fund-withdrawal',
    name: 'Fund Withdrawal',
    description: 'Process partial or full fund withdrawal requests.',
    href: '#',
    available: false,
    icon: Banknote,
  },
  {
    id: 'aca',
    name: 'Auto Change Arrangement',
    description: 'Set up or modify automated payment and policy arrangements.',
    href: '#',
    available: false,
    icon: RefreshCw,
  },
  {
    id: 'reinstatement-sro',
    name: 'Reinstatement SRO',
    description: 'Reinstatement request with Special Reinstatement Offer.',
    href: '#',
    available: false,
    icon: FileCheck,
  },
  {
    id: 'reinstatement-pdi',
    name: 'Reinstatement PDI',
    description: 'Reinstatement request with Personal Declaration of Insurability.',
    href: '#',
    available: false,
    icon: FileCheck,
  },
  {
    id: 'activity-tracker',
    name: 'Advisor Daily Activity Tracker',
    description: 'Log and monitor daily activities and performance of advisors.',
    href: '#',
    available: false,
    icon: ClipboardList,
  },
];

export default function FormsHubPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter forms based on search query
  const filteredForms = formList.filter((form) =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.text_52}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_53}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.div_54}>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-sans">Sun Life Forms</h1>
              <p className="text-sm text-gray-500">
                Directory and access hub for client servicing forms.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search forms by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition duration-150 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Forms Directory Grid */}
          {filteredForms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm">No forms matched your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredForms.map((form) => {
                const IconComponent = form.icon;

                if (form.available) {
                  return (
                    <Link
                      key={form.id}
                      href={form.href}
                      className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-amber-400/50 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-48"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 group-hover:text-amber-700 transition duration-200">
                            <IconComponent size={24} />
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            Available
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition duration-200 text-base mb-1">
                          {form.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {form.description}
                        </p>
                      </div>
                    </Link>
                  );
                } else {
                  return (
                    <div
                      key={form.id}
                      title="Not available yet"
                      className="bg-white/70 rounded-xl p-5 border border-gray-100 shadow-sm opacity-70 cursor-not-allowed flex flex-col justify-between h-48 select-none"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                            <IconComponent size={24} />
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            Coming Soon
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-600 text-base mb-1">
                          {form.name}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {form.description}
                        </p>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
