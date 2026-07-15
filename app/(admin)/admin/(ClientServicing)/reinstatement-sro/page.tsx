"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Filter, RefreshCcw } from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';

export default function ReinstatementSROPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <div className="flex min-h-screen bg-background text-text font-sans">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">Reinstatement - SRO Management</h1>
              <p className="text-sm text-text-secondary mt-1">Manage Reinstatement SRO requests.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-primary text-black font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/80 transition shadow-sm border border-[#e0b53c] hover:-translate-y-0.5">
                <Plus size={16} /> New Request
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'TOTAL REQUESTS', count: 0, color: 'text-text', icon: RefreshCcw, isYellowBorder: true },
              { label: 'PENDING', count: 0, color: 'text-orange-500', icon: Filter },
              { label: 'COMPLETED', count: 0, color: 'text-emerald-500', icon: Download },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className={`bg-card p-6 flex flex-col justify-between shadow-[0_2px_10px_rgb(0,0,0,0.04)] border rounded-[20px] ${stat.isYellowBorder ? 'border-primary/50' : 'border-border/50'} hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-shadow duration-300`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{stat.label}</span>
                    <Icon size={16} className="text-muted" />
                  </div>
                  <div className="mt-4">
                    <span className={`text-3xl font-bold ${stat.color}`}>{stat.count}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-card border border-border/50 shadow-[0_2px_10px_rgb(0,0,0,0.04)] rounded-[20px] overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-card">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-text"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider w-10">#</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Policy Owner</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Policy Number</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Date Submitted</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-right sticky right-0 bg-surface-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-secondary text-sm">No records found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
