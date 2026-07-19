'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import { Settings, Shield, FolderArchive, HelpCircle, Trash2, RotateCcw, MonitorSmartphone, Bell, Users, Globe, ExternalLink, Plus, Paintbrush, Sun, Moon, Lock, Key, ShieldAlert, Mail, CheckCircle, Wrench, Search, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function AdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'archive' | 'system' | 'general' | 'maintenance'>('features');
  const [profileName, setProfileName] = useState('');
  const [userId, setUserId] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
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

  // ─── Maintenance Management State ────────────────────────────────────────
  const [maintenanceSettings, setMaintenanceSettings] = useState<Record<string, boolean>>({});
  const [maintenanceUpdatedAt, setMaintenanceUpdatedAt] = useState<string | null>(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceSaved, setMaintenanceSaved] = useState(false);
  const [maintenanceSearch, setMaintenanceSearch] = useState('');
  const [showFullSystemConfirm, setShowFullSystemConfirm] = useState(false);

  // Module definitions for the maintenance UI
  const PLATFORM_MODULES = [
    { key: 'dashboard', label: 'Dashboard', description: 'Main dashboard and overview page' },
    { key: 'calendar', label: 'Calendar', description: 'Events and scheduling module' },
    { key: 'attendance', label: 'Attendance', description: 'Time tracking and attendance records' },
    { key: 'messages', label: 'Messages', description: 'Internal messaging and chat system' },
    { key: 'faq', label: 'FAQ', description: 'Frequently asked questions module' },
    { key: 'teams', label: 'Teams', description: 'Team management and organization' },
    { key: 'members', label: 'Members', description: 'Member directory and user management' },
    { key: 'profile', label: 'Profile', description: 'User profile settings and information' },
  ];

  const CS_MODULES = [
    { key: 'acr', label: 'ACR', description: 'Advisor Change Request' },
    { key: 'bcr', label: 'BCR', description: 'Beneficiary Change Request' },
    { key: 'aca', label: 'ACA', description: 'Account Change Application' },
    { key: 'fund_switching', label: 'Fund Switching', description: 'Investment fund switching' },
    { key: 'fund_withdrawal', label: 'Fund Withdrawal', description: 'Fund withdrawal processing' },
    { key: 'reinstatement', label: 'Reinstatement', description: 'Policy reinstatement' },
    { key: 'sro', label: 'SRO', description: 'Special Request Order' },
    { key: 'pdi', label: 'PDI', description: 'Pre-Delivery Inspection' },
    { key: 'cpst', label: 'CPST', description: 'Client Prospect Servicing Tracker' },
  ];

  // Load maintenance settings from Supabase
  const loadMaintenanceSettings = async () => {
    setMaintenanceLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_settings')
        .select('module_key, enabled, updated_at')
        .order('updated_at', { ascending: false });

      if (error) {
        // Table may not exist yet — silently fall back to defaults
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('maintenance_settings table not found. Run the SQL migration first.');
        } else {
          console.warn('Could not load maintenance settings:', error.message || error.code || 'Unknown error');
        }
        // Initialize with all modules disabled
        const defaults: Record<string, boolean> = {};
        [...PLATFORM_MODULES, ...CS_MODULES].forEach(m => { defaults[m.key] = false; });
        defaults['full_system'] = false;
        defaults['client_servicing'] = false;
        setMaintenanceSettings(defaults);
        return;
      }

      const settingsMap: Record<string, boolean> = {};
      let latestUpdate: string | null = null;

      (data ?? []).forEach((row: { module_key: string; enabled: boolean; updated_at: string }) => {
        settingsMap[row.module_key] = row.enabled;
        if (!latestUpdate || new Date(row.updated_at) > new Date(latestUpdate)) {
          latestUpdate = row.updated_at;
        }
      });

      setMaintenanceSettings(settingsMap);
      setMaintenanceUpdatedAt(latestUpdate);

      // Also sync the legacy maintenanceMode flag from full_system
      setMaintenanceMode(settingsMap['full_system'] === true);
    } catch (err: any) {
      console.warn('Maintenance settings unavailable:', err?.message || 'Unknown error');
      // Fall back to all-disabled defaults
      const defaults: Record<string, boolean> = {};
      [...PLATFORM_MODULES, ...CS_MODULES].forEach(m => { defaults[m.key] = false; });
      defaults['full_system'] = false;
      defaults['client_servicing'] = false;
      setMaintenanceSettings(defaults);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  // Save maintenance settings to Supabase
  const saveMaintenanceSettings = async () => {
    setMaintenanceSaving(true);
    try {
      const updates = Object.entries(maintenanceSettings).map(([module_key, enabled]) => ({
        module_key,
        enabled,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('maintenance_settings')
          .upsert(update, { onConflict: 'module_key' });
        if (error) {
          // Check if table doesn't exist
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            alert('The maintenance_settings table does not exist yet.\n\nPlease run the SQL migration in your Supabase SQL Editor first.\n(See supabase/maintenance_migration.sql)');
            return;
          }
          throw new Error(error.message || error.code || 'Database error');
        }
      }

      // Send notification about maintenance changes
      const enabledModules = Object.entries(maintenanceSettings)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

      if (enabledModules.length > 0) {
        await supabase.from('notifications').insert({
          title: 'Maintenance Mode Updated',
          description: enabledModules.includes('full_system')
            ? 'Full system maintenance has been enabled.'
            : `Maintenance enabled for: ${enabledModules.join(', ')}`,
          type: 'announcement',
          is_read: false
        });
      }

      setMaintenanceSaved(true);
      setMaintenanceUpdatedAt(new Date().toISOString());
      setTimeout(() => setMaintenanceSaved(false), 3000);
    } catch (err: any) {
      console.warn('Maintenance save error:', err?.message || 'Unknown error');
      alert(`Failed to save maintenance settings: ${err?.message || 'Unknown error'}`);
    } finally {
      setMaintenanceSaving(false);
    }
  };

  // Toggle a maintenance module
  const toggleMaintenanceModule = (key: string) => {
    setMaintenanceSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };

      // If toggling client_servicing group ON, also enable all sub-modules
      if (key === 'client_servicing' && !prev[key]) {
        CS_MODULES.forEach(m => { next[m.key] = true; });
      }
      // If toggling client_servicing group OFF, also disable all sub-modules
      if (key === 'client_servicing' && prev[key]) {
        CS_MODULES.forEach(m => { next[m.key] = false; });
      }

      return next;
    });
  };

  // Load maintenance settings on mount and subscribe to realtime updates
  useEffect(() => {
    loadMaintenanceSettings();

    const channel = supabase
      .channel('maintenance_settings_changes')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'maintenance_settings' },
        () => {
          loadMaintenanceSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setCurrentUserEmail(user.email || '');
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSendResetEmail = async () => {
    if (!currentUserEmail) {
      setPasswordError('User email not loaded yet.');
      return;
    }
    setResetLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    const { error } = await supabase.auth.resetPasswordForEmail(currentUserEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setResetLoading(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    }
  };

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

  const saveGeneralSettings = async () => {
    localStorage.setItem('sys_allow_registration', allowRegistration ? '1' : '0');
    
    const prevShow = localStorage.getItem('sys_show_announcements') === '1';
    const prevText = localStorage.getItem('sys_announcement_text') || '';
    
    localStorage.setItem('sys_show_announcements', showAnnouncements ? '1' : '0');
    localStorage.setItem('sys_announcement_text', announcementText);
    
    if (showAnnouncements && (!prevShow || prevText !== announcementText) && announcementText.trim() !== '') {
      try {
        await supabase.from('notifications').insert({
          title: 'New Announcement',
          description: announcementText.trim(),
          type: 'announcement',
          user_id: null,
          is_read: false
        });
      } catch (err) {
        console.error('Failed to broadcast global announcement:', err);
      }
    }
    
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
              { id: 'system', label: 'Account & Security', icon: Settings },
              { id: 'maintenance', label: 'Maintenance', icon: Wrench },
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              saveGeneralSettings();
                            }
                          }}
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

                <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                    <Lock size={20} className="text-amber-500" /> Security Settings
                  </h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Manage password credentials and account security settings.</p>

                  {passwordError && (
                    <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-sm font-semibold">
                      <ShieldAlert size={18} />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="flex items-center gap-3 p-4 mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-sm font-semibold">
                      <CheckCircle size={18} />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Change Password */}
                    <form onSubmit={handlePasswordChange} className="space-y-4 p-5 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Key size={16} /> Change Password
                      </h3>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">New Password</label>
                        <input
                          type="password"
                          placeholder="Minimum 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none"
                          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Confirm New Password</label>
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none"
                          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        {passwordLoading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>

                    {/* Forget Password / Email Reset */}
                    <div className="space-y-4 p-5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                      <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Mail size={16} /> Password Reset Link
                        </h3>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          Forgot your password? We can send a secure, password-reset verification link to your registered email address <strong>({currentUserEmail || 'loading...'})</strong>.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleSendResetEmail}
                          disabled={resetLoading}
                          className="px-6 py-2.5 rounded-xl border font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                        >
                          {resetLoading ? 'Sending...' : 'Send Password Reset Email'}
                        </button>
                        {resetEmailSent && (
                          <p className="text-xs text-emerald-500 font-semibold">
                            ✓ Verification link sent! Check your inbox.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick link to full Maintenance Management tab */}
                <div className="rounded-2xl p-6 md:p-8 border-l-4 border-l-orange-500" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  <h2 className="text-lg font-bold mb-2 text-orange-600 dark:text-orange-400 flex items-center gap-2"><Wrench size={20} /> Maintenance Mode</h2>
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    Manage full-system and per-module maintenance modes from the dedicated Maintenance tab.
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveTab('maintenance')}
                      className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-500/20"
                    >
                      Open Maintenance Management
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        {maintenanceSettings['full_system'] && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${maintenanceSettings['full_system'] ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                      </span>
                      <span className="text-sm font-bold opacity-70">
                        Full System: {maintenanceSettings['full_system'] ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MAINTENANCE TAB */}
            {activeTab === 'maintenance' && (
              <div className="grid gap-6">
                {/* Full System Maintenance Card */}
                <div className="rounded-2xl p-6 md:p-8 border-l-4 border-l-orange-500 relative overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                  {maintenanceSettings['full_system'] && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  )}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-bold mb-1 text-orange-600 dark:text-orange-400 flex items-center gap-2">
                          <AlertTriangle size={20} />
                          Enable Full System Maintenance
                        </h2>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                          When enabled, <strong>all pages</strong> become inaccessible to non-admin users. Only Admin Settings and Auth pages remain accessible.
                        </p>
                      </div>
                      <div onClick={() => {
                        if (!maintenanceSettings['full_system']) {
                          setShowFullSystemConfirm(true);
                        } else {
                          toggleMaintenanceModule('full_system');
                        }
                      }}>
                        <ToggleSwitch checked={maintenanceSettings['full_system'] || false} onChange={() => {}} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        {maintenanceSettings['full_system'] && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${maintenanceSettings['full_system'] ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                      </span>
                      <span className="text-sm font-bold opacity-70">
                        Status: {maintenanceSettings['full_system'] ? 'System Maintenance Active' : 'All Systems Operational'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Full System Confirm Modal */}
                {showFullSystemConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="max-w-md w-full rounded-3xl p-8 shadow-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                          <AlertTriangle className="text-orange-500" size={24} />
                        </div>
                        <h4 className="text-xl font-bold">Enable Full System Maintenance?</h4>
                      </div>
                      <p className="text-sm opacity-80 mb-6 leading-relaxed">
                        This will immediately block access for <strong>all non-admin users</strong> across the entire application. Active sessions will be redirected to the maintenance page.
                      </p>
                      <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 mb-6">
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">⚠️ All platform modules and client servicing modules will become inaccessible.</p>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowFullSystemConfirm(false)}
                          className="px-5 py-2.5 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            toggleMaintenanceModule('full_system');
                            setShowFullSystemConfirm(false);
                          }}
                          className="px-6 py-2.5 rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors"
                        >
                          Enable Maintenance
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search and Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search modules..."
                      value={maintenanceSearch}
                      onChange={(e) => setMaintenanceSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {maintenanceUpdatedAt && (
                      <span className="text-xs opacity-50">
                        Last updated: {new Date(maintenanceUpdatedAt).toLocaleString()}
                      </span>
                    )}
                    <button
                      onClick={saveMaintenanceSettings}
                      disabled={maintenanceSaving}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      <Save size={16} />
                      {maintenanceSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    {maintenanceSaved && <span className="text-emerald-500 font-bold text-sm">✓ Saved!</span>}
                  </div>
                </div>

                {maintenanceLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm mt-4 opacity-70">Loading maintenance settings...</p>
                  </div>
                ) : (
                  <>
                    {/* Platform Modules Section */}
                    <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <MonitorSmartphone size={20} className="text-amber-500" />
                        Platform Modules
                      </h2>
                      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Toggle maintenance for individual platform sections. Both admin and user pages are affected.</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {PLATFORM_MODULES
                          .filter(m => m.label.toLowerCase().includes(maintenanceSearch.toLowerCase()) || m.description.toLowerCase().includes(maintenanceSearch.toLowerCase()))
                          .map((mod) => (
                          <div key={mod.key} className={`flex items-start justify-between p-5 rounded-xl transition-all ${maintenanceSettings[mod.key] ? 'ring-2 ring-orange-500/30' : ''}`} style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                            <div className="pr-4">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm">{mod.label}</h3>
                                {maintenanceSettings[mod.key] && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                    MAINTENANCE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-1 opacity-70">{mod.description}</p>
                            </div>
                            <ToggleSwitch checked={maintenanceSettings[mod.key] || false} onChange={() => toggleMaintenanceModule(mod.key)} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Client Servicing Section */}
                    <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-lg font-bold flex items-center gap-2">
                            <Shield size={20} className="text-amber-500" />
                            Client Servicing
                          </h2>
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Toggle maintenance for client servicing modules. Use the group toggle to enable/disable all at once.</p>
                        </div>
                      </div>

                      {/* Group Toggle */}
                      <div className={`flex items-center justify-between p-5 rounded-xl mb-4 transition-all ${maintenanceSettings['client_servicing'] ? 'ring-2 ring-orange-500/30' : ''}`} style={{ backgroundColor: maintenanceSettings['client_servicing'] ? 'var(--surface-2)' : 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <div className="pr-4">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm">Client Servicing (All)</h3>
                            {maintenanceSettings['client_servicing'] && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                ALL LOCKED
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-1 opacity-70">Toggle maintenance for ALL client servicing modules at once</p>
                        </div>
                        <ToggleSwitch checked={maintenanceSettings['client_servicing'] || false} onChange={() => toggleMaintenanceModule('client_servicing')} />
                      </div>

                      {/* Individual CS Modules */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {CS_MODULES
                          .filter(m => m.label.toLowerCase().includes(maintenanceSearch.toLowerCase()) || m.description.toLowerCase().includes(maintenanceSearch.toLowerCase()))
                          .map((mod) => (
                          <div key={mod.key} className={`flex items-center justify-between p-4 rounded-xl transition-all ${maintenanceSettings[mod.key] || maintenanceSettings['client_servicing'] ? 'ring-2 ring-orange-500/20' : ''}`} style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                            <div className="pr-3">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-xs">{mod.label}</h3>
                                {(maintenanceSettings[mod.key] || maintenanceSettings['client_servicing']) && (
                                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                                )}
                              </div>
                              <p className="text-[10px] mt-0.5 opacity-60">{mod.description}</p>
                            </div>
                            <ToggleSwitch
                              checked={maintenanceSettings[mod.key] || maintenanceSettings['client_servicing'] || false}
                              onChange={() => {
                                if (!maintenanceSettings['client_servicing']) {
                                  toggleMaintenanceModule(mod.key);
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    {(() => {
                      const activeModules = Object.entries(maintenanceSettings).filter(([, v]) => v).map(([k]) => k);
                      if (activeModules.length === 0) return null;
                      return (
                        <div className="rounded-2xl p-5 border-l-4 border-l-amber-500" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-500" />
                            Active Maintenance ({activeModules.length} module{activeModules.length > 1 ? 's' : ''})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {activeModules.map(key => (
                              <span key={key} className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}
