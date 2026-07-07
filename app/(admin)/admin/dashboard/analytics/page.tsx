/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/dashboard/analytics/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

// C:\website\tp\app\(admin)\admin\dashboard\analytics\page.tsx
'use client';

import styles from "@/styles/admin/dashboard/analytics/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, Clock, Megaphone, HelpCircle, 
  RefreshCw, Loader2, CalendarCheck, ShieldAlert
} from 'lucide-react';
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import { supabase } from "@/app/lib/supabase/client";

type ReportTab = 'overview' | 'users' | 'tasks' | 'attendance' | 'announcements' | 'faq';

/**
 * AnalyticsPage
 *
 * Renders the AnalyticsPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AnalyticsPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    completedTasks: 0,
    pendingTasks: 0,
    announcements: 0,
    faqCount: 0
  });

  /**
 * Executes operations logic for fetchAnalyticsData.
 *
 * 
 * @returns State operations sequence.
 */
const fetchAnalyticsData = async () => {
    try {
      const { data: profiles } = await /* Query database records from active repository grid */ supabase.from('profiles').select('*');
      const { data: tasks } = await /* Query database records from active repository grid */ supabase.from('tasks').select('*');
      const { data: attendance } = await /* Query database records from active repository grid */ supabase.from('attendance').select('*');

      const mappedUsers = (profiles || []).map(p => ({
        name: p.full_name || 'User',
        email: p.email || '',
        dept: p.department || 'General',
        role: p.role || 'Associate',
        id: p.id
      }));

      const completed = (tasks || []).filter(t => t.status === 'completed').length;
      const pending = (tasks || []).filter(t => t.status === 'pending').length;

      setUsersList(mappedUsers);
      setTasksList(tasks || []);
      setAttendanceList(attendance || []);

      let localAnnouncementsCount = 0;
      if (typeof window !== 'undefined') {
        const storedAnnouncements = localStorage.getItem('local_announcements');
        if (storedAnnouncements) {
          try {
            localAnnouncementsCount = JSON.parse(storedAnnouncements).length;
          } catch {}
        }
      }

      let localFaqsCount = 0;
      if (typeof window !== 'undefined') {
        const storedFaqs = localStorage.getItem('local_faqs');
        if (storedFaqs) {
          try {
            localFaqsCount = JSON.parse(storedFaqs).length;
          } catch {}
        }
      }

      setStats({
        totalUsers: profiles?.length || 0,
        activeUsers: profiles?.filter(p => p.role !== 'Disabled').length || 0,
        completedTasks: completed,
        pendingTasks: pending,
        announcements: localAnnouncementsCount || 2,
        faqCount: localFaqsCount || 1
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  /**
 * Executes operations logic for handleRefresh.
 *
 * 
 * @returns State operations sequence.
 */
const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalyticsData();
    setIsRefreshing(false);
  };

  const overviewCards = [
    { label: 'Total Users', count: stats.totalUsers, icon: Users },
    { label: 'Active Users', count: stats.activeUsers, icon: Users },
    { label: 'Completed Tasks', count: stats.completedTasks, icon: CheckCircle },
    { label: 'Pending Tasks', count: stats.pendingTasks, icon: Clock },
    { label: 'Announcements', count: stats.announcements, icon: Megaphone },
    { label: 'FAQ Articles', count: stats.faqCount, icon: HelpCircle },
  ];

  return (
    <div className={styles.text_0}>
      <Sidebar />
      <div className={styles.container_1}>
        <Header />
        <main className={styles.div_2}>
          
          <div className={styles.container_3}>
            <div>
              <div className={styles.table_4}>
                <span>TeamPadua Control</span>
                <span className={styles.text_5}>|</span>
                <span className={styles.text_6}>Database Metrics</span>
              </div>
              <h1 className={styles.text_7}>
                Reports & Analytics Center
              </h1>
              <p className={styles.text_8}>Live database synchronization ledger</p>
            </div>
            
            <div className={styles.container_9}>
              <button 
                onClick={handleRefresh}
                className={styles.table_10}
              >
                {isRefreshing ? <Loader2 size={14} className={styles.text_11} /> : <RefreshCw size={14} />}
                <span>Sync Data</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className={styles.card_12}>
              <Loader2 className={styles.text_13} />
              <p className={styles.table_14}>Loading system ledger...</p>
            </div>
          ) : (
            <>
              <div className={styles.container_15}>
                {overviewCards.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className={styles.card_16}>
                      <div className={styles.text_17}>
                        <span className={styles.table_18}>{card.label}</span>
                        <Icon size={14} className={styles.text_19} />
                      </div>
                      <h3 className={styles.table_20}>{card.count}</h3>
                    </div>
                  );
                })}
              </div>

              <div className={styles.container_21}>
                {([
                  { id: 'overview', label: 'Overview' },
                  { id: 'users', label: 'Members' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'attendance', label: 'Attendance' },
                  { id: 'announcements', label: 'Announcements' },
                  { id: 'faq', label: 'Knowledge Base' }
                ] as { id: ReportTab; label: string }[]).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${styles.table_92} ${
                      activeTab === tab.id 
                        ? 'border-[#F4C542] text-foreground bg-[#FFF7D6]/10 dark:bg-[#2E2818]/20' 
                        : 'border-transparent text-muted-foreground hover:text-foreground/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className={styles.container_22}>
                  <div className={styles.card_23}>
                    <div>
                      <h3 className={styles.table_24}>
                        <ShieldAlert size={14} className={styles.text_25} /> Recent Activities Log
                      </h3>
                      <div className={styles.div_26}>
                        {tasksList.slice(0, 4).map((task, idx) => (
                          <div key={idx} className={styles.text_27}>
                            <span className={styles.div_28} />
                            <span className={styles.text_29}>
                              {new Date(task.created_at).toLocaleDateString()}
                            </span>
                            <p className={styles.text_30}>
                              Task mapping created: <span className={styles.text_31}>{task.title}</span>
                            </p>
                          </div>
                        ))}
                        {tasksList.length === 0 && (
                          <p className={styles.text_32}>No recent task logs found.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.card_33}>
                    <h3 className={styles.table_34}>
                      Department Distribution
                    </h3>
                    <div className={styles.div_35}>
                      {Array.from(new Set(usersList.map(u => u.dept))).map((dept: any, idx) => {
                        const count = usersList.filter(u => u.dept === dept).length;
                        const percentage = stats.totalUsers > 0 ? Math.round((count / stats.totalUsers) * 100) : 0;
                        return (
                          <div key={idx} className={styles.div_36}>
                            <div className={styles.text_37}>
                              <span className={styles.text_38}>{dept}</span>
                              <span className={styles.text_39}>{count} ({percentage}%)</span>
                            </div>
                            <div className={styles.div_40}>
                              <div className={styles.div_41} style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className={styles.card_42}>
                  <div className={styles.div_43}>
                    <table className={styles.text_44}>
                      <thead>
                        <tr className={styles.table_45}>
                          <th className={styles.div_46}>Member Name</th>
                          <th className={styles.div_47}>Email Address</th>
                          <th className={styles.div_48}>Department Sector</th>
                          <th className={styles.div_49}>Assigned Role</th>
                        </tr>
                      </thead>
                      <tbody className={styles.text_50}>
                        {usersList.map((row, idx) => (
                          <tr key={idx} className={styles.table_51}>
                            <td className={styles.text_52}>{row.name}</td>
                            <td className={styles.text_53}>{row.email}</td>
                            <td className={styles.div_54}>{row.dept}</td>
                            <td className={styles.div_55}>
                              <span className={styles.text_56}>
                                {row.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className={styles.card_57}>
                  <div className={styles.div_58}>
                    <table className={styles.text_59}>
                      <thead>
                        <tr className={styles.table_60}>
                          <th className={styles.div_61}>Task Name</th>
                          <th className={styles.div_62}>Priority</th>
                          <th className={styles.div_63}>Status</th>
                          <th className={styles.div_64}>Due Date</th>
                        </tr>
                      </thead>
                      <tbody className={styles.text_65}>
                        {tasksList.map((row, idx) => (
                          <tr key={idx} className={styles.table_66}>
                            <td className={styles.text_67}>{row.title}</td>
                            <td className={styles.div_68}>
                              <span className={`${styles.text_93} ${
                                row.priority === 'urgent' || row.priority === 'High'
                                  ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400' 
                                  : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400'
                              }`}>{row.priority || 'Medium'}</span>
                            </td>
                            <td className={styles.div_69}>
                              <span className={styles.text_70}>
                                <span className={`${styles.div_94} ${row.status === 'completed' ? 'bg-green-500' : 'bg-orange-400'}`} />
                                {row.status}
                              </span>
                            </td>
                            <td className={styles.text_71}>
                              {row.due_date ? new Date(row.due_date).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'attendance' && (
                <div className={styles.card_72}>
                  <div className={styles.div_73}>
                    <table className={styles.text_74}>
                      <thead>
                        <tr className={styles.table_75}>
                          <th className={styles.div_76}>Record ID</th>
                          <th className={styles.div_77}>Date</th>
                          <th className={styles.div_78}>Time In</th>
                          <th className={styles.div_79}>Time Out</th>
                          <th className={styles.div_80}>Status</th>
                        </tr>
                      </thead>
                      <tbody className={styles.text_81}>
                        {attendanceList.map((row, idx) => (
                          <tr key={idx} className={styles.table_82}>
                            <td className={styles.text_83}>{row.id}</td>
                            <td className={styles.text_84}>{row.attendance_date}</td>
                            <td className={styles.text_85}>{row.time_in || '—'}</td>
                            <td className={styles.text_86}>{row.time_out || '—'}</td>
                            <td className={styles.div_87}>
                              <span className={`${styles.text_95} ${
                                row.status === 'Present' || row.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400'
                              }`}>{row.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'announcements' && (
                <div className={styles.card_88}>
                  <Megaphone className={styles.text_89} size={20} />
                  No announcements recorded in current filter bounds.
                </div>
              )}

              {activeTab === 'faq' && (
                <div className={styles.card_90}>
                  <HelpCircle className={styles.text_91} size={20} />
                  Knowledge Base reference index aligned.
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
