'use client';

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/announcements/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions for administrators.
 * - Manages announcement creation, editing, deleting, archiving, and pinning.
 * - Embeds Google Maps Location Picker, Storage Attachments dropzones, and detailed Analytics modals.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, MoreVertical, Megaphone, CheckCircle, Clock, Trash2, Edit3, Pin, Archive, HelpCircle } from 'lucide-react';
import Header from "@/app/components/admin/AdminHeader";
import Sidebar from "@/app/components/admin/AdminSidebar";
import { supabase } from "@/app/lib/supabase/client";
import GoogleMapsPicker from '@/components/shared/GoogleMapsPicker';
import AttachmentUpload, { AttachedFile } from '@/components/shared/AttachmentUpload';
import AnnouncementDetailsModal from '@/components/shared/AnnouncementDetailsModal';
import styles from "@/styles/admin/announcements/page.module.css";

interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  audience: string[];
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Published' | 'Scheduled' | 'Draft' | 'Archived';
  author: string;
  publishDate: string;
  views: number;
  readRate: number;
  downloads: number;
  isPinned: boolean;
  content?: string;

  // Event properties
  event_date?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  event_type?: string;

  // Location properties
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;

  // Configuration settings
  visibility_type?: string;
  require_acknowledgement?: boolean;
}

const initialAnnouncements: Announcement[] = [];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedAudience, setSelectedAudience] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Form Fields State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    category: 'General',
    priority: 'Medium' as Announcement['priority'],
    audience: [] as string[],
    content: '',
    isPinned: false,
    status: 'Published' as Announcement['status'],

    // Event details
    event_date: '',
    start_time: '',
    end_time: '',
    timezone: 'PHT',
    event_type: 'Meeting',

    // Location details
    location_name: '',
    location_address: '',
    latitude: 14.5538,
    longitude: 120.9834,
    google_place_id: '',

    // Publish configs
    visibility_type: 'Public',
    send_push_notification: false,
    send_dashboard_notification: true,
    require_acknowledgement: false
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [analytics, setAnalytics] = useState({
    views: 0,
    downloads: 0,
    reach: 0,
    acknowledgements: 0,
    readRate: 0,
    ackRate: 0,
    pending: 0
  });

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setAnnouncements(data.map((a: any) => ({
          id: a.id,
          title: a.title,
          subtitle: a.subtitle,
          category: a.category,
          audience: a.audience || [],
          priority: a.priority,
          status: a.status,
          author: a.author,
          publishDate: a.publish_date ? new Date(a.publish_date).toISOString().split('T')[0] : '—',
          views: a.views || 0,
          readRate: a.read_rate || 0,
          downloads: a.downloads || 0,
          isPinned: a.is_pinned || false,
          content: a.content,
          // Extra database fields
          event_date: a.event_date || '',
          start_time: a.start_time || '',
          end_time: a.end_time || '',
          timezone: a.timezone || 'PHT',
          event_type: a.event_type || 'Meeting',
          location_name: a.location_name || '',
          location_address: a.location_address || '',
          latitude: a.latitude || 14.5538,
          longitude: a.longitude || 120.9834,
          google_place_id: a.google_place_id || '',
          visibility_type: a.visibility_type || 'Public',
          require_acknowledgement: a.require_acknowledgement || false
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAttachmentsForEdit = async (annId: string) => {
    try {
      const { data } = await supabase
        .from('announcement_attachments')
        .select('*')
        .eq('announcement_id', annId);
      if (data) {
        setAttachedFiles(data.map((f: any) => ({
          id: f.id,
          name: f.file_name,
          url: f.file_url,
          size: f.file_size,
          type: f.file_type
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnalytics = async (annId: string) => {
    try {
      // 1. Fetch total reach/profiles
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      const reachVal = profileCount || 10;

      // 2. Fetch acknowledgements
      const { count: ackCount } = await supabase
        .from('announcement_acknowledgements')
        .select('*', { count: 'exact', head: true })
        .eq('announcement_id', annId);
      const acksVal = ackCount || 0;

      const target = announcements.find(a => a.id === annId);
      const viewsVal = target ? target.views : 0;
      const downloadsVal = target ? target.downloads : 0;

      const rRate = Math.min(100, Math.round((viewsVal / reachVal) * 100));
      const aRate = Math.min(100, Math.round((acksVal / reachVal) * 100));
      const pendingVal = Math.max(0, reachVal - acksVal);

      setAnalytics({
        views: viewsVal,
        downloads: downloadsVal,
        reach: reachVal,
        acknowledgements: acksVal,
        readRate: rRate,
        ackRate: aRate,
        pending: pendingVal
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (isAnalyticsOpen && selectedAnnouncement) {
      loadAnalytics(selectedAnnouncement.id);
    }
  }, [isAnalyticsOpen, selectedAnnouncement]);

  const handleEditClick = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setFormData({
      title: ann.title,
      subtitle: ann.subtitle || '',
      category: ann.category,
      priority: ann.priority,
      audience: ann.audience || [],
      content: ann.content || '',
      isPinned: ann.isPinned,
      status: ann.status,
      event_date: ann.event_date || '',
      start_time: ann.start_time || '',
      end_time: ann.end_time || '',
      timezone: ann.timezone || 'PHT',
      event_type: ann.event_type || 'Meeting',
      location_name: ann.location_name || '',
      location_address: ann.location_address || '',
      latitude: ann.latitude || 14.5538,
      longitude: ann.longitude || 120.9834,
      google_place_id: ann.google_place_id || '',
      visibility_type: ann.visibility_type || 'Public',
      send_push_notification: false,
      send_dashboard_notification: true,
      require_acknowledgement: ann.require_acknowledgement || false
    });
    loadAttachmentsForEdit(ann.id);
    setIsFormOpen(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const recordPayload = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      category: formData.category,
      audience: formData.audience.length ? formData.audience : ['All Members'],
      priority: formData.priority,
      status: formData.status,
      author: 'Administrator',
      publish_date: formData.status === 'Published' ? new Date().toISOString().split('T')[0] : null,
      is_pinned: formData.isPinned,
      content: formData.content || null,
      event_date: formData.event_date || null,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      timezone: formData.timezone,
      event_type: formData.event_type,
      location_name: formData.location_name || null,
      location_address: formData.location_address || null,
      latitude: formData.latitude,
      longitude: formData.longitude,
      google_place_id: formData.google_place_id || null,
      visibility_type: formData.visibility_type,
      send_push_notification: formData.send_push_notification,
      send_dashboard_notification: formData.send_dashboard_notification,
      require_acknowledgement: formData.require_acknowledgement
    };

    try {
      let activeAnnId = '';

      if (selectedAnnouncement) {
        // UPDATE MODE
        const { error } = await supabase
          .from('announcements')
          .update(recordPayload)
          .eq('id', selectedAnnouncement.id);

        if (error) throw error;
        activeAnnId = selectedAnnouncement.id;
      } else {
        // INSERT MODE
        const { data, error } = await supabase
          .from('announcements')
          .insert(recordPayload)
          .select('id')
          .single();

        if (error) throw error;
        if (data) activeAnnId = data.id;
      }

      // Sync Attachments
      if (activeAnnId) {
        // Clear previous attachments matching this announcement
        await supabase
          .from('announcement_attachments')
          .delete()
          .eq('announcement_id', activeAnnId);

        if (attachedFiles.length > 0) {
          const attachmentsPayload = attachedFiles.map(file => ({
            announcement_id: activeAnnId,
            file_name: file.name,
            file_url: file.url,
            file_size: file.size,
            file_type: file.type
          }));
          await supabase.from('announcement_attachments').insert(attachmentsPayload);
        }
      }

      // Send Dashboard Notification if publishing
      if (formData.status === 'Published' && formData.send_dashboard_notification) {
        await supabase.from('notifications').insert({
          title: `New Announcement: ${formData.title}`,
          description: formData.subtitle || formData.content || 'Read details inside Dashboard.',
          type: 'announcement'
        });
      }

      fetchAnnouncements();
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to save announcement:', err);
      alert('Save operation failed. Please verify Supabase connection.');
    }
  };

  const resetForm = () => {
    setSelectedAnnouncement(null);
    setAttachedFiles([]);
    setFormData({
      title: '',
      subtitle: '',
      category: 'General',
      priority: 'Medium',
      audience: [],
      content: '',
      isPinned: false,
      status: 'Published',
      event_date: '',
      start_time: '',
      end_time: '',
      timezone: 'PHT',
      event_type: 'Meeting',
      location_name: '',
      location_address: '',
      latitude: 14.5538,
      longitude: 120.9834,
      google_place_id: '',
      visibility_type: 'Public',
      send_push_notification: false,
      send_dashboard_notification: true,
      require_acknowledgement: false
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement record?')) return;
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (!error) {
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePin = async (ann: Announcement) => {
    try {
      await supabase
        .from('announcements')
        .update({ is_pinned: !ann.isPinned })
        .eq('id', ann.id);
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (ann: Announcement, newStatus: Announcement['status']) => {
    try {
      await supabase
        .from('announcements')
        .update({ status: newStatus })
        .eq('id', ann.id);
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const counts = useMemo(() => ({
    total: announcements.length,
    published: announcements.filter(a => a.status === 'Published').length,
    scheduled: announcements.filter(a => a.status === 'Scheduled').length,
    draft: announcements.filter(a => a.status === 'Draft').length,
  }), [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (a.subtitle && a.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
        const matchesPriority = selectedPriority === 'All' || a.priority === selectedPriority;
        const matchesStatus = selectedStatus === 'All' || a.status === selectedStatus;
        const matchesAudience = selectedAudience === 'All' || a.audience.includes(selectedAudience);
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesAudience;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [announcements, searchQuery, selectedCategory, selectedPriority, selectedStatus, selectedAudience]);

  return (
    <div className={styles.text_0}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.container_1}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.div_2}>
          
          <div className={styles.container_3}>
            <div>
              <div className={styles.table_4}>
                <span>Communication Hub</span>
                <span className={styles.text_5}>|</span>
                <span className={styles.text_6}>Announcements</span>
              </div>
              <h1 className={styles.table_7}>
                Announcement Control Center
              </h1>
              <p className={styles.text_8}>Enterprise communication management terminal</p>
            </div>
            <button
              onClick={() => { resetForm(); setIsFormOpen(true); }}
              className={styles.table_9}
            >
              <Plus size={14} /> Create Announcement
            </button>
          </div>

          <div className={styles.container_10}>
            {[
              { label: 'Total Broadcasts', count: counts.total },
              { label: 'Published Feed', count: counts.published },
              { label: 'Scheduled Tasks', count: counts.scheduled },
              { label: 'Drafts Bin', count: counts.draft },
            ].map((card, idx) => (
              <div key={idx} className={styles.card_11}>
                <span className={styles.table_12}>{card.label}</span>
                <h3 className={styles.table_13}>{card.count}</h3>
              </div>
            ))}
          </div>

          <div className={styles.div_14}>
            <div className={styles.div_15}>
              <Search className={styles.text_16} size={14} />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.card_17}
              />
            </div>

            <div className={styles.container_18}>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className={styles.card_19}>
                <option value="All">All Categories</option>
                {['General', 'Meeting', 'Training', 'Notice'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)} className={styles.card_19}>
                <option value="All">All Priorities</option>
                {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>

              <select value={selectedAudience} onChange={(e) => setSelectedAudience(e.target.value)} className={styles.card_19}>
                <option value="All">All Audiences</option>
                {['All Members', 'ASA', 'BSA', 'CSA', 'DSA', 'Admins'].map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={styles.card_19}>
                <option value="All">All Statuses</option>
                {['Published', 'Scheduled', 'Draft', 'Archived'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <button onClick={() => { setSelectedCategory('All'); setSelectedPriority('All'); setSelectedAudience('All'); setSelectedStatus('All'); setSearchQuery(''); }} className={styles.card_21}>
                Reset Filter
              </button>
            </div>

            <div className={styles.card_22}>
              <div className={styles.div_23}>
                <table className={styles.text_24}>
                  <thead>
                    <tr>
                      <th className={`${styles.table_25} ${styles.div_26}`}>Pin</th>
                      <th className={styles.table_25}>Broadcast Title</th>
                      <th className={styles.table_25}>Category</th>
                      <th className={styles.table_25}>Priority</th>
                      <th className={styles.table_25}>Status</th>
                      <th className={styles.table_25}>Author</th>
                      <th className={styles.table_25}>Publish Date</th>
                      <th className={styles.table_25}>Views</th>
                      <th className={`${styles.table_25} ${styles.text_35}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={styles.text_36}>
                    {filteredAnnouncements.length === 0 ? (
                      <tr>
                        <td colSpan={9} className={styles.text_37}>
                          No announcement profiles found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredAnnouncements.map((item) => (
                        <tr key={item.id} className={styles.table_38}>
                          <td className={styles.div_39}>
                            <button 
                              onClick={() => handleTogglePin(item)}
                              style={{ color: item.isPinned ? '#F4C542' : 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              📌
                            </button>
                          </td>
                          <td className={styles.table_42}>
                            <div className={styles.container_43}>
                              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{item.title}</span>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--muted-foreground)', display: 'block' }}>{item.subtitle || '—'}</span>
                          </td>
                          <td className={styles.text_55}>{item.category}</td>
                          <td className={styles.div_53}>
                            <span className={`${styles.text_128} ${
                              item.priority === 'Urgent' || item.priority === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>{item.priority}</span>
                          </td>
                          <td className={styles.div_54}>
                            <span className={`${styles.text_129} ${
                              item.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-foreground'
                            }`}>
                              <span className={`${styles.div_130} ${item.status === 'Published' ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {item.status}
                            </span>
                          </td>
                          <td className={styles.text_55}>{item.author}</td>
                          <td className={styles.text_56}>{item.publishDate}</td>
                          <td className={styles.text_57}>{item.views}</td>
                          <td className={styles.text_58}>
                            <div className={styles.container_59}>
                              <button 
                                onClick={() => { setSelectedAnnouncement(item); setIsAnalyticsOpen(true); }} 
                                className={styles.card_60}
                              >
                                Metrics
                              </button>
                              <div className={styles.div_61}>
                                <button 
                                  onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)} 
                                  className={styles.card_62}
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {activeMenuId === item.id && (
                                  <div className={styles.card_63}>
                                    <button onClick={() => { setSelectedAnnouncement(item); setIsDetailsOpen(true); setActiveMenuId(null); }} className={styles.text_64}>View Reader Portal</button>
                                    <button onClick={() => { handleEditClick(item); setActiveMenuId(null); }} className={styles.text_64}>Edit Properties</button>
                                    <button onClick={() => { handleUpdateStatus(item, 'Archived'); setActiveMenuId(null); }} className={styles.text_64}>Archive Broadcast</button>
                                    {item.status !== 'Published' && (
                                      <button onClick={() => { handleUpdateStatus(item, 'Published'); setActiveMenuId(null); }} className={styles.text_64}>Publish Live</button>
                                    )}
                                    <button onClick={() => { handleDelete(item.id); setActiveMenuId(null); }} className={styles.text_65}>Delete Record</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Form Modal for Create/Edit */}
          {isFormOpen && (
            <div className={styles.container_66} style={{ overflowY: 'auto' }}>
              <div className={styles.card_67} style={{ maxWidth: '42rem', marginTop: '4rem', marginBottom: '4rem' }}>
                <div className={styles.container_68}>
                  <h2 className={styles.table_69}>{selectedAnnouncement ? 'Edit Announcement Properties' : 'Create Live Announcement'}</h2>
                  <button onClick={() => setIsFormOpen(false)} className={styles.text_70}>&times;</button>
                </div>
                <form onSubmit={handleCreateOrUpdate} className={styles.container_71}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label className={styles.text_72}>Title</label>
                      <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="E.g., Quarterly Team Alignment Meeting" className={styles.card_73} />
                    </div>
                    <div>
                      <label className={styles.text_74}>Subtitle</label>
                      <input type="text" value={formData.subtitle} onChange={(e) => setFormData({...formData, subtitle: e.target.value})} placeholder="E.g., Attendance is mandatory for all divisions" className={styles.card_75} />
                    </div>
                  </div>

                  <div className={styles.container_76}>
                    <div>
                      <label className={styles.text_77}>Category</label>
                      <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={styles.card_78}>
                        {['General', 'Meeting', 'Training', 'Notice'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={styles.text_79}>Priority Level</label>
                      <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})} className={styles.card_80}>
                        {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={styles.text_77}>Visibility Scope</label>
                      <select value={formData.visibility_type} onChange={(e) => setFormData({...formData, visibility_type: e.target.value})} className={styles.card_78}>
                        {['Public', 'Internal', 'Department Only', 'Management Only'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Target Audience Checkboxes */}
                  <div>
                    <label className={styles.text_81}>Target Audience Groups</label>
                    <div className={styles.container_82}>
                      {['All Members', 'ASA', 'BSA', 'CSA', 'DSA', 'Admins'].map((role) => (
                        <label key={role} className={styles.text_83}>
                          <input type="checkbox" checked={formData.audience.includes(role)} onChange={() => {
                            const updated = formData.audience.includes(role) ? formData.audience.filter(r => r !== role) : [...formData.audience, role];
                            setFormData({...formData, audience: updated});
                          }} className={styles.div_84} /> {role}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Feature 1: Event Scheduler */}
                  <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--muted)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>📅 Event Schedule Configuration</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                      <div>
                        <label className={styles.text_72}>Event Date</label>
                        <input type="date" value={formData.event_date} onChange={(e) => setFormData({...formData, event_date: e.target.value})} className={styles.card_73} />
                      </div>
                      <div>
                        <label className={styles.text_72}>Start Time</label>
                        <input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className={styles.card_73} />
                      </div>
                      <div>
                        <label className={styles.text_72}>End Time</label>
                        <input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className={styles.card_73} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <div>
                        <label className={styles.text_72}>Timezone</label>
                        <input type="text" value={formData.timezone} onChange={(e) => setFormData({...formData, timezone: e.target.value})} placeholder="PHT, UTC, EST" className={styles.card_73} />
                      </div>
                      <div>
                        <label className={styles.text_72}>Event Type</label>
                        <select value={formData.event_type} onChange={(e) => setFormData({...formData, event_type: e.target.value})} className={styles.card_78}>
                          {['Meeting', 'Training', 'Webinar', 'Workshop', 'Company Event', 'Holiday', 'Deadline', 'Other'].map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Feature 2: Google Maps Picker */}
                  <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--muted)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>📍 Google Maps Location Intelligence</div>
                    <GoogleMapsPicker 
                      value={{
                        location_name: formData.location_name,
                        location_address: formData.location_address,
                        latitude: formData.latitude,
                        longitude: formData.longitude,
                        google_place_id: formData.google_place_id
                      }}
                      onChange={(loc) => setFormData({
                        ...formData,
                        location_name: loc.location_name,
                        location_address: loc.location_address,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        google_place_id: loc.google_place_id
                      })}
                    />
                  </div>

                  {/* Feature 3: File Attachment Center */}
                  <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--muted)' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>📎 Attachment Upload Center</div>
                    <AttachmentUpload files={attachedFiles} onChange={setAttachedFiles} />
                  </div>

                  {/* Feature 4: Publish Configurations */}
                  <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '0.75rem', backgroundColor: 'var(--muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label className={styles.text_83}>
                      <input type="checkbox" checked={formData.send_dashboard_notification} onChange={(e) => setFormData({...formData, send_dashboard_notification: e.target.checked})} className={styles.div_84} /> Broadcast to Notifications Bell
                    </label>
                    <label className={styles.text_83}>
                      <input type="checkbox" checked={formData.isPinned} onChange={(e) => setFormData({...formData, isPinned: e.target.checked})} className={styles.div_84} /> Pin to top of feed
                    </label>
                    <label className={styles.text_83}>
                      <input type="checkbox" checked={formData.require_acknowledgement} onChange={(e) => setFormData({...formData, require_acknowledgement: e.target.checked})} className={styles.div_84} /> Require user signature acknowledgment
                    </label>
                    <label className={styles.text_83}>
                      <input type="checkbox" checked={formData.send_push_notification} onChange={(e) => setFormData({...formData, send_push_notification: e.target.checked})} className={styles.div_84} /> Send system push alert
                    </label>
                  </div>

                  <div>
                    <label className={styles.text_85}>Announcement Description Content</label>
                    <textarea rows={4} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Describe details of meeting, goals, links, or outlines..." className={styles.card_86} />
                  </div>

                  <div className={styles.card_87}>
                    <button type="button" onClick={() => { setFormData({...formData, status: 'Draft'}); }} className={styles.card_88}>Save Draft</button>
                    <button type="submit" className={styles.table_89}>{selectedAnnouncement ? 'Save Properties' : 'Publish Broadcast'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Real-time Analytics Modal */}
          {isAnalyticsOpen && selectedAnnouncement && (
            <div className={styles.container_90}>
              <div className={styles.card_91}>
                <button onClick={() => setIsAnalyticsOpen(false)} className={styles.text_92}>&times;</button>
                <h3 className={styles.table_93}>Broadcast Analytics Tracker</h3>
                <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', marginBottom: '0.75rem' }}>{selectedAnnouncement.title}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div className={styles.text_95}><p className={styles.text_96}>Views</p><p className={styles.text_97}>{analytics.views}</p></div>
                  <div className={styles.text_98}><p className={styles.text_99}>Read %</p><p className={styles.text_100}>{analytics.readRate}%</p></div>
                  <div className={styles.text_101}><p className={styles.text_102}>Reach</p><p className={styles.text_103}>{analytics.reach}</p></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <div className={styles.text_95} style={{ borderColor: 'rgba(22, 163, 74, 0.2)' }}><p className={styles.text_96}>Signatures</p><p className={styles.text_97} style={{ color: '#16a34a' }}>{analytics.acknowledgements}</p></div>
                  <div className={styles.text_98} style={{ borderColor: 'rgba(22, 163, 74, 0.2)' }}><p className={styles.text_99}>Signature %</p><p className={styles.text_100} style={{ color: '#16a34a' }}>{analytics.ackRate}%</p></div>
                  <div className={styles.text_101} style={{ borderColor: 'rgba(217, 119, 6, 0.2)' }}><p className={styles.text_102}>Pending</p><p className={styles.text_103} style={{ color: '#d97706' }}>{analytics.pending}</p></div>
                </div>
                <button onClick={() => setIsAnalyticsOpen(false)} className={styles.table_104} style={{ marginTop: '1.25rem' }}>Dismiss Tracker</button>
              </div>
            </div>
          )}

          {/* Reader Modal Preview */}
          {isDetailsOpen && selectedAnnouncement && (
            <AnnouncementDetailsModal 
              announcement={selectedAnnouncement}
              onClose={() => setIsDetailsOpen(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
