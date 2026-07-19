'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, Lock, KeyRound, ShieldAlert, Mail, CheckCircle, 
  Save, MonitorSmartphone, Paintbrush, Globe, ExternalLink, 
  Plus, Trash2, Eye
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function UserSettings() {
  const [profileName, setProfileName] = useState('');
  const [userId, setUserId] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  
  // Tabs: general preferences vs security
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [currentTheme, setCurrentTheme] = useState('light');

  // Password & Security States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Preference Settings
  const [preferences, setPreferences] = useState({
    theme: 'light',
    density: 'comfortable',
    defaultModule: 'dashboard',
    showArchivedCS: false
  });

  const [saved, setSaved] = useState(false);
  const [customPortals, setCustomPortals] = useState<any[]>([]);
  const [newPortalName, setNewPortalName] = useState('');
  const [newPortalUrl, setNewPortalUrl] = useState('');
  const [newPortalIconUrl, setNewPortalIconUrl] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('custom_external_portals');
      if (stored) {
        setCustomPortals(JSON.parse(stored));
      }
      
      const theme = localStorage.getItem('theme') || 'light';
      setCurrentTheme(theme);
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

  useEffect(() => {
    const savedPrefs = localStorage.getItem('user_preferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
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

  const handleSavePreferences = () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    localStorage.setItem('show_archived_cs', String(preferences.showArchivedCS));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${checked ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <main className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8">
        
        {/* Page Banner Header */}
        <div className="relative overflow-hidden rounded-3xl p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 40px -10px rgba(0,0,0,0.05)' }}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Settings size={160} className="transform rotate-12" />
          </div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
              <Settings size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">User Preferences</h1>
              <p className="text-sm md:text-base mt-1" style={{ color: 'var(--text-secondary)' }}>
                Manage your layout configurations, visual options, and workspace settings.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          {[
            { id: 'general', label: 'General Preferences', icon: MonitorSmartphone },
            { id: 'security', label: 'Security & Password', icon: Lock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
          
          {/* GENERAL PREFERENCES TAB */}
          {activeTab === 'general' && (
            <div className="grid gap-6">
              
              {/* Theme Settings Preset Card */}
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-2"><Paintbrush size={20} className="text-amber-500" /> Theme Presets</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Select a workspace appearance profile.</p>

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
                        setPreferences({ ...preferences, theme: t.id });
                      }}
                      className={`flex flex-col items-center justify-between p-3 rounded-xl border-2 text-center transition-all cursor-pointer hover:scale-[1.02] hover:shadow-sm ${
                        preferences.theme === t.id ? 'border-amber-500 bg-amber-500/5' : 'border-border bg-card'
                      }`}
                    >
                      <div className={`w-full h-8 rounded-lg ${t.bg} border ${t.border} flex items-center justify-center mb-2.5 relative overflow-hidden`}>
                        <div className="absolute top-1.5 left-1.5 flex gap-1 items-center">
                          <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                          <span className="text-[6px] font-bold font-mono opacity-80" style={{ color: 'var(--text-secondary)' }}>Aa</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-foreground">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Config */}
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6"><Globe size={20} className="text-amber-500" /> Platform Preferences</h2>
                
                <div className="space-y-6">
                  {/* Default Entry page */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div>
                      <h3 className="font-bold text-sm">Default Workspace Entry Point</h3>
                      <p className="text-xs opacity-75 mt-1">Specify which node of the platform is targeted on sign in.</p>
                    </div>
                    <select
                      value={preferences.defaultModule}
                      onChange={(e) => setPreferences({ ...preferences, defaultModule: e.target.value })}
                      className="p-2.5 rounded-xl border outline-none text-sm"
                      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                    >
                      <option value="dashboard">Dashboard</option>
                      <option value="portals">Portals</option>
                      <option value="calendar">Calendar</option>
                    </select>
                  </div>

                  {/* Show Archived CS Items */}
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div>
                      <h3 className="font-bold text-sm">Show Archived Client Servicing Items</h3>
                      <p className="text-xs opacity-75 mt-1">Enable visibility of archived client entries in primary lists.</p>
                    </div>
                    <ToggleSwitch 
                      checked={preferences.showArchivedCS} 
                      onChange={() => setPreferences({ ...preferences, showArchivedCS: !preferences.showArchivedCS })} 
                    />
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <button 
                      onClick={handleSavePreferences}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md flex items-center gap-2"
                    >
                      <Save size={16} /> Save Preferences
                    </button>
                    {saved && <span className="text-green-500 font-bold text-sm">Preferences applied!</span>}
                  </div>
                </div>
              </div>

              {/* Custom External Portals */}
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><ExternalLink size={20} className="text-amber-500" /> Custom External Portals</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Create quick-access shortcuts to primary service domains and tools.</p>
                
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <input
                    type="text"
                    placeholder="Portal Name (e.g. Analytics Tool)"
                    value={newPortalName}
                    onChange={(e) => setNewPortalName(e.target.value)}
                    className="flex-1 p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <input
                    type="text"
                    placeholder="Portal URL (https://...)"
                    value={newPortalUrl}
                    onChange={(e) => setNewPortalUrl(e.target.value)}
                    className="flex-1.5 p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <input
                    type="text"
                    placeholder="Icon Image URL (Optional)"
                    value={newPortalIconUrl}
                    onChange={(e) => setNewPortalIconUrl(e.target.value)}
                    className="flex-1.5 p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                    style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                  <button
                    onClick={handleAddCustomPortal}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-md flex items-center gap-2 justify-center shrink-0 cursor-pointer"
                  >
                    <Plus size={16} /> Add Portal
                  </button>
                </div>

                {customPortals.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customPortals.map((portal, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 rounded-xl transition-all" 
                        style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {portal.iconUrl ? (
                            <img src={portal.iconUrl} alt="" className="w-8 h-8 rounded-lg object-contain shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                              {portal.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm truncate">{portal.name}</h4>
                            <p className="text-xs opacity-60 truncate">{portal.url}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveCustomPortal(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* SECURITY & PASSWORD TAB */}
          {activeTab === 'security' && (
            <div className="grid gap-6">
              
              {/* Account Information Display Name */}
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                <h2 className="text-lg font-bold mb-2">Account Information</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Update your display details.</p>

                <div className="max-w-md space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">Display Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none text-sm"
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
                      className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all hover:opacity-90 cursor-pointer"
                    >
                      Save Profile Name
                    </button>
                    {saved && <span className="text-green-500 font-bold text-sm">Saved!</span>}
                  </div>
                </div>
              </div>

              {/* Password Credentials */}
              <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 4px 20px -10px rgba(0,0,0,0.05)' }}>
                <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Lock size={20} className="text-amber-500" /> Security Credentials
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
                  {/* Change Password Form */}
                  <form onSubmit={handlePasswordChange} className="space-y-4 p-5 rounded-xl border" style={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    <h3 className="text-sm font-bold flex items-center gap-2">
                      <KeyRound size={16} /> Change Password
                    </h3>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 opacity-70">New Password</label>
                      <input
                        type="password"
                        placeholder="Minimum 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none text-sm"
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
                        className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                    >
                      {passwordLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>

                  {/* Reset Password Link */}
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
                        className="px-6 py-2.5 rounded-xl border font-bold transition-all hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
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

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
