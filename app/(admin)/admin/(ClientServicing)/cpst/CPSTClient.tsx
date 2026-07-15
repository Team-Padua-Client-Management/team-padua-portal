"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Edit2, Trash2, X,
  Upload, FileSpreadsheet, Download, CheckCircle2, Target, Users, Star, Archive
} from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader/page';
import AdminSidebar from '@/app/components/admin/AdminSidebar/page';
import { supabase } from "@/app/lib/supabase/client";

interface Client {
  id: string;
  name: string;
  beneficiary_name?: string;
  relationship?: string;
  policy_number?: string;
  product?: string;
  approval_date?: string;
  mobile_number?: string;
  email_address?: string;
  home_address?: string;
  annual_premium?: number;
  mode_of_payment?: string;
  fund_allocation?: string;
  birthdate: string;
  csmv?: 'Public' | 'Friends Only' | 'Private' | 'Unknown';
  status: 'Prospect' | 'Serviced' | 'Lead';
  created_at?: string;
  updated_at?: string;
}

const PRODUCTS = ['Sun Maxilink Prime', 'Sun Fit and Well', 'Sun FlexiLink', 'Sun Dream Wealth', 'Sun Life Assure'];
const PAYMENT_MODES = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly'];
const CSMV_OPTIONS = ['Public', 'Friends Only', 'Private', 'Unknown'];
const STATUSES = ['Prospect', 'Serviced', 'Lead'];

interface CPSTClientProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export default function CPSTClient({ canCreate, canEdit, canDelete, canExport }: CPSTClientProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('cpst_clients').select('*').order('created_at', { ascending: false });
      setClients(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: currentClient.name || '',
        birthdate: currentClient.birthdate || '',
        policy_number: currentClient.policy_number || '',
        product: currentClient.product || '',
        annual_premium: currentClient.annual_premium || 0,
        mode_of_payment: currentClient.mode_of_payment || 'Annual',
        status: currentClient.status || 'Prospect',
        csmv: currentClient.csmv || 'Unknown',
        mobile_number: currentClient.mobile_number || '',
        email_address: currentClient.email_address || '',
        updated_at: new Date().toISOString()
      };

      if (currentClient.id) {
        await supabase.from('cpst_clients').update(payload).eq('id', currentClient.id);
      } else {
        const newId = 'CL-' + Math.floor(100000 + Math.random() * 900000);
        await supabase.from('cpst_clients').insert([{ ...payload, id: newId }]);
      }
      setActiveModal(null);
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInlineUpdate = async (id: string, field: keyof Client, val: any) => {
    if (!canEdit) return;
    try {
      await supabase.from('cpst_clients').update({ [field]: val }).eq('id', id);
      setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!canDelete) return;
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await supabase.from('cpst_clients').delete().eq('id', id);
        fetchClients();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const exportToCSV = () => {
    if (!canExport || clients.length === 0) return;
    const headers = ['Client Name', 'Birthdate', 'Policy Number', 'Product', 'Annual Premium', 'Payment Mode', 'Status'];
    const rows = clients.map(c => [
      c.name, c.birthdate, c.policy_number || '', c.product || '', c.annual_premium || 0, c.mode_of_payment || '', c.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => '"' + v + '"').join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cpst_export.csv';
    link.click();
  };

  const filteredClients = clients.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (productFilter !== 'ALL' && c.product !== productFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.name?.toLowerCase().includes(s) && !c.policy_number?.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    if (sortBy === 'oldest') return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    return 0;
  });

  const isAllSelected = filteredClients.length > 0 && selectedIds.length === filteredClients.length;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-[#1E293B] font-sans">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Client Prospect Servicing Tracker</h1>
              <p className="text-sm text-[#64748B] mt-1">Classic, elegant registry tracker.</p>
            </div>
            <div className="flex items-center gap-3">
              {canCreate && (
                <button 
                  onClick={() => { setCurrentClient({ status: 'Prospect' }); setActiveModal('add'); }} 
                  className="flex items-center gap-2 bg-[#F4C542] text-black font-semibold px-5 py-2.5 rounded-none text-sm hover:bg-[#e0b53c] transition shadow-sm border border-[#e0b53c]"
                >
                  <Plus size={16} /> Add Client
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'TOTAL CLIENTS', count: clients.length, color: 'text-[#0F172A]', icon: Users, isYellowBorder: true },
                { label: 'SERVICED', count: clients.filter(c => c.status === 'Serviced').length, color: 'text-emerald-600', icon: CheckCircle2 },
                { label: 'PROSPECTS', count: clients.filter(c => c.status === 'Prospect').length, color: 'text-[#D97706]', icon: Star },
                { label: 'LEADS', count: clients.filter(c => c.status === 'Lead').length, color: 'text-blue-600', icon: Target },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className={`bg-white p-5 flex flex-col justify-between shadow-sm border rounded-none ${stat.isYellowBorder ? 'border-[#F4C542]' : 'border-[#E2E8F0]'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{stat.label}</span>
                      <Icon size={14} className="text-[#94A3B8]" />
                    </div>
                    <div className="mt-4">
                      <span className={`text-3xl font-bold ${stat.color}`}>{stat.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1 bg-white border border-[#E2E8F0] rounded-none p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet size={16} className="text-[#64748B]" />
                  <h3 className="text-sm font-bold text-[#0F172A]">CPST Batch Import</h3>
                </div>
                <p className="text-xs text-[#64748B]">Upload Excel or CSV to import clients.</p>
              </div>
              {canCreate && (
                <button 
                  onClick={() => setActiveModal('import')} 
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-white border border-[#CBD5E1] text-[#334155] rounded-none text-sm font-medium hover:bg-[#F1F5F9] transition"
                >
                  <Upload size={14} /> Upload Files
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-none">
            <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-4 justify-between items-center bg-[#FAFAFA]">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={16} />
                <input
                  type="text"
                  placeholder="Search client name, policy number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] bg-white">
                  <option value="ALL">All Statuses</option>
                  {STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="px-3 py-2 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] bg-white">
                  <option value="ALL">All Products</option>
                  {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] bg-white">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
                {canExport && (
                  <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#CBD5E1] text-[#334155] rounded-none text-sm font-medium hover:bg-[#F1F5F9] transition">
                    <Download size={14} /> Export CSV
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider w-10">#</th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider w-10">
                      <input type="checkbox" checked={isAllSelected} onChange={e => setSelectedIds(e.target.checked ? filteredClients.map(c => c.id) : [])} className="rounded-none accent-[#F4C542]" />
                    </th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider">Client Name</th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider">Birthdate</th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider">Policy Number</th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider">Product</th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider">Annual Premium</th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider">Status</th>
                    <th className="py-3 px-4 font-semibold text-[#64748B] uppercase text-[10px] tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredClients.map((client, i) => (
                    <tr key={client.id} className="hover:bg-[#F8F9FA] transition group">
                      <td className="py-2 px-4 text-[#64748B] text-xs">{i + 1}</td>
                      <td className="py-2 px-4">
                        <input type="checkbox" checked={selectedIds.includes(client.id)} onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, client.id] : prev.filter(id => id !== client.id))} className="rounded-none accent-[#F4C542]" />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          className="w-full bg-transparent border-transparent hover:border-[#CBD5E1] focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] rounded-none px-2 py-1 text-sm text-[#0F172A] transition-colors"
                          value={client.name}
                          onChange={e => setClients(prev => prev.map(c => c.id === client.id ? { ...c, name: e.target.value } : c))}
                          onBlur={e => handleInlineUpdate(client.id, 'name', e.target.value)}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="date"
                          className="bg-transparent border-transparent hover:border-[#CBD5E1] focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] rounded-none px-2 py-1 text-sm text-[#0F172A] transition-colors"
                          value={client.birthdate || ''}
                          onChange={e => handleInlineUpdate(client.id, 'birthdate', e.target.value)}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          className="w-full bg-transparent border-transparent hover:border-[#CBD5E1] focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] rounded-none px-2 py-1 text-sm text-[#0F172A] transition-colors"
                          value={client.policy_number || ''}
                          onChange={e => setClients(prev => prev.map(c => c.id === client.id ? { ...c, policy_number: e.target.value } : c))}
                          onBlur={e => handleInlineUpdate(client.id, 'policy_number', e.target.value)}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <select
                          className="bg-transparent border-transparent hover:border-[#CBD5E1] focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] rounded-none px-2 py-1 text-sm text-[#0F172A] transition-colors"
                          value={client.product || ''}
                          onChange={e => handleInlineUpdate(client.id, 'product', e.target.value)}
                          disabled={!canEdit}
                        >
                          <option value="">None</option>
                          {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          className="w-full bg-transparent border-transparent hover:border-[#CBD5E1] focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] rounded-none px-2 py-1 text-sm text-[#0F172A] transition-colors"
                          value={client.annual_premium || 0}
                          onChange={e => handleInlineUpdate(client.id, 'annual_premium', Number(e.target.value))}
                          disabled={!canEdit}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <select
                          className="bg-transparent border-transparent hover:border-[#CBD5E1] focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] rounded-none px-2 py-1 text-sm text-[#0F172A] transition-colors"
                          value={client.status || 'Prospect'}
                          onChange={e => handleInlineUpdate(client.id, 'status', e.target.value)}
                          disabled={!canEdit}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button onClick={() => { setCurrentClient(client); setActiveModal('add'); }} className="p-1.5 text-[#64748B] hover:text-[#F4C542] transition-colors bg-white border border-transparent hover:border-[#F4C542] rounded-none" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteClient(client.id)} className="p-1.5 text-[#64748B] hover:text-red-500 transition-colors bg-white border border-transparent hover:border-red-500 rounded-none" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#64748B] text-sm">No clients found matching the search criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {activeModal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E8F0] w-full max-w-2xl rounded-none shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] bg-[#FAFAFA]">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">{currentClient.id ? 'Edit Client' : 'Add Client'}</h2>
                <p className="text-sm text-[#64748B]">Enter client details into the registry.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-none transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={currentClient.name || ''} onChange={e => setCurrentClient({ ...currentClient, name: e.target.value })} required className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]" placeholder="Full Name" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Birthdate <span className="text-red-500">*</span></label>
                  <input type="date" value={currentClient.birthdate || ''} onChange={e => setCurrentClient({ ...currentClient, birthdate: e.target.value })} required className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]" />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Policy Number</label>
                  <input type="text" value={currentClient.policy_number || ''} onChange={e => setCurrentClient({ ...currentClient, policy_number: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]" placeholder="POL-12345" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Product</label>
                  <select value={currentClient.product || ''} onChange={e => setCurrentClient({ ...currentClient, product: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]">
                    <option value="">Select Product</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Annual Premium</label>
                  <input type="number" value={currentClient.annual_premium || 0} onChange={e => setCurrentClient({ ...currentClient, annual_premium: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]" placeholder="0.00" />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Status</label>
                  <select value={currentClient.status || 'Prospect'} onChange={e => setCurrentClient({ ...currentClient, status: e.target.value as any })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Mobile Number</label>
                  <input type="text" value={currentClient.mobile_number || ''} onChange={e => setCurrentClient({ ...currentClient, mobile_number: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]" placeholder="+63..." />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" value={currentClient.email_address || ''} onChange={e => setCurrentClient({ ...currentClient, email_address: e.target.value })} className="w-full px-3 py-2.5 border border-[#CBD5E1] rounded-none text-sm focus:outline-none focus:border-[#F4C542] focus:ring-1 focus:ring-[#F4C542] bg-white text-[#0F172A]" placeholder="email@example.com" />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-[#E2E8F0] mt-6">
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-white border border-[#CBD5E1] text-[#334155] font-semibold text-sm rounded-none hover:bg-[#F1F5F9] transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-[#F4C542] border border-[#e0b53c] text-black font-semibold text-sm rounded-none hover:bg-[#e0b53c] transition shadow-sm">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'import' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#E2E8F0] w-full max-w-lg rounded-none shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0] bg-[#FAFAFA]">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Import Clients</h2>
                <p className="text-sm text-[#64748B]">Upload an Excel or CSV file.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] rounded-none transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F1F5F9] border border-[#E2E8F0] rounded-none flex items-center justify-center mb-4">
                <Upload size={24} className="text-[#64748B]" />
              </div>
              <p className="text-sm text-[#334155] mb-6 font-medium">
                Select a file to upload. Expected columns: Name, Birthdate, Policy Number, Product, Annual Premium.
              </p>
              <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 bg-[#F4C542] border border-[#e0b53c] text-black font-semibold text-sm rounded-none hover:bg-[#e0b53c] transition shadow-sm">
                <Upload size={16} /> Browse Files
                <input 
                  type="file" 
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const XLSX = await import('xlsx');
                    const buffer = await file.arrayBuffer();
                    const wb = XLSX.read(buffer, { type: 'array' });
                    const sheet = wb.Sheets[wb.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
                    for(let i = 1; i < rows.length; i++) {
                       if(!rows[i][0]) continue;
                       const payload = {
                          id: 'CL-' + Math.floor(100000 + Math.random() * 900000),
                          name: String(rows[i][0] || ''),
                          birthdate: String(rows[i][1] || ''),
                          policy_number: String(rows[i][2] || ''),
                          product: String(rows[i][3] || ''),
                          annual_premium: Number(rows[i][4]) || 0,
                          status: 'Prospect'
                       };
                       await supabase.from('cpst_clients').insert([payload]);
                    }
                    setActiveModal(null);
                    fetchClients();
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
