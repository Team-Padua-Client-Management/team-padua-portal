"use client";

import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Plus, ExternalLink, Globe, Lock, ShieldAlert, Download, Users } from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import SignaturePad from '@/app/components/ui/SignaturePad';
import { exportToPDF, exportToDOCS } from '@/app/lib/export';
import ExportDropdown from '@/app/components/shared/ExportDropdown';
import ClientSelector from '@/app/components/shared/ClientSelector';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";

export interface ClientSocialMediaVisibility {
  id: string;
  client_id?: string;
  client?: { client_name: string; policy_number: string | null };
  visibility_status: 'Visible' | 'Inactive' | 'Private';
  facebook_profile?: string;
  instagram_profile?: string;
  linkedin_profile?: string;
  last_activity?: string;
  notes?: string;
  signature_data?: string;
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
    try {
      const { data, error } = await supabase.from('social_media_visibility').select(`
        *,
        client:cpst_clients(client_name, policy_number)
      `);
      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const exportToCSV = () => {
    if (records.length === 0) return;
    const headers = ['Client Name', 'Visibility Status', 'Facebook', 'Instagram', 'LinkedIn', 'Last Activity', 'Notes'];
    const rows = records.map(r => [
      r.client?.client_name || '', r.visibility_status, r.facebook_profile || 'N/A', r.instagram_profile || 'N/A', r.linkedin_profile || 'N/A', r.last_activity || 'N/A', r.notes || ''
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
      r.client?.client_name || '', r.visibility_status, r.facebook_profile || 'N/A', r.instagram_profile || 'N/A', r.linkedin_profile || 'N/A', r.last_activity || 'N/A'
    ]);
    exportToPDF({
      title: 'Client Social Media Visibility Registry',
      description: 'Sun Life Financial - Record index tracking clients social media handles, account visibilities, and latest activities.',
      headers,
      rows,
      filename: 'client_social_media_visibility_export.pdf',
      stats: [
        { label: 'Total Clients', value: records.length },
        { label: 'Visible Profiles', value: records.filter(r => r.visibility_status === 'Visible').length },
        { label: 'Private Profiles', value: records.filter(r => r.visibility_status === 'Private').length }
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
        r.client?.client_name || '', r.visibility_status, r.facebook_profile || 'N/A', r.instagram_profile || 'N/A', r.linkedin_profile || 'N/A', r.last_activity || 'N/A'
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
    r.client?.client_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.client?.policy_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.text_52}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.container_53}>
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.div_54}>
          <div className={styles.container_55}>
            <div>
              <h1 className={styles.text_56}>Client Social Media Visibility (CSMV)</h1>
              <p className={styles.table_57}>Track and manage client social media profiles and visibility status.</p>
            </div>
            <div className={styles.container_58}>
              {canCreate && (
                <button onClick={() => { setCurrentRecord({}); setActiveModal('add'); }} className={styles.table_60}>
                  <Plus size={14} /> Add Profile
                </button>
              )}
            </div>
          </div>

          <div className={styles.container_61}>
            <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'TOTAL PROFILES', count: records.length, link: 'PROFILES', color: 'text-foreground', icon: Users, isYellowBorder: true },
                { label: 'VISIBLE PROFILES', count: records.filter(r => r.visibility_status === 'Visible').length, link: 'PUBLIC', color: 'text-green-600 dark:text-green-400', icon: Globe },
                { label: 'PRIVATE PROFILES', count: records.filter(r => r.visibility_status === 'Private').length, link: 'PRIVATE', color: 'text-[#A97800] dark:text-[#F4C542]', icon: Lock },
                { label: 'INACTIVE PROFILES', count: records.filter(r => r.visibility_status === 'Inactive').length, link: 'INACTIVE', color: 'text-red-500', icon: ShieldAlert },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className={`${styles.card_227} ${
                      stat.isYellowBorder ? 'border-primary/40 ring-1 ring-[#F4C542]/10' : 'border-border'
                    } flex flex-col justify-between`}
                  >
                    <div className={styles.table_63}>
                      <span>{stat.label}</span>
                      <Icon size={12} className={styles.text_64} />
                    </div>
                    <div className={styles.container_65}>
                      <span className={styles.text_66}>{stat.count}</span>
                      <span className={`${styles.table_228} ${stat.color}`}>{stat.link}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.card_73}>
            <div className={styles.container_74}>
              <Search className={styles.text_75} />
              <input
                type="text"
                placeholder="Search client name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={styles.text_76}
              />
            </div>
            <div className={styles.container_77}>
              <ExportDropdown onExport={handleExport} />
            </div>
          </div>

          <div className={styles.card_85}>
            <div className={styles.div_86}>
              <table className={styles.text_87}>
                <thead>
                  <tr className={styles.table_88}>
                    <th className={styles.text_89}>#</th>
                    <th className={styles.text_93}>Client Name</th>
                    <th className={styles.text_93}>Visibility Status</th>
                    <th className={styles.text_93}>Facebook</th>
                    <th className={styles.text_93}>Instagram</th>
                    <th className={styles.text_93}>LinkedIn</th>
                    <th className={styles.text_93}>Last Activity</th>
                    <th className={`${styles.text_93} text-right sticky right-0 bg-surface-2`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.div_96}>
                  {loading ? (
                    <tr><td colSpan={8} className="py-8 text-center text-text-secondary text-sm">Loading...</td></tr>
                  ) : filteredRecords.map((r, i) => (
                    <tr key={r.id} className={`${styles.table_99} group border-b border-border/40 last:border-0`}>
                      <td className={styles.text_100}>{i + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-text text-xs">
                        {r.client?.client_name || <span className="text-muted-foreground italic">No Client</span>}
                        <div className="text-[10px] text-text-secondary font-normal">{r.client?.policy_number}</div>
                      </td>
                      <td className={styles.text_107}>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(r.visibility_status)}
                          <span className="text-text-secondary text-xs">{r.visibility_status}</span>
                        </div>
                      </td>
                      <td className={styles.text_107}>
                        {r.facebook_profile && r.facebook_profile !== 'N/A' ? <a href={r.facebook_profile} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">Link <ExternalLink size={12}/></a> : 'N/A'}
                      </td>
                      <td className={styles.text_107}>{r.instagram_profile || 'N/A'}</td>
                      <td className={styles.text_107}>
                        {r.linkedin_profile && r.linkedin_profile !== 'N/A' ? <a href={r.linkedin_profile} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">Link <ExternalLink size={12}/></a> : 'N/A'}
                      </td>
                      <td className={styles.text_107}>{r.last_activity || 'N/A'}</td>
                      <td className="py-2 px-3 text-right sticky right-0 bg-card group-hover:bg-surface-2/50 text-xs">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button onClick={() => { setCurrentRecord(r); setActiveModal('edit'); }} className="p-1.5 text-muted hover:text-[#F4C542] transition-colors bg-card border border-transparent hover:border-primary rounded-md shadow-sm" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={async () => {
                              try {
                                await supabase.from('social_media_visibility').delete().eq('id', r.id);
                                fetchRecords();
                              } catch (err) {
                                console.error(err);
                              }
                            }} className="p-1.5 text-muted hover:text-red-500 transition-colors bg-card border border-transparent hover:border-red-500 rounded-md shadow-sm" title="Delete">
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
            
            <form onSubmit={async e => {
              e.preventDefault();
              try {
                const payload = {
                  client_id: currentRecord.client_id,
                  visibility_status: currentRecord.visibility_status || 'Visible',
                  facebook_profile: currentRecord.facebook_profile || null,
                  instagram_profile: currentRecord.instagram_profile || null,
                  linkedin_profile: currentRecord.linkedin_profile || null,
                  last_activity: currentRecord.last_activity || null,
                  notes: currentRecord.notes || null,
                  signature_data: currentRecord.signature_data || null
                };
                if (currentRecord.id) {
                  await supabase.from('social_media_visibility').update(payload).eq('id', currentRecord.id);
                } else {
                  await supabase.from('social_media_visibility').insert([payload]);
                }
                fetchRecords();
                setActiveModal(null);
              } catch (err) {
                console.error(err);
              }
            }} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Client *</label>
                  <ClientSelector
                    value={currentRecord.client_id || ''}
                    onChange={(id) => setCurrentRecord({ ...currentRecord, client_id: id })}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Status</label>
                  <select value={currentRecord.visibility_status || 'Visible'} onChange={e => setCurrentRecord({ ...currentRecord, visibility_status: e.target.value as any })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground">
                    <option value="Visible">Visible</option>
                    <option value="Private">Private</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Facebook URL</label>
                  <input type="text" value={currentRecord.facebook_profile || ''} onChange={e => setCurrentRecord({ ...currentRecord, facebook_profile: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Instagram Handle</label>
                  <input type="text" value={currentRecord.instagram_profile || ''} onChange={e => setCurrentRecord({ ...currentRecord, instagram_profile: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">LinkedIn URL</label>
                  <input type="text" value={currentRecord.linkedin_profile || ''} onChange={e => setCurrentRecord({ ...currentRecord, linkedin_profile: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Last Activity</label>
                  <input type="date" value={currentRecord.last_activity || ''} onChange={e => setCurrentRecord({ ...currentRecord, last_activity: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notes</label>
                  <textarea value={currentRecord.notes || ''} onChange={e => setCurrentRecord({ ...currentRecord, notes: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>
                <div className="col-span-2">
                  <SignaturePad 
                    initialSignature={currentRecord.signature_data} 
                    onSignatureChange={(sig) => setCurrentRecord({ ...currentRecord, signature_data: sig || undefined })}
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
