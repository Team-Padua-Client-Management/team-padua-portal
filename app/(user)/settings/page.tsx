'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Eye, Moon, LayoutGrid, Save, CheckCircle } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function UserSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [userId, setUserId] = useState('');
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
        const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (data?.full_name) {
          setProfileName(data.full_name);
        }
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    localStorage.setItem('show_archived_cs', String(preferences.showArchivedCS));

    if (userId) {
      await supabase.from('profiles').update({ full_name: profileName }).eq('id', userId);
      // Dispatch profile update event to live-reload header/display names
      window.dispatchEvent(new Event('profile-update'));
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--text)' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header - We can render a basic mobile toggle or use Header */}
        <div style={{
          height: '64px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 2rem',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Intern Settings Center</h2>
          </div>
        </div>

        <main style={{ padding: '2rem', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
          {/* Settings Card */}
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '20px',
            padding: '2.5rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-theme)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)'
              }}>
                <Settings size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>User Preferences</h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Manage your display preferences and custom filters.
                </p>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Account Display Name (Rename) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Account Display Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter display name"
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              {/* Theme Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Workspace Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text)'
                  }}
                >
                  <option value="light">Light Mode (Default)</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              {/* Default landing page */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Default Entry Point</label>
                <select
                  value={preferences.defaultModule}
                  onChange={(e) => setPreferences({ ...preferences, defaultModule: e.target.value })}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    fontSize: '0.8rem',
                    outline: 'none',
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text)'
                  }}
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="portals">Portals</option>
                  <option value="calendar">Calendar</option>
                </select>
              </div>

              {/* Archive filtering option */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="showArchivedCS"
                  checked={preferences.showArchivedCS}
                  onChange={(e) => setPreferences({ ...preferences, showArchivedCS: e.target.checked })}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--text)',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="showArchivedCS" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Show Archived Client Servicing Items in Main Registries
                </label>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Custom External Portals Management */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>Custom External Portals</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Create quick-access shortcuts to primary service domains and external tools.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Portal Name (e.g. My Tool)"
                  value={newPortalName}
                  onChange={(e) => setNewPortalName(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Portal URL (https://...)"
                  value={newPortalUrl}
                  onChange={(e) => setNewPortalUrl(e.target.value)}
                  style={{
                    flex: 1.5,
                    minWidth: '180px',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
                <input
                  type="text"
                  placeholder="Icon Image URL (Optional)"
                  value={newPortalIconUrl}
                  onChange={(e) => setNewPortalIconUrl(e.target.value)}
                  style={{
                    flex: 1.5,
                    minWidth: '180px',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomPortal}
                  style={{
                    padding: '0.65rem 1.5rem',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--text)',
                    border: '1px solid var(--text)',
                    color: 'var(--background)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Add Portal
                </button>
              </div>

              {customPortals.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {customPortals.map((portal, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        backgroundColor: 'var(--surface-2)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{portal.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{portal.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomPortal(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF4444',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {saved ? (
                <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> Settings saved successfully!
                </span>
              ) : <span />}

              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 2rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--text)',
                  border: '1px solid var(--text)',
                  color: 'var(--background)',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-theme)',
                  transition: 'all 0.2s'
                }}
              >
                <Save size={14} /> Save Preferences
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
