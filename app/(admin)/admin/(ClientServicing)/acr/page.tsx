'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Download, AlertCircle, Loader2, Save
} from 'lucide-react';
import Header from '@/app/components/admin/AdminHeader';
import Sidebar from '@/app/components/admin/AdminSidebar';
import { supabase } from "@/app/lib/supabase/client";
import styles from "@/styles/admin/cpst/page.module.css";
import SignaturePad from '@/app/components/ui/SignaturePad';
import ClientSelector from '@/app/components/shared/ClientSelector';
import { generateAdvisorChangeRequestPdf } from '@/app/lib/pdf/generateAdvisorChangeRequestPdf';
const TABLE_NAME = 'advisor_change_requests';

export interface FormRecord {
  id: string;
  client_id: string;
  client?: { client_name: string; policy_number: string | null; birthdate: string | null };
  status: string;
  created_at?: string;

  // Section A
  company_name: string;
  designation: string;

  // Section B
  request_type: 'specific_policy' | 'all_accounts' | '';
  policy_numbers: string;
  account_individual_life: boolean;
  account_group_life: boolean;
  account_mutual_fund: boolean;
  account_pre_need: boolean;
  reference_policy_number: string;

  // Section C
  reason_type: 'no_advisor' | 'prefer_another' | '';
  reason_details: string;

  // Section D
  new_advisor_last_name: string;
  new_advisor_first_name: string;
  new_advisor_middle_name: string;

  // Section E
  place_of_signing: string;
  date_of_signing: string;
  policy_owner_signature: string;
  new_advisor_signature: string;
  code_number: string;
  nbo_iso: string;

  // Section F.2
  wants_communication: boolean;

  // Section G
  received_by_staff: string;
  receiving_department: string;
  date_received: string;
  time_received: string;
}

export type AcrRecord = FormRecord;

const defaultRecord: Omit<FormRecord, 'id' | 'client_id' | 'created_at'> = {
  status: 'Pending',
  company_name: 'Sun Life of Canada (Philippines), Inc.',
  designation: '',
  request_type: '',
  policy_numbers: '',
  account_individual_life: false,
  account_group_life: false,
  account_mutual_fund: false,
  account_pre_need: false,
  reference_policy_number: '',
  reason_type: '',
  reason_details: '',
  new_advisor_last_name: '',
  new_advisor_first_name: '',
  new_advisor_middle_name: '',
  place_of_signing: '',
  date_of_signing: new Date().toISOString().split('T')[0],
  policy_owner_signature: '',
  new_advisor_signature: '',
  code_number: '',
  nbo_iso: '',
  wants_communication: false,
  received_by_staff: '',
  receiving_department: '',
  date_received: '',
  time_received: '',
};

export default function AdvisorChangeRequestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FormRecord | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<FormRecord, 'id' | 'created_at'>>({
    client_id: '',
    ...defaultRecord
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Read-only Client Details for Section A
  const [selectedClientDetails, setSelectedClientDetails] = useState<{
    client_name: string;
    birthdate: string | null;
  } | null>(null);

  useEffect(() => {
    if (!formData.client_id) {
      setSelectedClientDetails(null);
      return;
    }
    const fetchClientDetails = async () => {
      try {
        const { data, error: err } = await supabase
          .from('cpst_clients')
          .select('client_name, birthdate')
          .eq('id', formData.client_id)
          .single();
        if (err) throw err;
        setSelectedClientDetails(data);
      } catch (err: any) {
        console.error('Error fetching client details:', err);
      }
    };
    fetchClientDetails();
  }, [formData.client_id]);

  const getClientNameParts = (fullName: string | undefined | null) => {
    if (!fullName) return { last: '', first: '', middle: '' };

    // If format is "Last, First Middle"
    if (fullName.includes(',')) {
      const [lastPart, restPart] = fullName.split(',').map(s => s.trim());
      const restWords = restPart ? restPart.split(/\s+/) : [];
      const first = restWords[0] || '';
      const middle = restWords.slice(1).join(' ');
      return { last: lastPart, first, middle };
    } else {
      // If format is "First Middle Last"
      const words = fullName.trim().split(/\s+/);
      if (words.length === 1) {
        return { last: '', first: words[0], middle: '' };
      }
      if (words.length === 2) {
        return { last: words[1], first: words[0], middle: '' };
      }
      return {
        last: words[words.length - 1],
        first: words[0],
        middle: words.slice(1, -1).join(' ')
      };
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          client:cpst_clients(client_name, policy_number, birthdate)
        `)
        .order('created_at', { ascending: false });

      if (err) {
        if (err.code === '42P01' || err.code === 'PGRST200' || err.code === 'PGRST205') {
          setRecords([]);
          return;
        }
        throw err;
      }
      setRecords(data || []);
    } catch (err: any) {
      console.error('Error fetching records:', err.message || err, JSON.stringify(err));
      if (!err.message?.includes('does not exist') && !err.message?.includes('relationship')) {
        setError(err.message || 'Failed to fetch records');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleClientSelect = (clientId: string) => {
    setFormData(prev => ({ ...prev, client_id: clientId }));
  };

  const handleOpenModal = (record?: FormRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        client_id: record.client_id || '',
        company_name: record.company_name || 'Sun Life of Canada (Philippines), Inc.',
        designation: record.designation || '',
        request_type: record.request_type || '',
        policy_numbers: record.policy_numbers || '',
        account_individual_life: !!record.account_individual_life,
        account_group_life: !!record.account_group_life,
        account_mutual_fund: !!record.account_mutual_fund,
        account_pre_need: !!record.account_pre_need,
        reference_policy_number: record.reference_policy_number || '',
        reason_type: record.reason_type || '',
        reason_details: record.reason_details || '',
        new_advisor_last_name: record.new_advisor_last_name || '',
        new_advisor_first_name: record.new_advisor_first_name || '',
        new_advisor_middle_name: record.new_advisor_middle_name || '',
        place_of_signing: record.place_of_signing || '',
        date_of_signing: record.date_of_signing || new Date().toISOString().split('T')[0],
        policy_owner_signature: record.policy_owner_signature || '',
        new_advisor_signature: record.new_advisor_signature || '',
        code_number: record.code_number || '',
        nbo_iso: record.nbo_iso || '',
        wants_communication: !!record.wants_communication,
        received_by_staff: record.received_by_staff || '',
        receiving_department: record.receiving_department || '',
        date_received: record.date_received || '',
        time_received: record.time_received || '',
        status: record.status || 'Pending'
      });
      if (record.client) {
        setSelectedClientDetails({
          client_name: record.client.client_name,
          birthdate: record.client.birthdate
        });
      }
    } else {
      setEditingRecord(null);
      setFormData({
        client_id: '',
        ...defaultRecord
      });
      setSelectedClientDetails(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) {
      setError("Please select a client.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (editingRecord) {
        const payload: any = { ...formData };
        if (!payload.date_received) payload.date_received = null;
        if (!payload.date_of_signing) payload.date_of_signing = null;

        console.log('Submitting payload (update):', payload);
        const { error: updateError } = await supabase
          .from(TABLE_NAME)
          .update(payload)
          .eq('id', editingRecord.id);

        if (updateError) throw updateError;
        setSuccess("Record updated successfully");
      } else {
        const payload: any = { ...formData };
        if (!payload.date_received) payload.date_received = null;
        if (!payload.date_of_signing) payload.date_of_signing = null;

        console.log('Submitting payload (insert):', payload);
        const { error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([payload]);

        if (insertError) throw insertError;
        setSuccess("Record created successfully");
      }

      setIsModalOpen(false);
      fetchRecords();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('FULL ERROR:', JSON.stringify(err, null, 2));
      console.error('ERROR OBJECT:', err);
      console.error('MESSAGE:', err?.message);
      console.error('STACK:', err?.stack);

      // Extract Supabase-specific details if available
      const details = err?.details || err?.hint || '';
      const message = err?.message || 'Failed to save record';
      setError(details ? `${message} - ${details}` : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async (record: FormRecord) => {
    try {
      setIsGeneratingPdf(true);
      setError("");

      const ownerName = getClientNameParts(record.client?.client_name);
      const ownerDob = record.client?.birthdate || '';

      const pdfBytes = await generateAdvisorChangeRequestPdf(record, ownerName, ownerDob);

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const formattedDate = new Date().toISOString().split('T')[0];
      a.download = `Advisor_Change_Request_${record.client?.client_name || 'Record'}_${formattedDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setSuccess("PDF downloaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      setLoading(true);
      const { error: err } = await supabase.from(TABLE_NAME).delete().eq('id', recordToDelete);
      if (err) throw err;
      setSuccess("Record deleted successfully");
      fetchRecords();
    } catch (err: any) {
      console.error('Error deleting:', err);
      setError(err.message || 'Failed to delete record');
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const clientNameParts = getClientNameParts(selectedClientDetails?.client_name);
  const clientDob = selectedClientDetails?.birthdate || '';

  return (
    <div className={styles.text_52}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.container_53}>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className={styles.div_54}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Advisor Change Request</h1>
              <p className="text-sm text-gray-500">Manage and generate Sun Life advisor change request forms.</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              New Request
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 text-green-700">
              {success}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-y border-gray-100 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Client Name</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Date</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Loading...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No requests found. Create one to get started. (Make sure advisor_change_requests table exists)
                      </td>
                    </tr>
                  ) : (
                    records.filter(r =>
                      (r.client?.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (r.request_type || '').toLowerCase().includes(searchQuery.toLowerCase())
                    ).map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {record.client?.client_name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {record.request_type === 'specific_policy' ? 'Specific Policy' : record.request_type === 'all_accounts' ? 'All Accounts' : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadPdf(record)}
                              disabled={isGeneratingPdf}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            </button>
                            <button
                              onClick={() => handleOpenModal(record)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(record.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRecord ? 'Edit Advisor Change Request' : 'New Advisor Change Request'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
              <form id="acrForm" onSubmit={handleSubmit} className="space-y-8">
                {/* Client Selection */}
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Client</h3>
                  <ClientSelector
                    onChange={handleClientSelect}
                    value={formData.client_id}
                  />
                </div>

                {formData.client_id && (
                  <>
                    {/* Banner Header */}
                    <div className="bg-[#F2AF00] w-full py-4 px-6 mb-6 rounded-md flex items-center justify-between shadow-sm">
                      <h2 className="text-xl font-bold text-black uppercase tracking-wide">Advisor Change Request</h2>
                      <div className="text-black font-bold text-xl tracking-tighter">Sun Life</div>
                    </div>

                    {/* Section A - General Information */}
                    <div className="mb-6">
                      <div className="bg-gray-900 text-white font-semibold px-3 py-2 rounded-t-md">
                        A   General Information
                      </div>
                      <div className="bg-white border border-t-0 border-gray-200 rounded-b-md p-4 space-y-4">
                        <p className="font-semibold text-gray-900 text-sm">A.1 Policy Owner/Policy Holder (for Group Insurance)/Plan Holder/Investor</p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" value={clientNameParts.last} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" value={clientNameParts.first} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                            <input type="text" value={clientNameParts.middle} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date of Birth (For Individual Account only)
                              <span className="block text-xs font-normal text-gray-500">Day-Month-Year, e.g. 01-JAN-2020</span>
                            </label>
                            <input type="date" value={clientDob} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                          </div>
                        </div>

                        <p className="font-semibold text-gray-900 text-sm mt-4">A.2</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                            <input type="text" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                            <input type="text" value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Names and DOB auto-filled from client record</p>
                      </div>
                    </div>

                    {/* Section B - Request Details */}
                    <div className="mb-6">
                      <div className="bg-gray-900 text-white font-semibold px-3 py-2 rounded-t-md">
                        B   Request Details (choose one below)
                      </div>
                      <div className="bg-white border border-t-0 border-gray-200 rounded-b-md p-4 space-y-6">
                        <div className="space-y-2">
                          <label className="flex items-start gap-2 font-medium text-gray-900">
                            <input type="radio" name="request_type" checked={formData.request_type === 'specific_policy'} onChange={() => setFormData({ ...formData, request_type: 'specific_policy', account_individual_life: false, account_group_life: false, account_mutual_fund: false, account_pre_need: false, reference_policy_number: '' })} className="mt-1" />
                            <div className="max-w-2xl">
                              <p className="leading-snug">B.1 Request a particular policy/plan/account number(s) only.</p>
                              <p className="text-sm font-normal text-gray-600 mt-1 leading-snug">Specify below the policy/plan/account number(s) to be transferred (incorrect policy/plan/account number(s) will not be processed):</p>
                            </div>
                          </label>
                          {formData.request_type === 'specific_policy' && (
                            <div className="ml-6 pl-2">
                              <textarea placeholder="Policy/Plan/Account Number(s)" value={formData.policy_numbers} onChange={e => setFormData({ ...formData, policy_numbers: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={3} />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 mt-4">
                          <label className="flex items-start gap-2 font-medium text-gray-900">
                            <input type="radio" name="request_type" checked={formData.request_type === 'all_accounts'} onChange={() => setFormData({ ...formData, request_type: 'all_accounts', policy_numbers: '' })} className="mt-1" />
                            <div className="max-w-2xl">
                              <p className="leading-snug">B.2 Request will apply to ALL existing client's account as of date of request (select the applicable type of account to be transferred):</p>
                            </div>
                          </label>
                          {formData.request_type === 'all_accounts' && (
                            <div className="ml-6 pl-2 space-y-4">
                              <div className="space-y-2">
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={formData.account_individual_life} onChange={e => setFormData({ ...formData, account_individual_life: e.target.checked })} />
                                  <span className="text-sm text-gray-700">All Individual Life Insurance Policies</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={formData.account_group_life} onChange={e => setFormData({ ...formData, account_group_life: e.target.checked })} />
                                  <span className="text-sm text-gray-700">All Group Life Insurance Contracts (for Policyholder of Group Insurance)</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={formData.account_mutual_fund} onChange={e => setFormData({ ...formData, account_mutual_fund: e.target.checked })} />
                                  <span className="text-sm text-gray-700">All Mutual Fund Accounts</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input type="checkbox" checked={formData.account_pre_need} onChange={e => setFormData({ ...formData, account_pre_need: e.target.checked })} />
                                  <span className="text-sm text-gray-700">All Pre-Need Plans</span>
                                </label>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For our reference, specify at least one policy/plan/account number:</label>
                                <input type="text" value={formData.reference_policy_number} onChange={e => setFormData({ ...formData, reference_policy_number: e.target.value })} className="w-full max-w-md px-3 py-2 border rounded-md" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Section C - Reason for Change */}
                    <div className="mb-6">
                      <div className="bg-gray-900 text-white font-semibold px-3 py-2 rounded-t-md">
                        C   Reason for Change
                      </div>
                      <div className="bg-white border border-t-0 border-gray-200 rounded-b-md p-4 space-y-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="reason_type" checked={formData.reason_type === 'no_advisor'} onChange={() => setFormData({ ...formData, reason_type: 'no_advisor', reason_details: '' })} />
                          <span className="text-sm text-gray-900">You have no Advisor</span>
                        </label>
                        <label className="flex items-start gap-2">
                          <input type="radio" name="reason_type" checked={formData.reason_type === 'prefer_another'} onChange={() => setFormData({ ...formData, reason_type: 'prefer_another' })} className="mt-1" />
                          <div className="flex-1 max-w-xl">
                            <span className="text-sm text-gray-900">You prefer another Advisor (provide reason below)</span>
                            {formData.reason_type === 'prefer_another' && (
                              <textarea value={formData.reason_details} onChange={e => setFormData({ ...formData, reason_details: e.target.value })} className="w-full mt-2 px-3 py-2 border rounded-md" rows={3} placeholder="Please provide details..." />
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Section D - New Advisor Information */}
                    <div className="mb-6">
                      <div className="bg-gray-900 text-white font-semibold px-3 py-2 rounded-t-md">
                        D   New Advisor Information
                      </div>
                      <div className="bg-white border border-t-0 border-gray-200 rounded-b-md p-4">
                        <p className="font-semibold text-gray-900 text-sm mb-4">New Advisor's Full Name</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input type="text" value={formData.new_advisor_last_name} onChange={e => setFormData({ ...formData, new_advisor_last_name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input type="text" value={formData.new_advisor_first_name} onChange={e => setFormData({ ...formData, new_advisor_first_name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                            <input type="text" value={formData.new_advisor_middle_name} onChange={e => setFormData({ ...formData, new_advisor_middle_name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section E - Signatures */}
                    <div className="mb-6">
                      <div className="bg-gray-900 text-white font-semibold px-3 py-2 rounded-t-md">
                        E   Signatures
                      </div>
                      <div className="bg-white border border-t-0 border-gray-200 rounded-b-md p-4 space-y-6">
                        <div className="text-xs text-gray-600 space-y-2 mb-4 bg-gray-50 p-4 rounded-md border border-gray-100">
                          <p className="font-semibold text-gray-900 mb-2 text-sm">By signing below, you confirm your understanding and agreement to the following:</p>
                          <p>a. All services relating to your account(s) as indicated in this form shall be coursed through your new servicing advisor.</p>
                          <p>b. You will inform us within 30 calendar days of any change in your circumstances, including but not limited to citizenship, and submit the applicable document accordingly.</p>
                          <p>c. You acknowledge the Company's statutory responsibility to provide your information, including but not limited to local or foreign tax status, to the appropriate authority.</p>
                          <p>d. You acknowledge that the Company, its employees, duly authorized representatives, related companies, third party service providers and vendors, shall process and share your and your insured's information, with any person or organization to (i) service this account, (ii) process claims and enforce the contract, and (iii) pursue its legitimate and lawful rights and interests and other purposes allowed under privacy laws and regulations.</p>
                          <p>e. Your personal data shall be retained throughout the existence of your account(s) and/or until expiration of the retention limit set by laws and regulations from account closure and the period set for destruction or disposal of records. You certify that you have read, understood and agree with the declarations and authorizations above, including Sun Life's privacy policy found in https://online.sunlife.com.ph/privacy.</p>
                          <p>f. Your rights include the right to be informed, access your data, rectify errors, object to processing, and file a complaint. For more information about your rights and how we protect your data, you may access our privacy policy at https://online.sunlife.com.ph/privacy. Should you have any concerns in relation to your rights or the processing of your personal data, you may get in touch with our Data Protection Officer at privacyconcern@sunlife.com.</p>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900 text-sm mb-4">E.1 Complete Name of Policy Owner/Policy Holder (for Group Insurance)/Plan Holder/Investor</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                              <input type="text" value={clientNameParts.last} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                              <input type="text" value={clientNameParts.first} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                              <input type="text" value={clientNameParts.middle} disabled className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500 cursor-not-allowed" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Place of Signing</label>
                              <input type="text" value={formData.place_of_signing} onChange={e => setFormData({ ...formData, place_of_signing: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Signing
                                <span className="block text-xs font-normal text-gray-500">Day-Month-Year, e.g. 01-JAN-2019</span>
                              </label>
                              <input type="date" value={formData.date_of_signing} onChange={e => setFormData({ ...formData, date_of_signing: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-gray-900 text-sm mb-4">E.2 Accepted:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Signature of Policy Owner/Policy Holder (for Group Insurance)/Plan Holder/Investor</label>
                              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                                <SignaturePad
                                  initialSignature={formData.policy_owner_signature}
                                  onSignatureChange={(data: string | null) => setFormData({ ...formData, policy_owner_signature: data || '' })}
                                  title="Policy Owner Signature"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Signature of New Advisor</label>
                              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50/50">
                                <SignaturePad
                                  initialSignature={formData.new_advisor_signature}
                                  onSignatureChange={(data: string | null) => setFormData({ ...formData, new_advisor_signature: data || '' })}
                                  title="New Advisor Signature"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Code Number</label>
                                  <input type="text" value={formData.code_number} onChange={e => setFormData({ ...formData, code_number: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">NBO/ISO</label>
                                  <input type="text" value={formData.nbo_iso} onChange={e => setFormData({ ...formData, nbo_iso: e.target.value })} className="w-full px-3 py-1.5 border rounded-md text-sm" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Client Portal / Mobile App Instructions */}
                        <div className="mt-8 bg-gray-50 p-4 rounded-md border border-gray-200">
                          <p className="font-bold text-gray-900 text-sm italic mb-4">"Let us serve you better! Updating made easier. You may now update your contact information via the Client Portal or Mobile App."</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-700">
                            <div>
                              <p className="font-bold text-gray-900 mb-2">Option 1: Via Client Portal (www.sunlife.com.ph)</p>
                              <ol className="list-decimal pl-4 space-y-1">
                                <li>Visit sunlife.com.ph and click on the Sign In button.</li>
                                <li>Click Settings and select edit Contract Details/Mailing Address</li>
                                <li>Update relevant details then click Save.</li>
                              </ol>
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 mb-2">Option 2: Via Mobile App</p>
                              <p className="mb-2 italic">Download the Sun Life PH App at App/Play Store or Scan the QR code -{'>'}</p>
                              <ol className="list-decimal pl-4 space-y-1">
                                <li>Login to your Sun Life PH Mobile App</li>
                                <li>Click Service Request and click Personal Details/Update Mailing Address</li>
                                <li>Click Edit button on your Mobile, International, Home, Business No., or Email Address and/or on your Permanent, Present, or Business Address</li>
                                <li>Update then click Save.</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section F - Communication Preference */}
                    <div className="mb-6">
                      <div className="bg-white border border-gray-200 rounded-md p-4">
                        {/* Section F.2 - Communication Consent */}
                        <div>
                          <label className="flex items-start gap-2 font-medium text-gray-900">
                            <div className="max-w-2xl">
                              <p className="leading-snug">F.2 Would you like to receive personalized communication and product offers from Sun Life of Canada (Philippines), Inc. (SLOCPI); Sun Life Financial Plans, Inc. (SLFPI); Sun Life Asset Management Company, Inc. (SLAMCI); and other members of the Sun Life group that may help with your financial needs?</p>
                            </div>
                          </label>
                        </div>
                        <div className="flex gap-6 mt-4">
                          <label className="flex items-center gap-2">
                            <input type="radio" name="wants_communication" checked={formData.wants_communication === true} onChange={() => setFormData({ ...formData, wants_communication: true })} />
                            <span className="text-sm font-medium">Yes</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="radio" name="wants_communication" checked={formData.wants_communication === false} onChange={() => setFormData({ ...formData, wants_communication: false })} />
                            <span className="text-sm font-medium">No</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Section G - For Office Use Only */}
                    <div className="mb-6">
                      <div className="bg-gray-900 text-white font-semibold px-3 py-2 rounded-t-md">
                        G   For Office Use Only
                      </div>
                      <div className="bg-white border border-t-0 border-gray-200 rounded-b-md p-4 space-y-4 relative">
                        <div className="absolute top-4 right-4 text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          For Sun Life staff use only
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements received by — Complete Name of Staff</label>
                            <input type="text" value={formData.received_by_staff} onChange={e => setFormData({ ...formData, received_by_staff: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Receiving Department/Office</label>
                            <input type="text" value={formData.receiving_department} onChange={e => setFormData({ ...formData, receiving_department: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Received [e.g. 01-JAN-2019] Day-Month-Year</label>
                            <input type="date" value={formData.date_received} onChange={e => setFormData({ ...formData, date_received: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Received</label>
                            <input type="time" value={formData.time_received} onChange={e => setFormData({ ...formData, time_received: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                form="acrForm"
                type="submit"
                disabled={isSubmitting || !formData.client_id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Request</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this Advisor Change Request? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setRecordToDelete(null);
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
