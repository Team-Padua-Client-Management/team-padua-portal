"use client";

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Filter, UserPlus, X, Check, RefreshCw } from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import { ConfirmModal } from '@/app/components/ui/modals/ConfirmModal';

interface JotFormRecruit {
  id: string;
  candidate_name: string;
  source: string;
  status: 'Interviewing' | 'Onboarded' | 'Rejected';
  applied_date: string;
  email: string;
  mobile: string;
  position: string;
}

export default function JotFormBizDevPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | null>(null);
  const [currentRecruit, setCurrentRecruit] = useState<Partial<JotFormRecruit>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [recruitToDelete, setRecruitToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [recruits, setRecruits] = useState<JotFormRecruit[]>([
    {
      id: 'JF-REC-701',
      candidate_name: 'Clarissa Santos',
      source: 'LinkedIn Referral',
      status: 'Onboarded',
      applied_date: '2026-07-10',
      email: 'clarissa.santos@gmail.com',
      mobile: '+63 905 555 1234',
      position: 'Financial Advisor'
    },
    {
      id: 'JF-REC-702',
      candidate_name: 'Arthur Pendragon',
      source: 'Facebook Campaign',
      status: 'Interviewing',
      applied_date: '2026-07-14',
      email: 'arthur.king@camelot.com',
      mobile: '+63 909 333 4444',
      position: 'Agency Manager'
    }
  ]);

  const handleSyncJotForm = (id: string) => {
    const mockJotFormRecruits: Record<string, Partial<JotFormRecruit>> = {
      'rec-001': {
        candidate_name: 'Galahad Du Lac',
        source: 'LinkedIn Organic',
        email: 'galahad.lac@camelot.com',
        mobile: '+63 916 444 5555',
        position: 'Financial Advisor'
      },
      'rec-002': {
        candidate_name: 'Lancelot Corbenic',
        source: 'Referral Direct',
        email: 'lancelot@corbenic.com',
        mobile: '+63 917 222 8888',
        position: 'Financial Advisor'
      }
    };

    const data = mockJotFormRecruits[id];
    if (data) {
      setCurrentRecruit(prev => ({
        ...prev,
        ...data,
        status: 'Interviewing',
        applied_date: new Date().toISOString().split('T')[0]
      }));
    }
  };

  const handleSyncApi = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const hasGalahad = recruits.some(r => r.candidate_name === 'Galahad Du Lac');
      if (!hasGalahad) {
        setRecruits(prev => [
          {
            id: 'JF-REC-703',
            candidate_name: 'Galahad Du Lac',
            source: 'LinkedIn Organic',
            status: 'Interviewing',
            applied_date: new Date().toISOString().split('T')[0],
            email: 'galahad.lac@camelot.com',
            mobile: '+63 916 444 5555',
            position: 'Financial Advisor'
          },
          ...prev
        ]);
      }
      setIsSyncing(false);
    }, 1500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRecruit.id) {
      // Edit
      setRecruits(prev => prev.map(r => r.id === currentRecruit.id ? (currentRecruit as JotFormRecruit) : r));
    } else {
      // Add
      const newRecord: JotFormRecruit = {
        id: `JF-REC-${Math.floor(100 + Math.random() * 900)}`,
        candidate_name: currentRecruit.candidate_name || 'Unnamed Candidate',
        source: currentRecruit.source || 'Direct Referral',
        status: currentRecruit.status || 'Interviewing',
        applied_date: currentRecruit.applied_date || new Date().toISOString().split('T')[0],
        email: currentRecruit.email || '',
        mobile: currentRecruit.mobile || '',
        position: currentRecruit.position || 'Financial Advisor'
      };
      setRecruits(prev => [newRecord, ...prev]);
    }
    setActiveModal(null);
  };

  const confirmDelete = (id: string) => {
    setRecruitToDelete(id);
  };

  const handleDelete = async () => {
    if (!recruitToDelete) return;
    setIsDeleting(true);
    // Simulate API call
    setTimeout(() => {
      setRecruits(prev => prev.filter(r => r.id !== recruitToDelete));
      setIsDeleting(false);
      setRecruitToDelete(null);
    }, 500);
  };

  const filteredRecruits = recruits.filter(r =>
    r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase()) ||
    r.source.toLowerCase().includes(search.toLowerCase())
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
              <h1 className="text-xl font-serif font-semibold text-text">JotForm BizDev Recruitment</h1>
              <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider mt-0.5">
                Track and monitor financial advisor applications and candidate pipelines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncApi}
                disabled={isSyncing}
                className="flex items-center gap-1.5 bg-card border border-border text-text-secondary hover:text-text font-semibold px-4 py-2.5 rounded-xl text-xs transition duration-155 shadow-2xs cursor-pointer select-none"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing Candidates...' : 'Sync JotForm API'}
              </button>
              <button
                onClick={() => { setCurrentRecruit({}); setActiveModal('add'); }}
                className="flex items-center gap-2 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-bold px-5 py-3 rounded-xl text-xs transition duration-150 shadow-md hover:shadow-lg cursor-pointer border border-[#F4C542]/30"
              >
                <Plus size={16} /> New Recruit Entry
              </button>
            </div>
          </div>

          {/* Stats widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'TOTAL CANDIDATES', count: recruits.length, color: 'text-text', icon: UserPlus, isYellowBorder: true },
              { label: 'INTERVIEWING', count: recruits.filter(r => r.status === 'Interviewing').length, color: 'text-orange-500', icon: Filter },
              { label: 'ONBOARDED ADVISORS', count: recruits.filter(r => r.status === 'Onboarded').length, color: 'text-emerald-500', icon: Check },
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
                  placeholder="Search recruit records..."
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
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Candidate Name</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Position</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Recruitment Source</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-center">Status</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-center">Applied Date</th>
                    <th className="py-3.5 px-4 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-right sticky right-0 bg-surface-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecruits.length > 0 ? (
                    filteredRecruits.map((recruit, idx) => (
                      <tr key={recruit.id} className="hover:bg-surface-2/40 transition duration-150">
                        <td className="py-3 px-4 font-mono text-xs text-text-secondary">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-text">{recruit.candidate_name}</td>
                        <td className="py-3 px-4 text-text-secondary text-xs">{recruit.position}</td>
                        <td className="py-3 px-4 text-text-secondary text-xs">{recruit.source}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                            recruit.status === 'Onboarded' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            recruit.status === 'Interviewing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {recruit.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-text-secondary">{recruit.applied_date}</td>
                        <td className="py-3 px-4 text-right sticky right-0 bg-card">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => { setCurrentRecruit(recruit); setActiveModal('edit'); }}
                              className="p-1 text-text-secondary hover:text-text transition rounded-lg hover:bg-surface-2"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => confirmDelete(recruit.id)}
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
                        No candidate records found matching search query.
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
                <h2 className="text-base font-bold text-text">{currentRecruit.id ? 'Edit Candidate Details' : 'Add New Candidate'}</h2>
                <p className="text-xs text-text-secondary">Onboard advisor candidates into tracking directory.</p>
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
                  Retrieve live BizDev submissions dynamically. Select a candidate submission to autofill recruitment cards.
                </p>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) handleSyncJotForm(val);
                  }}
                  className="w-full px-2.5 py-1.5 bg-card border border-border rounded-xl text-[11px] focus:outline-none focus:border-primary text-text cursor-pointer font-medium"
                >
                  <option value="">-- Choose JotForm Candidate --</option>
                  <option value="rec-001">Submission #703 - Galahad Du Lac (Financial Advisor)</option>
                  <option value="rec-002">Submission #704 - Lancelot Corbenic (Financial Advisor)</option>
                </select>
              </div>

              <form id="recruit-form" onSubmit={handleSave} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Candidate Name *</label>
                  <input
                    type="text"
                    value={currentRecruit.candidate_name || ''}
                    onChange={e => setCurrentRecruit({ ...currentRecruit, candidate_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Desired Position</label>
                  <input
                    type="text"
                    value={currentRecruit.position || ''}
                    onChange={e => setCurrentRecruit({ ...currentRecruit, position: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="e.g. Financial Advisor"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Recruitment Source *</label>
                  <input
                    type="text"
                    value={currentRecruit.source || ''}
                    onChange={e => setCurrentRecruit({ ...currentRecruit, source: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="e.g. LinkedIn, Referral, Direct"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={currentRecruit.email || ''}
                    onChange={e => setCurrentRecruit({ ...currentRecruit, email: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={currentRecruit.mobile || ''}
                    onChange={e => setCurrentRecruit({ ...currentRecruit, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                    placeholder="+63..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={currentRecruit.status || 'Interviewing'}
                    onChange={e => setCurrentRecruit({ ...currentRecruit, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary bg-card text-foreground"
                  >
                    <option value="Interviewing">Interviewing</option>
                    <option value="Onboarded">Onboarded</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
              <button type="submit" form="recruit-form" className="flex-1 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-extrabold text-xs py-2.5 rounded-xl transition duration-155 cursor-pointer border border-[#F4C542]/30 shadow-sm">
                Save Candidate
              </button>
              <button type="button" onClick={() => setActiveModal(null)} className="flex-1 bg-transparent border border-border text-text hover:bg-surface-2 text-xs font-semibold py-2.5 rounded-xl transition duration-155 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={!!recruitToDelete}
        onClose={() => setRecruitToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Candidate Record"
        message="Are you sure you want to delete this candidate record? This action cannot be undone."
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
