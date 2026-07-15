"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X,
  Upload, FileSpreadsheet, Download, CheckCircle2, Target, Users, Star
} from 'lucide-react';
import AdminHeader from '@/app/components/admin/AdminHeader';
import AdminSidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import SignaturePad from '@/app/components/ui/SignaturePad';
import { exportToPDF, exportToDOCS } from '@/app/lib/export';
import ExportDropdown from '@/app/components/shared/ExportDropdown';

export interface ClientManagementRecord {
  id: string;
  clientName: string;
  relationship: string;
  policyNumber: string;
  product: string;
  approvalDate: string;
  annualPremium: number;
  mobileNumber: string;
  email: string;
  address: string;
  beneficiary: string;
  fundAllocation: string;
  modeOfPayment: string;
  signatureData?: string;
  created_at?: string;
}

const PRODUCTS = ['Sun Maxilink Prime', 'Sun Fit and Well', 'Sun FlexiLink', 'Sun Dream Wealth', 'Sun Life Assure'];
const PAYMENT_MODES = ['Annual', 'Semi-Annual', 'Quarterly', 'Monthly'];

interface CPSTClientProps {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export default function CPSTClient({ canCreate, canEdit, canDelete, canExport }: CPSTClientProps) {
  const [clients, setClients] = useState<ClientManagementRecord[]>([]);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'import' | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<ClientManagementRecord>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('client_management').select('*').order('created_at', { ascending: false });
      if (error) {
         setClients([
            {
              id: 'CAMS-001',
              clientName: 'Juan Dela Cruz',
              relationship: 'Self',
              policyNumber: 'POL-998877',
              product: 'Sun Maxilink Prime',
              approvalDate: '2025-01-15',
              annualPremium: 45000,
              mobileNumber: '+639171234567',
              email: 'juan@example.com',
              address: 'Makati City',
              beneficiary: 'Maria Dela Cruz',
              fundAllocation: '100% Equity',
              modeOfPayment: 'Annual'
            }
         ]);
      } else {
         setClients(data || []);
      }
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
        clientName: currentClient.clientName || '',
        relationship: currentClient.relationship || '',
        policyNumber: currentClient.policyNumber || '',
        product: currentClient.product || '',
        approvalDate: currentClient.approvalDate || '',
        annualPremium: currentClient.annualPremium || 0,
        mobileNumber: currentClient.mobileNumber || '',
        email: currentClient.email || '',
        address: currentClient.address || '',
        beneficiary: currentClient.beneficiary || '',
        fundAllocation: currentClient.fundAllocation || '',
        modeOfPayment: currentClient.modeOfPayment || 'Annual',
        signatureData: currentClient.signatureData || null,
      };

      if (currentClient.id) {
        await supabase.from('client_management').update(payload).eq('id', currentClient.id);
      } else {
        const newId = 'CAMS-' + Math.floor(100000 + Math.random() * 900000);
        await supabase.from('client_management').insert([{ ...payload, id: newId }]);
      }
      setActiveModal(null);
      fetchClients();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!canDelete) return;
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await supabase.from('client_management').delete().eq('id', id);
        fetchClients();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const exportToCSV = () => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Annual Premium', 'Mobile', 'Email', 'Address', 'Beneficiary', 'Fund Allocation', 'Mode of Payment'];
    const rows = filteredClients.map(c => [
      c.clientName, c.relationship, c.policyNumber, c.product, c.approvalDate, c.annualPremium, c.mobileNumber, c.email, c.address, c.beneficiary, c.fundAllocation, c.modeOfPayment
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => '"' + String(v || '') + '"').join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'client_management_export.csv';
    link.click();
  };

  const handleExportPDF = () => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Beneficiary', 'Payment Mode'];
    const rows = filteredClients.map(c => [
      c.clientName, c.relationship, c.policyNumber, c.product, c.approvalDate, `PHP ${c.annualPremium?.toLocaleString()}`, c.mobileNumber, c.email, c.beneficiary, c.modeOfPayment
    ]);
    exportToPDF({
      title: 'Advisor Clients Registry',
      description: 'Sun Life Financial - Official record of active clients, premiums, policy types, and financial products.',
      headers,
      rows,
      filename: `advisor_clients_list_${new Date().toISOString().slice(0,10)}.pdf`,
      stats: [
        { label: 'Total Clients', value: filteredClients.length },
        { label: 'Active Policies', value: filteredClients.filter(c => c.policyNumber).length },
        { label: 'Total Premiums', value: `PHP ${filteredClients.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0).toLocaleString()}` }
      ]
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'word') => {
    if (!canExport || filteredClients.length === 0) return;
    const headers = ['Client Name', 'Relationship', 'Policy Number', 'Product', 'Approval Date', 'Premium', 'Mobile Number', 'Email', 'Beneficiary', 'Payment Mode'];
    
    if (format === 'csv') {
      exportToCSV();
    } else if (format === 'pdf') {
      handleExportPDF();
    } else if (format === 'word') {
      const rows = filteredClients.map(c => [
        c.clientName, c.relationship, c.policyNumber, c.product, c.approvalDate, `PHP ${c.annualPremium?.toLocaleString()}`, c.mobileNumber, c.email, c.beneficiary, c.modeOfPayment
      ]);
      exportToDOCS(
        'Advisor Clients Registry',
        headers,
        rows,
        `advisor_clients_list_${new Date().toISOString().slice(0,10)}.doc`
      );
    }
  };

  const filteredClients = clients.filter(c => {
    if (productFilter !== 'ALL' && c.product !== productFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!c.clientName?.toLowerCase().includes(s) && !c.policyNumber?.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    if (sortBy === 'oldest') return new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime();
    if (sortBy === 'name') return (a.clientName || '').localeCompare(b.clientName || '');
    return 0;
  });

  const isAllSelected = filteredClients.length > 0 && selectedIds.length === filteredClients.length;

  return (
    <div className="flex min-h-screen bg-background text-text font-sans">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text">Client Management Tracker</h1>
              <p className="text-sm text-text-secondary mt-1">Client Advisor Management System (CAMS) main registry.</p>
            </div>
            <div className="flex items-center gap-3">
              {canCreate && (
                <button 
                  onClick={() => { setCurrentClient({}); setActiveModal('add'); }} 
                  className="flex items-center gap-2 bg-primary text-black font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/80 transition shadow-sm border border-[#e0b53c] hover:-translate-y-0.5"
                >
                  <Plus size={16} /> Add Client
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'TOTAL CLIENTS', count: clients.length, color: 'text-text', icon: Users, isYellowBorder: true },
                { label: 'ACTIVE POLICIES', count: clients.filter(c => c.policyNumber).length, color: 'text-emerald-600', icon: CheckCircle2 },
                { label: 'PREMIUMS', count: clients.reduce((acc, curr) => acc + (curr.annualPremium || 0), 0).toLocaleString(), color: 'text-blue-600', icon: Target },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className={`bg-card p-6 flex flex-col justify-between shadow-[0_2px_10px_rgb(0,0,0,0.04)] border rounded-[20px] ${stat.isYellowBorder ? 'border-primary/50' : 'border-border/50'} hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-shadow duration-300`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{stat.label}</span>
                      <Icon size={16} className="text-muted" />
                    </div>
                    <div className="mt-4">
                      <span className={`text-3xl font-bold ${stat.color}`}>{stat.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1 bg-card border border-border/50 rounded-[20px] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] flex flex-col justify-between hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-shadow duration-300">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet size={16} className="text-muted" />
                  <h3 className="text-sm font-bold text-text">CAMS Batch Import</h3>
                </div>
                <p className="text-xs text-text-secondary">Upload Excel or CSV to import clients.</p>
              </div>
              {canCreate && (
                <button 
                  onClick={() => setActiveModal('import')} 
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-card border border-border text-text-secondary rounded-xl text-sm font-medium hover:bg-surface-2 hover:border-slate-300 transition"
                >
                  <Upload size={14} /> Upload Files
                </button>
              )}
            </div>
          </div>

          <div className="bg-card border border-border/50 shadow-[0_2px_10px_rgb(0,0,0,0.04)] rounded-[20px] overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center bg-card">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-2.5 text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Search client name, policy number..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-text"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary bg-card text-text">
                  <option value="ALL">All Products</option>
                  {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border border-border rounded-xl text-sm focus:outline-none focus:border-primary bg-card text-text">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
                {canExport && (
                  <ExportDropdown onExport={handleExport} />
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-surface-2 border-b border-border">
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider w-10">#</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Client Name</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Relationship</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Policy Number</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Product</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Approval Date</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Annual Premium</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Mobile Number</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Email</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Address</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Beneficiary</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Fund Allocation</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">Mode of Payment</th>
                    <th className="py-2.5 px-3 font-semibold text-text-secondary uppercase text-[10px] tracking-wider text-right sticky right-0 bg-surface-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={14} className="py-8 text-center text-text-secondary text-sm">Loading...</td></tr>
                  ) : filteredClients.map((client, i) => (
                    <tr key={client.id} className="hover:bg-surface-2/50 transition group border-b border-slate-50 last:border-0">
                      <td className="py-2 px-3 text-text-secondary text-xs">{i + 1}</td>
                      <td className="py-2 px-3 font-medium text-text text-xs">{client.clientName}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.relationship}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.policyNumber}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.product}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.approvalDate}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">₱{client.annualPremium?.toLocaleString()}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.mobileNumber}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.email}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs max-w-[150px] truncate" title={client.address}>{client.address}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.beneficiary}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.fundAllocation}</td>
                      <td className="py-2 px-3 text-text-secondary text-xs">{client.modeOfPayment}</td>
                      <td className="py-2 px-3 text-right sticky right-0 bg-card group-hover:bg-surface-2/50 text-xs">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <button onClick={() => { setCurrentClient(client); setActiveModal('edit'); }} className="p-1.5 text-muted hover:text-[#F4C542] transition-colors bg-card border border-transparent hover:border-primary rounded-md shadow-sm" title="Edit">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteClient(client.id)} className="p-1.5 text-muted hover:text-red-500 transition-colors bg-card border border-transparent hover:border-red-500 rounded-md shadow-sm" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={14} className="py-8 text-center text-muted-foreground text-sm">No clients found matching the search criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-text">{currentClient.id ? 'Edit Client' : 'Add Client'}</h2>
                <p className="text-sm text-text-secondary">Enter client details into the management system.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-muted hover:text-text hover:bg-slate-200 rounded-xl transition">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateClient} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Client Name <span className="text-red-500">*</span></label>
                  <input type="text" value={currentClient.clientName || ''} onChange={e => setCurrentClient({ ...currentClient, clientName: e.target.value })} required className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Full Name" />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Relationship</label>
                  <input type="text" value={currentClient.relationship || ''} onChange={e => setCurrentClient({ ...currentClient, relationship: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Self, Spouse, etc." />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Approval Date</label>
                  <input type="date" value={currentClient.approvalDate || ''} onChange={e => setCurrentClient({ ...currentClient, approvalDate: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" />
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Policy Number</label>
                  <input type="text" value={currentClient.policyNumber || ''} onChange={e => setCurrentClient({ ...currentClient, policyNumber: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="POL-12345" />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Product</label>
                  <select value={currentClient.product || ''} onChange={e => setCurrentClient({ ...currentClient, product: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground">
                    <option value="">Select Product</option>
                    {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Annual Premium</label>
                  <input type="number" value={currentClient.annualPremium || ''} onChange={e => setCurrentClient({ ...currentClient, annualPremium: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="0.00" />
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mode of Payment</label>
                  <select value={currentClient.modeOfPayment || 'Annual'} onChange={e => setCurrentClient({ ...currentClient, modeOfPayment: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground">
                    {PAYMENT_MODES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Fund Allocation</label>
                  <input type="text" value={currentClient.fundAllocation || ''} onChange={e => setCurrentClient({ ...currentClient, fundAllocation: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="100% Equity" />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Beneficiary</label>
                  <input type="text" value={currentClient.beneficiary || ''} onChange={e => setCurrentClient({ ...currentClient, beneficiary: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Beneficiary Name" />
                </div>

                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mobile Number</label>
                  <input type="text" value={currentClient.mobileNumber || ''} onChange={e => setCurrentClient({ ...currentClient, mobileNumber: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="+63..." />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" value={currentClient.email || ''} onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="email@example.com" />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Address</label>
                  <input type="text" value={currentClient.address || ''} onChange={e => setCurrentClient({ ...currentClient, address: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-none text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground" placeholder="Full Address" />
                </div>
                <div className="col-span-3">
                  <SignaturePad 
                    initialSignature={currentClient.signatureData} 
                    onSignatureChange={(sig) => setCurrentClient({ ...currentClient, signatureData: sig || undefined })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
                <button type="button" onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-card border border-border text-text-secondary font-semibold text-sm rounded-xl hover:bg-surface-2 transition">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-primary border border-[#e0b53c] text-black font-semibold text-sm rounded-xl hover:bg-primary/80 transition shadow-sm hover:-translate-y-0.5">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'import' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-text">Import Clients</h2>
                <p className="text-sm text-text-secondary">Upload an Excel or CSV file.</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-muted hover:text-text hover:bg-slate-200 rounded-xl transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted border border-border rounded-none flex items-center justify-center mb-4">
                <Upload size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-6 font-medium">
                Select a file to upload.
              </p>
              <label className="cursor-pointer flex items-center justify-center gap-2 w-full py-3 bg-primary border border-[#e0b53c] text-black font-semibold text-sm rounded-xl hover:bg-primary/80 transition shadow-sm hover:-translate-y-0.5">
                <Upload size={16} /> Browse Files
                <input 
                  type="file" 
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    alert("Import functionality mock");
                    setActiveModal(null);
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
