"use client";

import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Plus, ExternalLink, Globe, Lock, ShieldAlert, Download } from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import SignaturePad from '@/app/components/ui/SignaturePad';
import { exportToPDF, exportToDOCS } from '@/app/lib/export';
import ExportDropdown from '@/app/components/shared/ExportDropdown';

export interface ClientSocialMediaVisibility {
  id: string;
  clientName: string;
  facebookProfile: string;
  instagramProfile: string;
  linkedinProfile: string;
  lastActivity: string;
  visibilityStatus: 'Visible' | 'Inactive' | 'Private';
  notes: string;
  signatureData?: string;
}

interface CSMVClientProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function CSMVClient({ canCreate, canEdit, canDelete }: CSMVClientProps) {
  const [records, setRecords] = useState<ClientSocialMediaVisibility[]>([]);
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | null>(null);
  const [currentRecord, setCurrentRecord] = useState<Partial<ClientSocialMediaVisibility>>({});

  const fetchRecords = async () => {
    setLoading(true);
    // Mock data for demonstration
    setRecords([
      {
        id: 'CSMV-001',
        clientName: 'Maria Santos',
        facebookProfile: 'https://facebook.com/mariasantos',
        instagramProfile: '@mariasantos',
        linkedinProfile: 'https://linkedin.com/in/mariasantos',
        lastActivity: '2026-07-14',
        visibilityStatus: 'Visible',
        notes: 'Highly active on LinkedIn'
      },
      {
        id: 'CSMV-002',
        clientName: 'Pedro Penduko',
        facebookProfile: 'https://facebook.com/pedrop',
        instagramProfile: 'N/A',
        linkedinProfile: 'N/A',
        lastActivity: '2026-06-20',
        visibilityStatus: 'Private',
        notes: 'Profile locked, limited visibility'
      }
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const exportToCSV = () => {
    if (records.length === 0) return;
    const headers = ['Client Name', 'Visibility Status', 'Facebook', 'Instagram', 'LinkedIn', 'Last Activity', 'Notes'];
    const rows = records.map(r => [
      r.clientName, r.visibilityStatus, r.facebookProfile, r.instagramProfile, r.linkedinProfile, r.lastActivity, r.notes
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => '"' + String(v || '') + '"').join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client_social_media_visibility_export.csv';
    link.click();
  };

  const handleExportPDF = () => {
    if (records.length === 0) return;
    const headers = ['Client Name', 'Visibility Status', 'Facebook', 'Instagram', 'LinkedIn', 'Last Activity'];
    const rows = records.map(r => [
      r.clientName, r.visibilityStatus, r.facebookProfile, r.instagramProfile, r.linkedinProfile, r.lastActivity
    ]);
    exportToPDF({
      title: 'Client Social Media Visibility Registry',
      description: 'Sun Life Financial - Record index tracking clients social media handles, account visibilities, and latest activities.',
      headers,
      rows,
      filename: 'client_social_media_visibility_export.pdf',
      stats: [
        { label: 'Total Clients', value: records.length },
        { label: 'Visible Profiles', value: records.filter(r => r.visibilityStatus === 'Visible').length },
        { label: 'Private Profiles', value: records.filter(r => r.visibilityStatus === 'Private').length }
      ]
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'word') => {
    if (records.length === 0) return;
    const headers = ['Client Name', 'Visibility Status', 'Facebook', 'Instagram', 'LinkedIn', 'Last Activity'];
    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      handleExportPDF();
    } else if (format === 'word') {
      const rows = records.map(r => [
        r.clientName, r.visibilityStatus, r.facebookProfile, r.instagramProfile, r.linkedinProfile, r.lastActivity
      ]);
      exportToDOCS(
        'Client Social Media Visibility Registry',
        headers,
        rows,
        'client_social_media_visibility_export.doc'
      );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Visible': return <Globe size={14} className="text-emerald-500" />;
      case 'Private': return <Lock size={14} className="text-amber-500" />;
      case 'Inactive': return <ShieldAlert size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const filteredRecords = records.filter(r => 
    r.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background text-text font-sans">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">Client Social Media Visibility (CSMV)</h1>
              <p className="text-sm text-text-secondary mt-1">Track and manage client social media profiles and visibility status.</p>
            </div>
            {canCreate && (
              <button onClick={() => { setCurrentRecord({}); setActiveModal('add'); }} className="flex items-center gap-2 bg-primary text-black font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/80 transition shadow-sm border border-[#e0b53c] hover:-translate-y-0.5">
                <Plus size={16} /> Add Profile
              </button>
            )}
          </div>

          <div className="bg-card border border-border/50 shadow-[0_2px_10px_rgb(0,0,0,0.04)] rounded-[20px] overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-card">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search client name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-text"
                />
              </div>
              <ExportDropdown onExport={handleExport} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider w-10">#</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Client Name</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Visibility Status</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Facebook</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Instagram</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">LinkedIn</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Last Activity</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-right sticky right-0 bg-surface-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={8} className="py-8 text-center text-text-secondary text-sm">Loading...</td></tr>
                  ) : filteredRecords.map((r, i) => (
                    <tr key={r.id} className="hover:bg-surface-2/50 transition group border-b border-slate-50 last:border-0">
                      <td className="py-2 px-3 text-text-secondary text-xs">{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-text">{r.clientName}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(r.visibilityStatus)}
                          <span className="text-text-secondary text-xs">{r.visibilityStatus}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-text-secondary text-xs">
                        {r.facebookProfile !== 'N/A' ? <a href={r.facebookProfile} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">Link <ExternalLink size={12}/></a> : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{r.instagramProfile}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">
                        {r.linkedinProfile !== 'N/A' ? <a href={r.linkedinProfile} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">Link <ExternalLink size={12}/></a> : 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{r.lastActivity}</td>
                      <td className="py-2 px-3 text-right sticky right-0 bg-card group-hover:bg-surface-2/50">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button onClick={() => { setCurrentRecord(r); setActiveModal('edit'); }} className="p-1.5 text-muted hover:text-[#F4C542] transition-colors bg-card border border-transparent hover:border-primary rounded-md shadow-sm" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => setRecords(records.filter(rec => rec.id !== r.id))} className="p-1.5 text-muted hover:text-red-500 transition-colors bg-card border border-transparent hover:border-red-500 rounded-md shadow-sm" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredRecords.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-text-secondary text-sm">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-text">{currentRecord.id ? 'Edit Profile' : 'Add Profile'}</h2>
                <p className="text-sm text-text-secondary">Manage visibility preferences.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-muted hover:text-text hover:bg-slate-200 rounded-xl transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={e => {
              e.preventDefault();
              if (currentRecord.id) {
                setRecords(records.map(r => r.id === currentRecord.id ? currentRecord as ClientSocialMediaVisibility : r));
              } else {
                setRecords([{ ...currentRecord, id: 'CSMV-' + Math.floor(Math.random() * 100000) } as ClientSocialMediaVisibility, ...records]);
              }
              setActiveModal(null);
            }} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={currentRecord.clientName || ''} onChange={e => setCurrentRecord({ ...currentRecord, clientName: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</label>
                  <select value={currentRecord.visibilityStatus || 'Visible'} onChange={e => setCurrentRecord({ ...currentRecord, visibilityStatus: e.target.value as any })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground">
                    <option value="Visible">Visible</option>
                    <option value="Private">Private</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Facebook URL</label>
                  <input type="text" value={currentRecord.facebookProfile || ''} onChange={e => setCurrentRecord({ ...currentRecord, facebookProfile: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Instagram Handle</label>
                  <input type="text" value={currentRecord.instagramProfile || ''} onChange={e => setCurrentRecord({ ...currentRecord, instagramProfile: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">LinkedIn URL</label>
                  <input type="text" value={currentRecord.linkedinProfile || ''} onChange={e => setCurrentRecord({ ...currentRecord, linkedinProfile: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Last Activity</label>
                  <input type="date" value={currentRecord.lastActivity || ''} onChange={e => setCurrentRecord({ ...currentRecord, lastActivity: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</label>
                  <textarea value={currentRecord.notes || ''} onChange={e => setCurrentRecord({ ...currentRecord, notes: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2">
                  <SignaturePad 
                    initialSignature={currentRecord.signatureData} 
                    onSignatureChange={(sig) => setCurrentRecord({ ...currentRecord, signatureData: sig || undefined })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-card border border-border text-text-secondary font-semibold text-sm rounded-xl hover:bg-surface-2 transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-primary border border-[#e0b53c] text-black font-semibold text-sm rounded-xl hover:bg-primary/80 transition shadow-sm hover:-translate-y-0.5">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
