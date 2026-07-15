'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import { Settings, Shield, FolderArchive, HelpCircle, Trash2, RotateCcw, MonitorSmartphone, Bell, Users, Globe, ExternalLink, Plus, Paintbrush, Sun, Moon } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function AdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'archive' | 'system' | 'general'>('features');
  const [profileName, setProfileName] = useState('');
  const [userId, setUserId] = useState('');
  const [saved, setSaved] = useState(false);
  const [customPortals, setCustomPortals] = useState<any[]>([]);
  const [newPortalName, setNewPortalName] = useState('');
  const [newPortalUrl, setNewPortalUrl] = useState('');
  const [newPortalIconUrl, setNewPortalIconUrl] = useState('');
  const [currentTheme, setCurrentTheme] = useState('light');

  // General System Settings
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const [announcementText, setAnnouncementText] = useState('Welcome to the portal!');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('custom_external_portals');
      if (stored) {
        setCustomPortals(JSON.parse(stored));
      }
      
      const theme = localStorage.getItem('theme') || 'light';
      setCurrentTheme(theme);
      
      const reg = localStorage.getItem('sys_allow_registration');
      if (reg) setAllowRegistration(reg === '1');
      
      const ann = localStorage.getItem('sys_show_announcements');
      if (ann) setShowAnnouncements(ann === '1');
      
      const annText = localStorage.getItem('sys_announcement_text');
      if (annText) setAnnouncementText(annText);
      
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAddCustomPortal = () => {
    if (!newPortalName || !newPortalUrl) return;
    let url = newPortalUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const updated = [...customPortals, { name: newPortalName, url, iconUrl: newPortalIconUrl }];
    setCustomPortals(updated);
    localStorage.setItem('custom_external_portals', JSON.stringify(updated));
    setNewPortalName('');
    setNewPortalUrl('');
    setNewPortalIconUrl('');
  };

  const handleRemoveCustomPortal = (index: number) => {
    const updated = customPortals.filter((_, idx) => idx !== index);
    setCustomPortals(updated);
    localStorage.setItem('custom_external_portals', JSON.stringify(updated));
  };
  
  const [features, setFeatures] = useState({
    cpst: true,
    acr: true,
    cpc: true,
    fst: true,
    mngt: true,
    ppu: true,
  });

  const [archivedItems, setArchivedItems] = useState<{
    module: string;
    id: string;
    title: string;
    subtitle: string;
    date: string;
  }[]>([]);

  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [showMaintenanceConfirm, setShowMaintenanceConfirm] = useState(false);

  useEffect(() => {
    const savedFeatures = localStorage.getItem('cs_features');
    if (savedFeatures) {
      try {
        setFeatures(JSON.parse(savedFeatures));
      } catch (e) {
        console.error(e);
      }
    }

    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (data?.full_name) {
          setProfileName(data.full_name);
        }
      }
    }
    fetchProfile();
    loadArchivedItems();

    try {
      const m = localStorage.getItem('site_maintenance');
      setMaintenanceMode(!!m && m !== '0');
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadArchivedItems = async () => {
    setLoading(true);
    const items: typeof archivedItems = [];

    const cpstArchived = JSON.parse(localStorage.getItem('archived_cpst') || '[]');
    if (cpstArchived.length > 0) {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const clients = await res.json();
          clients.forEach((c: any) => {
            if (cpstArchived.includes(c.id)) {
              items.push({
                module: 'CPST',
                id: c.id,
                title: c.name,
                subtitle: c.relationship || 'Prospect',
                date: c.birthdate || '',
              });
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    const modules = [
      { name: 'ACR', table: 'acr_requests', titleCol: 'policy_owner', subtitleCol: 'policy_number' },
      { name: 'CPC', table: 'cpc_records', titleCol: 'policy_owner', subtitleCol: 'policy_number' },
      { name: 'FST', table: 'fst_requests', titleCol: 'policy_owner', subtitleCol: 'policy_number' },
      { name: 'MNGT', table: 'mngt_records', titleCol: 'policy_owner', subtitleCol: 'policy_number' },
      { name: 'PPU', table: 'ppu_records', titleCol: 'policy_owner', subtitleCol: 'policy_number' },
    ];

    for (const m of modules) {
      const archivedIds = JSON.parse(localStorage.getItem(`archived_${m.name.toLowerCase()}`) || '[]');
      if (archivedIds.length > 0) {
        try {
          const { data } = await supabase.from(m.table).select('*').in('id', archivedIds);
          if (data) {
            data.forEach((row: any) => {
              items.push({
                module: m.name,
                id: row.id,
                title: row[m.titleCol],
                subtitle: row[m.subtitleCol],
                date: row.date_processed || '',
              });
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    setArchivedItems(items);
    setLoading(false);
  };

  const toggleFeature = (key: keyof typeof features) => {
    const next = { ...features, [key]: !features[key] };
    setFeatures(next);
    localStorage.setItem('cs_features', JSON.stringify(next));
  };

  const saveGeneralSettings = () => {
    localStorage.setItem('sys_allow_registration', allowRegistration ? '1' : '0');
    localStorage.setItem('sys_show_announcements', showAnnouncements ? '1' : '0');
    localStorage.setItem('sys_announcement_text', announcementText);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleUnarchive = (module: string, id: string) => {
    const key = `archived_${module.toLowerCase()}`;
    const archived = JSON.parse(localStorage.getItem(key) || '[]');
    const next = archived.filter((item: string) => item !== id);
    localStorage.setItem(key, JSON.stringify(next));
    loadArchivedItems();
  };

  const handlePermanentDelete = async (module: string, id: string) => {
    if (!confirm('Are you sure you want to permanently delete this record from the database? This cannot be undone.')) return;
    try {
      if (module === 'CPST') {
        await fetch(`/api/clients?id=${id}`, { method: 'DELETE' });
      } else {
        const tableMap: Record<string, string> = {
          ACR: 'acr_requests',
          CPC: 'cpc_records',
          FST: 'fst_requests',
          MNGT: 'mngt_records',
          PPU: 'ppu_records'
        };
        await supabase.from(tableMap[module]).delete().eq('id', id);
      }
      handleUnarchive(module, id);
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    }
  };

  // Switch UI Component
  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${checked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8">
          
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-3xl p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 40px -10px rgba(0,0,0,0.05)' }}>
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Settings size={160} className="transform rotate-12" />
            </div>
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
                <Settings size={32} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Settings</h1>
                <p className="text-sm md:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Manage the core infrastructure, modules, and administrative preferences.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
            {[
              { id: 'general', label: 'General', icon: MonitorSmartphone },
              { id: 'features', label: 'Features', icon: Shield },
              { id: 'archive', label: 'Registry Archive', icon: FolderArchive },
              { id: 'system', label: 'Account & Maintenance', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'archive') loadArchivedItems();
                }}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="grid gap-6">
                <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Globe size={20} className="text-amber-500" /> Platform Preferences</h2>
                  
                  <div className="space-y-6">
                    {/* Theme Mode Expansion Setting */}
                    <div className="mb-6 p-5 rounded-2xl border border-border/80 bg-muted/10">
                      <h3 className="font-bold flex items-center gap-2 mb-2 text-sm"><Paintbrush size={16} className="text-amber-500" /> Platform Theme Mode</h3>
                      <p className="text-xs text-muted-foreground mb-4">Select a system appearance preset. This updates dashboard headers, widgets, client management panels, and forms immediately.</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { id: 'light', name: 'Light Slate', bg: 'bg-[#F6F7FB]', text: 'text-slate-800', border: 'border-slate-300', dot: 'bg-[#F4C542]' },
                          { id: 'dark', name: 'Charcoal Dark', bg: 'bg-[#0F1117]', text: 'text-slate-200', border: 'border-slate-800', dot: 'bg-[#F4C542]' },
                          { id: 'midnight', name: 'Midnight Blue', bg: 'bg-[#070913]', text: 'text-[#F1F5F9]', border: 'border-[#3B82F6]/30', dot: 'bg-[#3B82F6]' },
                          { id: 'forest', name: 'Forest Green', bg: 'bg-[#09110E]', text: 'text-[#ECFDF5]', border: 'border-[#10B981]/30', dot: 'bg-[#10B981]' },
                          { id: 'sunset', name: 'Sunset Warm', bg: 'bg-[#120B09]', text: 'text-[#FFF7ED]', border: 'border-[#F97316]/30', dot: 'bg-[#F97316]' },
                          { id: 'slate', name: 'Slate Steel', bg: 'bg-[#0F172A]', text: 'text-[#F8FAFC]', border: 'border-[#38BDF8]/30', dot: 'bg-[#38BDF8]' }
                        ].map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setCurrentTheme(t.id);
                              localStorage.setItem('theme', t.id);
                              document.documentElement.setAttribute('data-theme', t.id);
                              const isDark = ["dark", "midnight", "forest", "sunset", "slate"].includes(t.id);
                              if (isDark) {
                                document.documentElement.classList.add('dark');
                              } else {
                                document.documentElement.classList.remove('dark');
                              }
                              window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: t.id } }));
                            }}
                            className={`flex flex-col items-center justify-between p-3 rounded-xl border-2 text-center transition-all cursor-pointer hover:scale-[1.02] hover:shadow-sm ${
                              currentTheme === t.id ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-card'
                            }`}
                          >
                            <div className={`w-full h-8 rounded-lg ${t.bg} border ${t.border} flex items-center justify-center mb-2.5 relative overflow-hidden`}>
                              <div className="absolute top-1.5 left-1.5 flex gap-1 items-center">
                                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                                <span className="text-[6px] font-bold font-mono opacity-80" style={{ color: 'var(--text-secondary)' }}>Aa</span>
                              </div>
                              <div className="w-4/5 h-1 bg-border/50 absolute bottom-2 rounded-sm" />
                              <div className="w-1/2 h-1 bg-border/30 absolute bottom-1 rounded-sm" />
                            </div>
                            <span className="text-xs font-bold text-foreground">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div>
                        <h3 className="font-bold flex items-center gap-2"><Users size={16} /> Allow User Registration</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Enable or disable new users from signing up to the platform.</p>
                      </div>
                      <ToggleSwitch checked={allowRegistration} onChange={() => setAllowRegistration(!allowRegistration)} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <div>
                        <h3 className="font-bold flex items-center gap-2"><Bell size={16} /> Global Announcements</h3>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Show a global announcement banner at the top of user dashboards.</p>
                      </div>
                      <ToggleSwitch checked={showAnnouncements} onChange={() => setShowAnnouncements(!showAnnouncements)} />
                    </div>

                    {showAnnouncements && (
                      <div className="pl-4 border-l-2 border-amber-500 ml-2 space-y-2">
                        <label className="text-sm font-bold">Announcement Text</label>
                        <textarea 
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-none"
                          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                          rows={2}
                          placeholder="Enter announcement text..."
                        />
                      </div>
                    )}
                    
                    <div className="pt-4 flex items-center gap-4">
                      <button 
                        onClick={saveGeneralSettings}
                        className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md hover:shadow-lg"
                      >
                        Save Preferences
                      </button>
                      {saved && <span className="text-green-500 font-bold text-sm">Settings applied!</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FEATURES TAB */}
            {activeTab === 'features' && (
              <div className="grid gap-8">
                <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><Shield size={20} className="text-amber-500" /> Servicing Modules</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(features).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between p-5 rounded-xl transition-all" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div className="pr-4">
                          <h3 className="font-bold text-sm uppercase tracking-wide">{key} Module</h3>
                          <p className="text-xs mt-1 opacity-70">Toggle visibility and access control for this specific registry module.</p>
                        </div>
                        <ToggleSwitch checked={value} onChange={() => toggleFeature(key as any)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* External Portals */}
                <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><ExternalLink size={20} className="text-amber-500" /> Custom External Portals</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Create quick-access shortcuts to primary service domains and external tools for dashboards.</p>
                  
                  <div className="flex flex-col md:flex-row gap-3 mb-6">
                    <input
                      type="text"
                      placeholder="Portal Name (e.g. Analytics Tool)"
                      value={newPortalName}
                      onChange={(e) => setNewPortalName(e.target.value)}
                      className="flex-1 p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                    <input
                      type="text"
                      placeholder="URL (https://...)"
                      value={newPortalUrl}
                      onChange={(e) => setNewPortalUrl(e.target.value)}
                      className="flex-[1.5] p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none"
                      style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                    <button
                      onClick={handleAddCustomPortal}
                      className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <Plus size={18} /> Add
                    </button>
                  </div>

                  {customPortals.length > 0 && (
                    <div className="space-y-3">
                      {customPortals.map((portal, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{portal.name}</span>
                            <span className="text-xs opacity-70 mt-0.5">{portal.url}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveCustomPortal(idx)}
                            className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors text-sm font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ARCHIVE TAB */}
            {activeTab === 'archive' && (
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                <h2 className="text-lg font-bold mb-2">Archived Records</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Review, restore, or permanently purge records that have been archived.</p>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm mt-4 opacity-70">Loading archives...</p>
                  </div>
                ) : archivedItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--border)' }}>
                    <FolderArchive size={40} className="mx-auto text-slate-400 mb-3" />
                    <p className="font-medium text-slate-500">No archived records found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                          <th className="pb-3 px-4 font-bold opacity-70">Module</th>
                          <th className="pb-3 px-4 font-bold opacity-70">Client / Title</th>
                          <th className="pb-3 px-4 font-bold opacity-70">Details</th>
                          <th className="pb-3 px-4 font-bold opacity-70">Date</th>
                          <th className="pb-3 px-4 font-bold opacity-70 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archivedItems.map((item) => (
                          <tr key={`${item.module}-${item.id}`} className="border-b last:border-0 hover:bg-slate-50/5 dark:hover:bg-slate-800/30 transition-colors" style={{ borderColor: 'var(--border)' }}>
                            <td className="py-4 px-4">
                              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800">{item.module}</span>
                            </td>
                            <td className="py-4 px-4 font-bold">{item.title}</td>
                            <td className="py-4 px-4 opacity-70">{item.subtitle}</td>
                            <td className="py-4 px-4 opacity-70">{item.date}</td>
                            <td className="py-4 px-4 text-right space-x-2">
                              <button
                                onClick={() => handleUnarchive(item.module, item.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-bold transition-colors"
                              >
                                <RotateCcw size={14} /> Restore
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(item.module, item.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold transition-colors"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SYSTEM TAB */}
            {activeTab === 'system' && (
              <div className="grid gap-6">
                <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-lg font-bold mb-2">Account Information</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Update your administrative account details.</p>

                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Display Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none"
                        style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={async () => {
                          if (userId) {
                            const { error } = await supabase.from('profiles').update({ full_name: profileName }).eq('id', userId);
                            if (!error) {
                              setSaved(true);
                              setTimeout(() => setSaved(false), 3000);
                              window.dispatchEvent(new Event('profile-update'));
                            }
                          }
                        }}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all hover:opacity-90"
                      >
                        Save Profile
                      </button>
                      {saved && <span className="text-emerald-500 font-bold text-sm">Saved!</span>}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-6 md:p-8 border-l-4 border-l-orange-500" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-lg font-bold mb-2 text-orange-600 dark:text-orange-400">Maintenance Mode</h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Enable maintenance mode to temporarily block all non-admin user access across the application. A maintenance screen will be displayed.
                  </p>

                  <div className="flex items-center gap-4">
                    {!maintenanceMode ? (
                      <button
                        onClick={() => setShowMaintenanceConfirm(true)}
                        className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                      >
                        Enable Maintenance Mode
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          localStorage.removeItem('site_maintenance');
                          await supabase.from('notifications').insert({
                            title: 'Maintenance Complete',
                            description: 'The system maintenance is now complete and all systems are operational.',
                            type: 'announcement',
                            is_read: false
                          });
                          window.dispatchEvent(new CustomEvent('maintenance-mode-change'));
                          setMaintenanceMode(false);
                        }}
                        className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
                      >
                        Disable Maintenance Mode
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        {maintenanceMode && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${maintenanceMode ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                      </span>
                      <span className="text-sm font-bold opacity-70">
                        Status: {maintenanceMode ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {showMaintenanceConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="max-w-md w-full rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <h4 className="text-xl font-bold mb-3">Enable Maintenance?</h4>
                      <p className="text-sm opacity-80 mb-8 leading-relaxed">
                        This action will immediately restrict access for all regular users. Active sessions will be intercepted by the maintenance screen. Proceed?
                      </p>
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => setShowMaintenanceConfirm(false)} 
                          className="px-5 py-2.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            localStorage.setItem('site_maintenance', '1');
                            await supabase.from('notifications').insert({
                              title: 'System Maintenance',
                              description: 'The system is now under maintenance. Certain features may be unavailable.',
                              type: 'announcement',
                              is_read: false
                            });
                            window.dispatchEvent(new CustomEvent('maintenance-mode-change'));
                            setMaintenanceMode(true);
                            setShowMaintenanceConfirm(false);
                          }}
                          className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
