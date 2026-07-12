'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/admin/AdminHeader/page';
import Sidebar from '@/app/components/admin/AdminSidebar/page';
import { Settings, Shield, FolderArchive, Save, HelpCircle, ToggleLeft, ToggleRight, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function AdminSettings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'archive' | 'system'>('features');
  const [profileName, setProfileName] = useState('');
  const [userId, setUserId] = useState('');
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
  
  // Feature flags stored in localStorage for persistence
  const [features, setFeatures] = useState({
    cpst: true,
    acr: true,
    cpc: true,
    fst: true,
    mngt: true,
    ppu: true,
  });

  // Archive lists
  const [archivedItems, setArchivedItems] = useState<{
    module: string;
    id: string;
    title: string;
    subtitle: string;
    date: string;
  }[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load feature settings
    const savedFeatures = localStorage.getItem('cs_features');
    if (savedFeatures) {
      try {
        setFeatures(JSON.parse(savedFeatures));
      } catch (e) {
        console.error(e);
      }
    }

    // Load profile
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

    // Load archived items from localStorage
    loadArchivedItems();
  }, []);

  const loadArchivedItems = async () => {
    setLoading(true);
    const items: typeof archivedItems = [];

    // CPST
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

    // Supabase modules (ACR, CPC, FST, MNGT, PPU)
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--text)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main style={{ padding: '2rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '2rem',
            backgroundColor: 'var(--surface)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-theme)',
            marginBottom: '2rem',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              backgroundColor: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text)'
            }}>
              <Settings size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Control Terminal Settings</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                Configure Client Servicing modules, manage archived registries, and set workspace options.
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            borderBottom: '1px solid var(--border)',
            marginBottom: '2rem',
            paddingBottom: '0.5rem'
          }}>
            <button
              onClick={() => setActiveTab('features')}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: activeTab === 'features' ? 'var(--text)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'features' ? '2px solid var(--text)' : 'none',
                cursor: 'pointer',
              }}
            >
              <Shield size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Feature Management
            </button>
            <button
              onClick={() => { setActiveTab('archive'); loadArchivedItems(); }}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: activeTab === 'archive' ? 'var(--text)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'archive' ? '2px solid var(--text)' : 'none',
                cursor: 'pointer',
              }}
            >
              <FolderArchive size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Archived Registry
            </button>
            <button
              onClick={() => setActiveTab('system')}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: activeTab === 'system' ? 'var(--text)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'system' ? '2px solid var(--text)' : 'none',
                cursor: 'pointer',
              }}
            >
              <Settings size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Account Settings
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'features' && (
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '20px',
              padding: '2rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-theme)'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text)' }}>Client Servicing Modules</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.entries(features).map(([key, value]) => (
                  <div key={key} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    backgroundColor: 'var(--surface-2)'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', color: 'var(--text)' }}>{key} Module</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        Toggle visibility and access control for this specific registry module.
                      </p>
                    </div>
                    <button
                      onClick={() => toggleFeature(key as any)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: value ? 'var(--text)' : '#94A3B8',
                        padding: '4px'
                      }}
                    >
                      {value ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </div>
                ))}
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

              {/* Custom External Portals Management */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Custom External Portals</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Create quick-access shortcuts to primary service domains and external tools for dashboards.
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
            </div>
          )}

          {activeTab === 'archive' && (
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '20px',
              padding: '2rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-theme)'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text)' }}>Archived Client Servicing Records</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Review, restore, or permanently purge records that have been archived.
              </p>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid var(--border)', borderTopColor: 'var(--text)', borderRadius: '50%' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '10px' }}>Loading archives...</p>
                </div>
              ) : archivedItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: '14px' }}>
                  <FolderArchive size={32} style={{ color: '#94A3B8', marginBottom: '8px' }} />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>No archived records found.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        <th style={{ padding: '12px' }}>Module</th>
                        <th style={{ padding: '12px' }}>Title/Client</th>
                        <th style={{ padding: '12px' }}>Details</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archivedItems.map((item) => (
                        <tr key={`${item.module}-${item.id}`} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: 'var(--surface-2)',
                              color: 'var(--text)',
                              fontWeight: 700,
                              fontSize: '0.7rem'
                            }}>{item.module}</span>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{item.title}</td>
                          <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{item.subtitle}</td>
                          <td style={{ padding: '12px', color: '#94A3B8' }}>{item.date}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleUnarchive(item.module, item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#10B981',
                                cursor: 'pointer',
                                marginRight: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600
                              }}
                              title="Restore to Registry"
                            >
                              <RotateCcw size={14} /> Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(item.module, item.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 600
                              }}
                              title="Delete Permanently"
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

          {activeTab === 'system' && (
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '20px',
              padding: '2rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-theme)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Account Information</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Update your account details and display settings.
              </p>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Admin Account Name</label>
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
                    color: 'var(--text)',
                    maxWidth: '400px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={async () => {
                    if (userId) {
                      const { error } = await supabase.from('profiles').update({ full_name: profileName }).eq('id', userId);
                      if (error) {
                        alert('Failed to update display name.');
                      } else {
                        setSaved(true);
                        setTimeout(() => setSaved(false), 3000);
                        // Dispatch profile update event to live-reload header/display names
                        window.dispatchEvent(new Event('profile-update'));
                      }
                    }
                  }}
                  style={{
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
                  Save Profile Settings
                </button>
                {saved && (
                  <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>
                    Settings saved successfully!
                  </span>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
