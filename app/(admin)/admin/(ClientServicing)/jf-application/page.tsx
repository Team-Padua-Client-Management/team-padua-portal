"use client";

import React, { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Filter, FileText, X, Check, RefreshCw } from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import { ConfirmModal } from '@/app/components/ui/modals/ConfirmModal';

interface JotFormApplication {
  id: string;
  client_name: string;
  form_name: string;
  status: 'Processed' | 'Pending Review' | 'Flagged';
  date_submitted: string;
  email: string;
  mobile: string;
  plan_details: string;
}

export default function JotFormApplicationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | null>(null);
  const [currentApp, setCurrentApp] = useState<Partial<JotFormApplication>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [appToDelete, setAppToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [applications, setApplications] = useState<JotFormApplication[]>([
    {
      id: 'JF-APP-901',
      client_name: 'Juan Dela Cruz',
      form_name: 'Life Insurance Application Form',
      status: 'Processed',
      date_submitted: '2026-07-15',
      email: 'juan.delacruz@gmail.com',
      mobile: '+63 917 123 4567',
      plan_details: 'Sun Fit and Well - Gold Plan'
    },
    {
      id: 'JF-APP-902',
      client_name: 'Maria Jenny De Leon Teves',
      form_name: 'Investment Fund allocation Form',
      status: 'Pending Review',
      date_submitted: '2026-07-16',
      email: 'maria.teves@yahoo.com',
      mobile: '+63 918 987 6543',
      plan_details: 'Sun Maxilink Prime - Equity Fund'
    }
  ]);

  const handleSyncJotForm = (id: string) => {
    const mockJotFormSubmissions: Record<string, Partial<JotFormApplication>> = {
      'sub-001': {
        client_name: 'Sarah Jane Smith',
        form_name: 'Life Insurance Application Form',
        email: 'sarah.smith@example.com',
        mobile: '+63 905 111 2222',
        plan_details: 'Sun Dream Wealth - Balanced Fund'
      },
      'sub-002': {
        client_name: 'Arthur Pendragon',
        form_name: 'Investment Fund allocation Form',
        email: 'arthur.king@camelot.com',
        mobile: '+63 909 333 4444',
        plan_details: 'Sun Life Assure - Protection Plan'
      }
    };

    const data = mockJotFormSubmissions[id];
    if (data) {
      setCurrentApp(prev => ({
        ...prev,
        ...data,
        status: 'Pending Review',
        date_submitted: new Date().toISOString().split('T')[0]
      }));
    }
  };

  const handleSyncApi = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const hasSarah = applications.some(a => a.client_name === 'Sarah Jane Smith');
      if (!hasSarah) {
        setApplications(prev => [
          {
            id: 'JF-APP-903',
            client_name: 'Sarah Jane Smith',
            form_name: 'Life Insurance Application Form',
            status: 'Pending Review',
            date_submitted: new Date().toISOString().split('T')[0],
            email: 'sarah.smith@example.com',
            mobile: '+63 905 111 2222',
            plan_details: 'Sun Dream Wealth - Balanced Fund'
          },
          ...prev
        ]);
      }
      setIsSyncing(false);
    }, 1500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentApp.id) {
      // Edit
      setApplications(prev => prev.map(a => a.id === currentApp.id ? (currentApp as JotFormApplication) : a));
    } else {
      // Add
      const newRecord: JotFormApplication = {
        id: `JF-APP-${Math.floor(100 + Math.random() * 900)}`,
        client_name: currentApp.client_name || 'Unnamed Client',
        form_name: currentApp.form_name || 'Life Insurance Application Form',
        status: currentApp.status || 'Pending Review',
        date_submitted: currentApp.date_submitted || new Date().toISOString().split('T')[0],
        email: currentApp.email || '',
        mobile: currentApp.mobile || '',
        plan_details: currentApp.plan_details || ''
      };
      setApplications(prev => [newRecord, ...prev]);
    }
    setActiveModal(null);
  };

  const confirmDelete = (id: string) => {
    setAppToDelete(id);
  };

  const handleDelete = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setApplications(prev => prev.filter(a => a.id !== appToDelete));
      setIsDeleting(false);
      setAppToDelete(null);
    }, 500);
  };

  const filteredApps = applications.filter(app =>
    app.client_name.toLowerCase().includes(search.toLowerCase()) ||
    app.id.toLowerCase().includes(search.toLowerCase()) ||
    app.form_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background text-text font-sans antialiased">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <h1 className="text-xl font-serif font-semibold text-text">JotForm Client Applications</h1>
              <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider mt-0.5">
                Manage and track JotForm client registration submissions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncApi}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-card border border-border text-text-secondary hover:text-text font-semibold px-4 py-2.5 rounded-xl text-xs transition duration-150 shadow-2xs cursor-pointer select-none"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing JotForm...' : 'Sync JotForm API'}
              </button>
              <button
                onClick={() => { setCurrentApp({}); setActiveModal('add'); }}
                className="flex items-center gap-2 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-bold px-5 py-3 rounded-xl text-xs transition duration-150 shadow-md hover:shadow-lg cursor-pointer border border-[#F4C542]/30"
              >
                <Plus size={16} /> New Application
              </button>
            </div>
          </div>

          {/* Stats widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'TOTAL SUBMISSIONS', count: applications.length, color: 'text-text', icon: FileText, isYellowBorder: true },
              { label: 'PENDING REVIEW', count: applications.filter(a => a.status === 'Pending Review').length, color: 'text-orange-500', icon: Filter },
              { label: 'PROCESSED', count: applications.filter(a => a.status === 'Processed').length, color: 'text-emerald-500', icon: Check },
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

          {/* Data List Table */}
          <div className="bg-card border border-border/50 shadow-[0_2px_10px_rgb(0,0,0,0.04)] rounded-[20px] overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-card">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search application records..."
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
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider w-10">#</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Client Name</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Form Name</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Plan Details</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-center">Date Submitted</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-right sticky right-0 bg-surface-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredApps.length > 0 ? (
                    filteredApps.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-surface-2/40 transition duration-150">
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-text">{app.client_name}</td>
                        <td className="py-3 px-4 text-text-secondary text-xs">{app.form_name}</td>
                        <td className="py-3 px-4 text-text-secondary text-xs">{app.plan_details}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                            app.status === 'Processed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            app.status === 'Pending Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-text-secondary">{app.date_submitted}</td>
                        <td className="py-3 px-4 text-right sticky right-0 bg-card">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => { setCurrentApp(app); setActiveModal('edit'); }}
                              className="p-1 text-text-secondary hover:text-text transition rounded-lg hover:bg-surface-2"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => confirmDelete(app.id)}
                              className="p-1 text-text-secondary hover:text-red-500 transition rounded-lg hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-text-secondary text-xs">
                        No application records found matching the criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modern Slide-Over Drawer Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md h-full rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 shrink-0">
              <div>
                <h2 className="text-base font-bold text-text">{currentApp.id ? 'Edit Application Details' : 'Add Client Application'}</h2>
                <p className="text-xs text-text-secondary">Enter the JotForm client onboarding parameters.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-muted hover:text-text hover:bg-slate-200 rounded-xl transition">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Connected JotForm Sync Panel */}
              <div className="bg-[#fff9e6] dark:bg-amber-950/20 border border-[#f5c542]/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-[#FF6B00] flex items-center justify-center text-[10px] font-black text-white leading-none font-mono">JF</div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">JotForm Integration</span>
                  </div>
                  <span className="bg-[#FF6B00]/10 text-[#FF6B00] dark:bg-[#FF6B00]/25 dark:text-[#ff9245] px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider">Connected</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                  Choose a live JotForm submission link to dynamically retrieve candidate and client coverage details.
                </p>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) handleSyncJotForm(val);
                  }}
                  className="w-full px-2.5 py-1.5 bg-card border border-border rounded-xl text-[11px] focus:outline-none focus:border-primary text-text cursor-pointer font-medium"
                >
                  <option value="">-- Choose JotForm Submission --</option>
                  <option value="sub-001">Submission #903 - Sarah Jane Smith (Life Insurance)</option>
                  <option value="sub-002">Submission #904 - Arthur Pendragon (Investment Allocation)</option>
                </select>
              </div>

              <form id="app-form" onSubmit={handleSave} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Client Name *</label>
                  <input
                    type="text"
                    value={currentApp.client_name || ''}
                    onChange={e => setCurrentApp({ ...currentApp, client_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Form Name *</label>
                  <input
                    type="text"
                    value={currentApp.form_name || ''}
                    onChange={e => setCurrentApp({ ...currentApp, form_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="e.g. Life Insurance Application Form"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Plan / Coverage Details</label>
                  <input
                    type="text"
                    value={currentApp.plan_details || ''}
                    onChange={e => setCurrentApp({ ...currentApp, plan_details: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="e.g. Sun Fit and Well - Gold Plan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={currentApp.email || ''}
                    onChange={e => setCurrentApp({ ...currentApp, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={currentApp.mobile || ''}
                    onChange={e => setCurrentApp({ ...currentApp, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="+63..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={currentApp.status || 'Pending Review'}
                    onChange={e => setCurrentApp({ ...currentApp, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Processed">Processed</option>
                    <option value="Flagged">Flagged</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
              <button type="submit" form="app-form" className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-xs py-2.5 rounded-xl transition duration-155 cursor-pointer border border-[#F4C542]/30 shadow-sm">
                Save Submission
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-xl transition duration-155 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!appToDelete}
        onClose={() => setAppToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Submission Tracker"
        message="Are you sure you want to delete this submission tracker? This action cannot be undone."
        confirmText="Delete Tracker"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
