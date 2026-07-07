/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/faq/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(admin)\admin\faq\page.tsx
'use client';

import styles from "@/styles/admin/faq/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, MoreVertical, HelpCircle } from 'lucide-react';
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import { supabase } from "@/app/lib/supabase/client";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  audience: string;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  status: 'Published' | 'Draft' | 'Archived';
  updatedAt: string;
  isPinned: boolean;
  tags: string[];
}

const initialFAQs: FAQ[] = [];

/**
 * FAQPage
 *
 * Renders the FAQPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for FAQPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFAQs);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  /**
 * Executes operations logic for fetchFaqs.
 *
 * 
 * @returns State operations sequence.
 */
const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setFaqs(data.map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          category: f.category,
          audience: f.audience,
          views: f.views || 0,
          helpfulCount: f.helpful_count || 0,
          notHelpfulCount: f.not_helpful_count || 0,
          status: f.status,
          updatedAt: f.updated_at ? new Date(f.updated_at).toISOString().split('T')[0] : '—',
          isPinned: f.is_pinned || false,
          tags: f.tags || []
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAudience, setSelectedAudience] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question: '',
    category: 'General',
    audience: 'All Users',
    answer: '',
    tags: '',
    isPinned: false,
    status: 'Published' as FAQ['status']
  });

  const counts = useMemo(() => ({
    total: faqs.length,
    published: faqs.filter(f => f.status === 'Published').length,
    draft: faqs.filter(f => f.status === 'Draft').length,
    categories: new Set(faqs.map(f => f.category)).size
  }), [faqs]);

  const filteredFAQs = useMemo(() => {
    return faqs
      .filter((f) => {
        const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
        const matchesAudience = selectedAudience === 'All' || f.audience === selectedAudience;
        const matchesStatus = selectedStatus === 'All' || f.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesAudience && matchesStatus;
      })
      .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [faqs, searchQuery, selectedCategory, selectedAudience, selectedStatus]);

  /**
 * Executes operations logic for handleCreateFAQ.
 *
 * @param e: React.FormEvent
 * @returns State operations sequence.
 */
const handleCreateFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '');
    const newFaq = {
      question: formData.question,
      answer: formData.answer,
      category: formData.category,
      audience: formData.audience,
      views: 0,
      helpful_count: 0,
      not_helpful_count: 0,
      status: formData.status,
      updated_at: new Date().toISOString().split('T')[0],
      is_pinned: formData.isPinned,
      tags: parsedTags
    };

    try {
      const { error } = await supabase
        .from('faqs')
        .insert(newFaq);
      if (!error) {
        fetchFaqs();
        setIsFormOpen(false);
        setFormData({ question: '', category: 'General', audience: 'All Users', answer: '', tags: '', isPinned: false, status: 'Published' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
 * Executes operations logic for handleDelete.
 *
 * @param id: string
 * @returns State operations sequence.
 */
const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      if (!error) {
        fetchFaqs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  /**
 * Executes operations logic for handleTogglePin.
 *
 * @param id: string, currentPin: boolean
 * @returns State operations sequence.
 */
const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_pinned: !currentPin })
        .eq('id', id);
      if (!error) {
        fetchFaqs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.text_0}>
      <Sidebar />
      <div className={styles.container_1}>
        <Header />
        <main className={styles.div_2}>
          
          <div className={styles.container_3}>
            <div>
              <div className={styles.table_4}>
                <span>Knowledge Base</span>
                <span className={styles.text_5}>|</span>
                <span className={styles.text_6}>FAQs Matrix</span>
              </div>
              <h1 className={styles.table_7}>
                FAQ Management Center
              </h1>
              <p className={styles.text_8}>Designated workspace for user reference mapping</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(true)}
              className={styles.table_9}
            >
              <Plus size={14} /> Create FAQ Object
            </button>
          </div>

          <div className={styles.container_10}>
            {[
              { label: 'Total Objects', count: counts.total },
              { label: 'Published', count: counts.published },
              { label: 'Drafts', count: counts.draft },
              { label: 'Categories', count: counts.categories }
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
                placeholder="Search inquiry topics..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.card_17}
              />
            </div>
            
            <div className={styles.container_18}>
              {[
                ['Category', selectedCategory, setSelectedCategory, ['All', 'General', 'Internship', 'Accounts', 'Tasks', 'Attendance', 'Technical Support']],
                ['Audience', selectedAudience, setSelectedAudience, ['All', 'All Users', 'Interns', 'ASA', 'BSA', 'CSA', 'DSA', 'Administrators']],
                ['Status', selectedStatus, setSelectedStatus, ['All', 'Published', 'Draft', 'Archived']]
              ].map(([label, val, setVal, opts]: any) => (
                <div key={label}>
                  <select
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    className={styles.card_19}
                  >
                    <option value="" disabled hidden>{label}</option>
                    {opts.map((o: string) => <option key={o} value={o}>{o === 'All' ? `All ${label}s` : o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <button 
                  onClick={() => { setSelectedCategory('All'); setSelectedAudience('All'); setSelectedStatus('All'); setSearchQuery(''); }}
                  className={styles.card_20}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          <div className={styles.card_21}>
            <div className={styles.div_22}>
              <table className={styles.text_23}>
                <thead>
                  <tr className={styles.table_24}>
                    <th className={styles.div_25}>Question Topic</th>
                    <th className={styles.div_26}>Category</th>
                    <th className={styles.div_27}>Audience</th>
                    <th className={styles.div_28}>Status</th>
                    <th className={styles.div_29}>Updated At</th>
                    <th className={styles.text_30}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.text_31}>
                  {filteredFAQs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.text_32}>No records found matching current configuration.</td>
                    </tr>
                  ) : (
                    filteredFAQs.map((item) => {
                      return (
                        <tr key={item.id} className={styles.table_33}>
                          <td className={styles.div_34}>
                            <div className={styles.container_35}>
                              {item.isPinned && <span className={styles.text_36} title="Pinned">📌</span>}
                              <p className={styles.table_37}>{item.question}</p>
                            </div>
                          </td>
                          <td className={styles.div_38}>
                            <span className={styles.text_39}>{item.category}</span>
                          </td>
                          <td className={styles.div_40}>
                            <span className={styles.text_41}>{item.audience}</span>
                          </td>
                          <td className={styles.div_42}>
                            <span className={`${styles.text_116} ${
                              item.status === 'Published' ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-foreground'
                            }`}>
                              <span className={`${styles.div_117} ${item.status === 'Published' ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {item.status}
                            </span>
                          </td>
                          <td className={styles.text_43}>{item.updatedAt}</td>
                          <td className={styles.text_44}>
                            <div className={styles.container_45}>
                              <button 
                                onClick={() => { setSelectedFaq(item); setIsAnalyticsOpen(true); }} 
                                className={styles.card_46}
                              >
                                Metrics
                              </button>
                              <div className={styles.div_47}>
                                <button 
                                  onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)} 
                                  className={styles.card_48}
                                >
                                  <MoreVertical size={14} />
                                </button>
                                {activeMenuId === item.id && (
                                  <div className={styles.card_49}>
                                    <button onClick={() => { setSelectedFaq(item); setIsDetailsOpen(true); setActiveMenuId(null); }} className={styles.text_50}>View Details</button>
                                    <button onClick={() => handleTogglePin(item.id, item.isPinned)} className={styles.text_51}>Toggle Pin</button>
                                    <button onClick={() => handleDelete(item.id)} className={styles.text_52}>Delete Record</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {isFormOpen && (
            <div className={styles.container_53}>
              <div className={styles.card_54}>
                <div className={styles.container_55}>
                  <h2 className={styles.table_56}>Create FAQ Object</h2>
                  <button onClick={() => setIsFormOpen(false)} className={styles.text_57}>&times;</button>
                </div>
                <form onSubmit={handleCreateFAQ} className={styles.container_58}>
                  <div>
                    <label className={styles.text_59}>Inquiry / Question Statement</label>
                    <input type="text" required value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} placeholder="E.g., How do I reset my credentials?" className={styles.card_60} />
                  </div>
                  <div className={styles.container_61}>
                    <div>
                      <label className={styles.text_62}>Category</label>
                      <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={styles.card_63}>
                        {['General', 'Internship', 'Accounts', 'Tasks', 'Attendance', 'Technical Support'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={styles.text_64}>Target Audience</label>
                      <select value={formData.audience} onChange={(e) => setFormData({...formData, audience: e.target.value})} className={styles.card_65}>
                        {['All Users', 'Interns', 'ASA', 'BSA', 'CSA', 'DSA', 'Administrators'].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={styles.text_66}>Tracking Tags (Comma Separated)</label>
                    <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="login, password, portal" className={styles.card_67} />
                  </div>
                  <div>
                    <label className={styles.text_68}>Resolution / Answer Payload</label>
                    <textarea rows={5} required value={formData.answer} onChange={(e) => setFormData({...formData, answer: e.target.value})} placeholder="Write structured resolution text here..." className={styles.card_69} />
                  </div>
                  <div className={styles.container_70}>
                    <input type="checkbox" id="pinForm" checked={formData.isPinned} onChange={(e) => setFormData({...formData, isPinned: e.target.checked})} className={styles.div_71} />
                    <label htmlFor="pinForm" className={styles.text_72}>Anchor object to dashboard ceiling matrix</label>
                  </div>
                  <div className={styles.card_73}>
                    <button type="button" onClick={() => setFormData({...formData, status: 'Draft'})} className={`${styles.text_118} ${formData.status === 'Draft' ? 'bg-gray-100 border-gray-400' : 'bg-card border-border'}`}>Draft Mode</button>
                    <div className={styles.container_74}>
                      <button type="button" onClick={() => setIsFormOpen(false)} className={styles.text_75}>Abort</button>
                      <button type="submit" className={styles.text_76}>Publish Node</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {isAnalyticsOpen && selectedFaq && (
            <div className={styles.container_77}>
              <div className={styles.card_78}>
                <button onClick={() => setIsAnalyticsOpen(false)} className={styles.text_79}>&times;</button>
                <h3 className={styles.table_80}>Knowledge Base Metrics</h3>
                <div className={styles.div_81}>
                  <p className={styles.text_82}>{selectedFaq.question}</p>
                </div>
                <div className={styles.container_83}>
                  <div className={styles.text_84}><p className={styles.text_85}>Views</p><p className={styles.text_86}>{selectedFaq.views}</p></div>
                  <div className={styles.text_87}><p className={styles.text_88}>Helpful</p><p className={styles.text_89}>{selectedFaq.helpfulCount}</p></div>
                  <div className={styles.text_90}><p className={styles.text_91}>Error</p><p className={styles.text_92}>{selectedFaq.notHelpfulCount}</p></div>
                </div>
                <button onClick={() => setIsAnalyticsOpen(false)} className={styles.table_93}>Dismiss</button>
              </div>
            </div>
          )}

          {isDetailsOpen && selectedFaq && (
            <div className={styles.container_94}>
              <div className={styles.card_95}>
                <button onClick={() => setIsDetailsOpen(false)} className={styles.text_96}>&times;</button>
                <div>
                  <span className={styles.text_97}>
                    {selectedFaq.category}
                  </span>
                  <h2 className={styles.text_98}>{selectedFaq.question}</h2>
                </div>
                
                <div className={styles.text_99}>
                  <div>
                    <p className={styles.text_100}>Target Audience</p>
                    <p className={styles.text_101}>{selectedFaq.audience}</p>
                  </div>
                  <div>
                    <p className={styles.text_102}>Updated At</p>
                    <p className={styles.text_103}>{selectedFaq.updatedAt}</p>
                  </div>
                  <div>
                    <p className={styles.text_104}>Status</p>
                    <p className={styles.text_105}>{selectedFaq.status}</p>
                  </div>
                  <div>
                    <p className={styles.text_106}>Pinned</p>
                    <p className={styles.text_107}>{selectedFaq.isPinned ? "Yes" : "No"}</p>
                  </div>
                </div>

                <div className={styles.div_108}>
                  <p className={styles.text_109}>Answer</p>
                  <div className={styles.text_110}>
                    {selectedFaq.answer}
                  </div>
                </div>

                {selectedFaq.tags.length > 0 && (
                  <div className={styles.div_111}>
                    <p className={styles.text_112}>Tags</p>
                    <div className={styles.container_113}>
                      {selectedFaq.tags.map((t, idx) => (
                        <span key={idx} className={styles.text_114}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={() => setIsDetailsOpen(false)} className={styles.table_115}>
                  Close Details
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
