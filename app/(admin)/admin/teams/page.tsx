'use client';

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/teams/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;

import styles from "@/styles/admin/teams/page.module.css";

  // ======================================================
// State Initialization & Hooks
// ======================================================

  // ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, MoreVertical, Loader2 } from 'lucide-react';
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";
import { supabase } from '@/app/lib/supabase/client';

interface Team {
  id: string;
  code: string;
  title: string;
  description: string;
  membersCount: number;
  completedTasks: number;
  pendingTasks: number;
  performanceRatio: number;
  status: 'Active' | 'Inactive';
  members: string[];
}

const baseTeams = [
  {
    id: '1',
    code: 'ASA',
    title: 'Advisor Support Associate',
    description: 'Administrative support, documentation, tracking systems, and operations.',
    status: 'Active' as const,
  },
  {
    id: '2',
    code: 'BSA',
    title: 'Business Support Associate',
    description: 'Client onboarding, proposals, requirements gathering, and business support.',
    status: 'Active' as const,
  },
  {
    id: '3',
    code: 'CRA',
    title: 'Client Relations Associate',
    description: 'Client servicing, communication, relationship management, and support.',
    status: 'Active' as const,
  },
  {
    id: '4',
    code: 'DCA',
    title: 'Design Content Associate',
    description: 'Branding, graphics, multimedia production, and marketing content.',
    status: 'Active' as const,
  }
];

/**
 * AdminTeamsPage
 *
 * Renders the AdminTeamsPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for AdminTeamsPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function AdminTeamsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [customTeams, setCustomTeams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    members: '',
    status: 'Active' as Team['status']
  });

  /**
 * Executes operations logic for loadData.
 *
 * 
 * @returns State operations sequence.
 */
const loadData = async () => {
    try {
      const { data: profilesData } = await /* Query database records from active repository grid */ supabase.from('profiles').select('*');
      setProfiles(profilesData || []);

      const res = await fetch('/api/tasks');
      if (res.ok) {
        const tasksData = await res.json();
        setTasks(tasksData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const teams: Team[] = useMemo(() => {
    const allBase = [...baseTeams, ...customTeams];
    return allBase.map(team => {
      const teamMembers = profiles.filter(p => 
        p.team?.toUpperCase() === team.code.toUpperCase() ||
        p.department?.toUpperCase() === team.code.toUpperCase()
      );
      const memberNames = teamMembers.map(p => p.full_name || p.email || 'User');
      const membersCount = teamMembers.length;
      
      const memberIds = new Set(teamMembers.map(p => p.id));
      const teamTasks = tasks.filter(task => {
        const assignedUserIds = task.task_assignments?.map((ta: any) => ta.user_id) || [];
        return assignedUserIds.some((id: string) => memberIds.has(id));
      });
      
      const completedTasks = teamTasks.filter((t: any) => t.status === 'Completed').length;
      const pendingTasks = teamTasks.filter((t: any) => t.status === 'Pending' || t.status === 'In Progress').length;
      
      const totalTasks = completedTasks + pendingTasks;
      const performanceRatio = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
      
      return {
        ...team,
        membersCount,
        completedTasks,
        pendingTasks,
        performanceRatio,
        members: memberNames
      };
    });
  }, [profiles, tasks, customTeams]);

  const counts = useMemo(() => ({
    total: teams.length,
    active: teams.filter(t => t.status === 'Active').length,
    inactive: teams.filter(t => t.status === 'Inactive').length,
    totalMembers: teams.reduce((acc, curr) => acc + curr.membersCount, 0)
  }), [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || t.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [teams, searchQuery, selectedStatus]);

  /**
 * Executes operations logic for handleCreateTeam.
 *
 * @param e: React.FormEvent
 * @returns State operations sequence.
 */
const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.title) return;
    
    const memberList = formData.members.split(',').map(m => m.trim().toLowerCase()).filter(Boolean);
    const codeUpper = formData.code.toUpperCase();
    
    const matchedProfiles = profiles.filter(p => p.full_name && memberList.includes(p.full_name.toLowerCase()));
    
    try {
      await Promise.all(matchedProfiles.map(p => 
        /* Query database records from active repository grid */ supabase.from('profiles').update({ team: codeUpper, department: codeUpper }).eq('id', p.id)
      ));
      
      const updatedProfiles = profiles.map(p => {
        if (p.full_name && memberList.includes(p.full_name.toLowerCase())) {
          return { ...p, team: codeUpper, department: codeUpper };
        }
        return p;
      });
      setProfiles(updatedProfiles);
    } catch (err) {
      console.error(err);
    }

    const newTeam = {
      id: Date.now().toString(),
      code: codeUpper,
      title: formData.title,
      description: formData.description,
      status: formData.status
    };

    setCustomTeams([...customTeams, newTeam]);
    setFormData({ code: '', title: '', description: '', members: '', status: 'Active' });
    setIsFormOpen(false);
  };

  /**
 * Executes operations logic for handleDeleteTeam.
 *
 * @param id: string
 * @returns State operations sequence.
 */
const handleDeleteTeam = (id: string) => {
    setCustomTeams(customTeams.filter(t => t.id !== id));
    setActiveMenuId(null);
  };

  if (loading) {
    return (
      <div className={styles.text_0}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={styles.container_1}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className={styles.container_2}>
            <Loader2 className={styles.text_3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.text_4}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.container_5}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.div_6}>
          <div className={styles.container_7}>
            <div>
              <div className={styles.table_8}>
                <span>Domain Core</span>
                <span className={styles.text_9}>|</span>
                <span className={styles.text_10}>Active Sectors</span>
              </div>
              <h1 className={styles.table_11}>Functional Domains</h1>
              <p className={styles.text_12}>Define corporate structures and assign intern rosters</p>
            </div>
            
            <button
              onClick={() => setIsFormOpen(true)}
              className={styles.table_13}
            >
              <Plus size={14} /> Create Functional Domain
            </button>
          </div>

          <div className={styles.container_14}>
            {[
              { label: 'Total Teams', count: counts.total },
              { label: 'Active Domains', count: counts.active },
              { label: 'Assigned Personnel', count: counts.totalMembers },
              { label: 'Inactive Nodes', count: counts.inactive },
            ].map((card, idx) => (
              <div key={idx} className={styles.card_15}>
                <span className={styles.table_16}>{card.label}</span>
                <h3 className={styles.table_17}>{card.count}</h3>
              </div>
            ))}
          </div>

          <div className={styles.container_18}>
            <div className={styles.div_19}>
              <Search className={styles.text_20} size={14} />
              <input
                type="text"
                placeholder="Search teams by parameters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.card_21}
              />
            </div>
            
            <div className={styles.div_22}>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={styles.card_23}
              >
                <option value="All">All Operational States</option>
                <option value="Active">Active State</option>
                <option value="Inactive">Inactive State</option>
              </select>
            </div>
          </div>

          <div className={styles.card_24}>
            <div className={styles.div_25}>
              <table className={styles.text_26}>
                <thead>
                  <tr className={styles.table_27}>
                    <th className={styles.div_28}>Code</th>
                    <th className={styles.div_29}>Domain Title</th>
                    <th className={styles.div_30}>Assigned Personnel</th>
                    <th className={styles.text_31}>Completed Tasks</th>
                    <th className={styles.text_32}>Pending Tasks</th>
                    <th className={styles.text_33}>Performance Index</th>
                    <th className={styles.div_34}>State</th>
                    <th className={styles.text_35}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.text_36}>
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.text_37}>No operational domains discovered mapping verification keys.</td>
                    </tr>
                  ) : (
                    filteredTeams.map((item) => (
                      <tr key={item.id} className={styles.table_38}>
                        <td className={styles.div_39}>
                          <span className={styles.table_40}>
                            {item.code}
                          </span>
                        </td>
                        <td className={styles.div_41}>
                          <p className={styles.text_42}>{item.title}</p>
                          <p className={styles.table_43}>{item.description}</p>
                        </td>
                        <td className={styles.div_44}>
                          <div className={styles.container_45}>
                            {item.members.length === 0 ? (
                              <span className={styles.text_46}>No assigned personnel</span>
                            ) : (
                              item.members.map((m, idx) => (
                                <span key={idx} className={styles.text_47}>
                                  {m}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className={styles.text_48}>{item.completedTasks}</td>
                        <td className={styles.text_49}>{item.pendingTasks}</td>
                        <td className={styles.text_50}>{item.performanceRatio}%</td>
                        <td className={styles.div_51}>
                          <span className={`${styles.text_81} ${
                            item.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-muted text-muted-foreground'
                          }`}>
                            <span className={`${styles.div_82} ${item.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {item.status}
                          </span>
                        </td>
                        <td className={styles.text_52}>
                          <div className={styles.container_53}>
                            <button 
                              onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                              className={styles.table_54}
                            >
                              <MoreVertical size={14} />
                            </button>
                            {activeMenuId === item.id && (
                              <div className={styles.card_55}>
                                <button className={styles.text_56}>View Metadata</button>
                                <button className={styles.text_57}>Adjust Structure</button>
                                <div className={styles.div_58}></div>
                                <button 
                                  onClick={() => handleDeleteTeam(item.id)}
                                  className={styles.text_59}
                                >
                                  Erase Domain
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {isFormOpen && (
            <div className={styles.container_60}>
              <div className={styles.card_61}>
                <div className={styles.container_62}>
                  <h2 className={styles.table_63}>Create Functional Domain</h2>
                  <button onClick={() => setIsFormOpen(false)} className={styles.text_64}>&times;</button>
                </div>
                
                <form onSubmit={handleCreateTeam} className={styles.container_65}>
                  <div className={styles.container_66}>
                    <div>
                      <label className={styles.text_67}>Key Code</label>
                      <input 
                        type="text" required maxLength={4}
                        value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})}
                        placeholder="ASA" 
                        className={styles.card_68} 
                      />
                    </div>
                    <div className={styles.div_69}>
                      <label className={styles.text_70}>Domain Title</label>
                      <input 
                        type="text" required
                        value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Advisor Support Associate" 
                        className={styles.card_71} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className={styles.text_72}>Description Mandate</label>
                    <textarea 
                      rows={3} required
                      value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Map the core operational focuses..." 
                      className={styles.card_73} 
                    />
                  </div>

                  <div>
                    <label className={styles.text_74}>Personnel Array (Comma Separated)</label>
                    <input 
                      type="text" required
                      value={formData.members} onChange={(e) => setFormData({...formData, members: e.target.value})}
                      placeholder="Juan Dela Cruz, Maria Santos" 
                      className={styles.card_75} 
                    />
                  </div>

                  <div>
                    <label className={styles.text_76}>Validation State</label>
                    <select 
                      value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className={styles.card_77}
                    >
                      <option value="Active">Active Operational State</option>
                      <option value="Inactive">Inactive Offline State</option>
                    </select>
                  </div>

                  <div className={styles.card_78}>
                    <button 
                      type="button" 
                      onClick={() => setIsFormOpen(false)} 
                      className={styles.card_79}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className={styles.table_80}
                    >
                      Deploy Architecture
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
