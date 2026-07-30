'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { AdminHeader as Header } from '@src/components/layout';
import { AdminSidebar as Sidebar } from '@src/components/layout';
import { supabase } from "@src/lib/supabase/client";
import styles from "./page.module.css";
import ACICRForm from '@src/features/client-servicing/acicr/ACICRForm';
import { ACICRFormRecord } from '@src/features/client-servicing/acicr/types';

export default function ACICRPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [records, setRecords] = useState<ACICRFormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('acicr_requests')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setRecords(data as ACICRFormRecord[]);
      } else if (error && error.code !== '42P01') {
        // Ignore "relation does not exist" if backend hasn't created the table yet
      }
    } catch (err) {
      console.error('Exception fetching ACICR records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchRecords();
  };

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          <div className={styles.container}>
            <div className={styles.header}>
              <h1 className={styles.title}>Address & Contact Information Change Request</h1>
              <p className={styles.subtitle}>Manage client address and contact updates.</p>
            </div>

            <div className={styles.tableContainer}>
              <div className={styles.tableHeader}>
                <h2 className={styles.tableTitle}>ACICR Logs</h2>
                <div className={styles.actions}>
                  <button onClick={() => setIsFormOpen(true)} className={styles.primaryBtn}>
                    <Plus size={14} /> New Request
                  </button>
                </div>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Date</th>
                      <th className={styles.th}>Client Name</th>
                      <th className={styles.th}>Policy Number</th>
                      <th className={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                          <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                          Loading records...
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">
                          No ACICR records found.
                        </td>
                      </tr>
                    ) : (
                      records.map(record => (
                        <tr key={record.id} className={styles.tr}>
                          <td className={styles.td}>{new Date(record.created_at || '').toLocaleDateString()}</td>
                          <td className={styles.td}>{record.client?.client_name || `${record.first_name} ${record.last_name}`}</td>
                          <td className={styles.td}>{record.policy_number}</td>
                          <td className={styles.td}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              record.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              record.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' :
                              'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        {isFormOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <ACICRForm onClose={() => setIsFormOpen(false)} onSuccess={handleFormSuccess} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
