'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Download, Loader2, Eye, FileEdit } from 'lucide-react';
import { supabase } from '@src/lib/supabase/client';
import { generateBeneficiaryChangeRequestPdfFromTemplate } from '@src/features/client-servicing/pdf/generateBeneficiaryChangeRequestPdfFromTemplate';

interface BcrStandardFormProps {
  initialValues: Record<string, any>;
  clientId: string;
  selectedClientDetails: any;
  status: string;
  onBack: () => void;
  onClientSelect: (clientId: string) => void;
  onSaveDraft: (values: Record<string, any>) => void;
  onExportPdf: (values: Record<string, any>) => void;
  isSubmitting: boolean;
  isGeneratingPdf: boolean;
  config?: any;
}

export default function BcrStandardForm({
  initialValues,
  clientId,
  selectedClientDetails,
  status,
  onBack,
  onClientSelect,
  onSaveDraft,
  onExportPdf,
  isSubmitting,
  isGeneratingPdf,
}: BcrStandardFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialValues);
  const [clients, setClients] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'form' | 'literal'>('form');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase.from('cpst_clients').select('id, client_name, policy_number, birthdate, mobile_number, email, address, beneficiary').order('client_name');
      if (data) setClients(data);
    }
    loadClients();
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientSelectLocal = async (newClientId: string) => {
    handleChange('client_id', newClientId);
    onClientSelect(newClientId);

    if (!newClientId) return;

    // Find the client from the already-loaded list (which now has all data)
    const selectedClient = clients.find(c => c.id === newClientId);
    if (!selectedClient) return;

    const clientName = selectedClient.client_name || '';

    // Parse name correctly: handles "LastName, FirstName MiddleName" format
    let last = '';
    let first = '';
    let mi = '';

    if (clientName.includes(',')) {
      // Format: "Ambray, Alberto Pelegrino"
      const [lastPart, restPart] = clientName.split(',').map((s: string) => s.trim());
      const restWords = restPart ? restPart.split(/\s+/) : [];
      last = lastPart || '';
      first = restWords[0] || '';
      mi = restWords.length > 1 ? restWords[restWords.length - 1].charAt(0) + '.' : '';
    } else {
      // Format: "Alberto Pelegrino Ambray"
      const words = clientName.trim().split(/\s+/);
      if (words.length === 1) {
        first = words[0];
      } else {
        last = words[words.length - 1];
        first = words[0];
        mi = words.length > 2 ? words[1].charAt(0) + '.' : '';
      }
    }

    setFormData(prev => ({
      ...prev,
      // Section A - General Info
      planholder_type: 'individual',
      plan_numbers: selectedClient.policy_number || prev.plan_numbers || '',
      planholder_last_name: last,
      planholder_first_name: first,
      planholder_mi: mi,
      planholder_printed_name: clientName,

      // Section B.1 - Pre-fill beneficiary 1 from client's beneficiary field
      beneficiary1_name: selectedClient.beneficiary || prev.beneficiary1_name || '',
      beneficiary1_phone: selectedClient.mobile_number || prev.beneficiary1_phone || '',
      beneficiary1_address: selectedClient.address || prev.beneficiary1_address || '',

      // Section D - Signatures
      place_of_signing: prev.place_of_signing || '',
      date_of_signing: prev.date_of_signing || new Date().toISOString().split('T')[0],
    }));
  };

  const handleViewModeChange = async (mode: 'form' | 'literal') => {
    setViewMode(mode);
    if (mode === 'literal') {
      setIsPreviewLoading(true);
      try {
        const pdfBytes = await generateBeneficiaryChangeRequestPdfFromTemplate(formData as any);
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
      } catch (e) {
        console.error(e);
      } finally {
        setIsPreviewLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Beneficiary Change Request</h1>
            <p className="text-xs text-slate-500">Standard Form View</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => handleViewModeChange('form')} 
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'form' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileEdit size={14} /> Form Entry
          </button>
          <button 
            onClick={() => handleViewModeChange('literal')} 
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${viewMode === 'literal' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Eye size={14} /> Literal Display
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onSaveDraft(formData)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button
            onClick={() => onExportPdf(formData)}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm"
          >
            {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Export PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {viewMode === 'form' ? (
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
          
          {/* Client Selection */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 border-b pb-2">Client Selection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Client *</label>
                <select
                  value={formData.client_id || clientId}
                  onChange={(e) => handleClientSelectLocal(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                >
                  <option value="">-- Select a Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.client_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Request Status</label>
                <select
                  value={formData.status || 'Pending'}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-amber-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Auto-Display Client Info Card */}
            {(() => {
              const sel = clients.find(c => c.id === (formData.client_id || clientId));
              if (!sel) return null;
              return (
                <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wider">Auto-Filled Client Data</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs">Full Name</span>
                      <p className="font-semibold text-slate-900">{sel.client_name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Policy Number</span>
                      <p className="font-semibold text-slate-900">{sel.policy_number || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Birthdate</span>
                      <p className="font-semibold text-slate-900">{sel.birthdate || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Mobile Number</span>
                      <p className="font-semibold text-slate-900">{sel.mobile_number || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Email</span>
                      <p className="font-semibold text-slate-900">{sel.email || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs">Beneficiary</span>
                      <p className="font-semibold text-slate-900">{sel.beneficiary || '—'}</p>
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-slate-500 text-xs">Address</span>
                      <p className="font-semibold text-slate-900">{sel.address || '—'}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Section A */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">A. General Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Plan Numbers</label>
                <input
                  type="text"
                  value={formData.plan_numbers || ''}
                  onChange={(e) => handleChange('plan_numbers', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Planholder Type</label>
                <select
                  value={formData.planholder_type || 'individual'}
                  onChange={(e) => handleChange('planholder_type', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                >
                  <option value="individual">Individual</option>
                  <option value="company">Company</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.planholder_last_name || ''}
                  onChange={(e) => handleChange('planholder_last_name', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.planholder_first_name || ''}
                  onChange={(e) => handleChange('planholder_first_name', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">M.I.</label>
                <input
                  type="text"
                  value={formData.planholder_mi || ''}
                  onChange={(e) => handleChange('planholder_mi', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
          </section>

          {/* Section B */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">B. Beneficiary Change Details</h2>
            
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Change Type</label>
              <div className="flex gap-4 flex-wrap">
                {[
                  { value: 'add', label: 'Add Beneficiary(-ies)' },
                  { value: 'remove', label: 'Remove Beneficiary(-ies)' },
                  { value: 'change', label: 'Change of Beneficiary Information' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="change_type"
                      checked={formData.change_type === opt.value}
                      onChange={() => handleChange('change_type', opt.value)}
                      className="accent-amber-500"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* B.1 Add Beneficiary #1 */}
            {(formData.change_type === 'add' || !formData.change_type) && (
              <>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-amber-700 mb-3">B.1 — Add Beneficiary #1</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">2. Name (Last, First, Middle) / Company or Business Name</label>
                      <input type="text" value={formData.beneficiary1_name || ''} onChange={(e) => handleChange('beneficiary1_name', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">3. Sex (at birth)</label>
                      <select value={formData.beneficiary1_sex || ''} onChange={(e) => handleChange('beneficiary1_sex', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">4. Birthdate</label>
                      <input type="date" value={formData.beneficiary1_birthdate || ''} onChange={(e) => handleChange('beneficiary1_birthdate', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">5. Country of Birth/Incorporation</label>
                      <input type="text" value={formData.beneficiary1_country_birth || ''} onChange={(e) => handleChange('beneficiary1_country_birth', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">6. Citizenship(s)/Nationality</label>
                      <input type="text" value={formData.beneficiary1_citizenships || ''} onChange={(e) => handleChange('beneficiary1_citizenships', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">7. Relationship to Planholder</label>
                      <select value={formData.beneficiary1_relationship || ''} onChange={(e) => handleChange('beneficiary1_relationship', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Employer">Employer</option>
                        <option value="Others">Others (specify below)</option>
                      </select>
                      {formData.beneficiary1_relationship === 'Others' && (
                        <input type="text" placeholder="Specify relationship" value={formData.beneficiary1_relationship_others || ''} onChange={(e) => handleChange('beneficiary1_relationship_others', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm mt-2" />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">8. Beneficiary Type</label>
                      <select value={formData.beneficiary1_type || ''} onChange={(e) => handleChange('beneficiary1_type', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Primary">Primary</option>
                        <option value="Contingent">Contingent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">9. Designation</label>
                      <select value={formData.beneficiary1_designation || ''} onChange={(e) => handleChange('beneficiary1_designation', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Revocable">Revocable</option>
                        <option value="Irrevocable">Irrevocable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">10. Home Phone/Mobile No.</label>
                      <input type="text" value={formData.beneficiary1_phone || ''} onChange={(e) => handleChange('beneficiary1_phone', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">11. Address</label>
                      <input type="text" value={formData.beneficiary1_address || ''} onChange={(e) => handleChange('beneficiary1_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                  </div>
                </div>

                {/* B.1 Add Beneficiary #2 */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-bold text-amber-700 mb-3">B.1 — Add Beneficiary #2</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">12. Name (Last, First, Middle) / Company or Business Name</label>
                      <input type="text" value={formData.beneficiary2_name || ''} onChange={(e) => handleChange('beneficiary2_name', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">13. Sex (at birth)</label>
                      <select value={formData.beneficiary2_sex || ''} onChange={(e) => handleChange('beneficiary2_sex', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">14. Birthdate</label>
                      <input type="date" value={formData.beneficiary2_birthdate || ''} onChange={(e) => handleChange('beneficiary2_birthdate', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">15. Country of Birth/Incorporation</label>
                      <input type="text" value={formData.beneficiary2_country_birth || ''} onChange={(e) => handleChange('beneficiary2_country_birth', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">16. Citizenship(s)/Nationality</label>
                      <input type="text" value={formData.beneficiary2_citizenships || ''} onChange={(e) => handleChange('beneficiary2_citizenships', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">17. Relationship to Planholder</label>
                      <select value={formData.beneficiary2_relationship || ''} onChange={(e) => handleChange('beneficiary2_relationship', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Employer">Employer</option>
                        <option value="Others">Others (specify below)</option>
                      </select>
                      {formData.beneficiary2_relationship === 'Others' && (
                        <input type="text" placeholder="Specify relationship" value={formData.beneficiary2_relationship_others || ''} onChange={(e) => handleChange('beneficiary2_relationship_others', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm mt-2" />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">18. Beneficiary Type</label>
                      <select value={formData.beneficiary2_type || ''} onChange={(e) => handleChange('beneficiary2_type', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Primary">Primary</option>
                        <option value="Contingent">Contingent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">19. Designation</label>
                      <select value={formData.beneficiary2_designation || ''} onChange={(e) => handleChange('beneficiary2_designation', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                        <option value="">— Select —</option>
                        <option value="Revocable">Revocable</option>
                        <option value="Irrevocable">Irrevocable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">20. Home Phone/Mobile No.</label>
                      <input type="text" value={formData.beneficiary2_phone || ''} onChange={(e) => handleChange('beneficiary2_phone', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">21. Address</label>
                      <input type="text" value={formData.beneficiary2_address || ''} onChange={(e) => handleChange('beneficiary2_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* B.2 Remove Beneficiaries */}
            {formData.change_type === 'remove' && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-amber-700 mb-3">B.2 — Remove Beneficiary(-ies)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">22. Name (Beneficiary to Remove #1)</label>
                    <input type="text" value={formData.remove_beneficiary1_name || ''} onChange={(e) => handleChange('remove_beneficiary1_name', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">23. Name (Beneficiary to Remove #2)</label>
                    <input type="text" value={formData.remove_beneficiary2_name || ''} onChange={(e) => handleChange('remove_beneficiary2_name', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* B.3 Change Beneficiary Information */}
            {formData.change_type === 'change' && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-amber-700 mb-3">B.3 — Change of Beneficiary Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">24. Original Beneficiary Name</label>
                    <input type="text" value={formData.change_original_name || ''} onChange={(e) => handleChange('change_original_name', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                        <input type="checkbox" checked={formData.check_name || false} onChange={(e) => handleChange('check_name', e.target.checked)} className="accent-amber-500" /> Name
                      </label>
                      {formData.check_name && <input type="text" placeholder="New Name" value={formData.change_new_name || ''} onChange={(e) => handleChange('change_new_name', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                        <input type="checkbox" checked={formData.check_phone || false} onChange={(e) => handleChange('check_phone', e.target.checked)} className="accent-amber-500" /> Phone
                      </label>
                      {formData.check_phone && <input type="text" placeholder="New Phone" value={formData.change_phone || ''} onChange={(e) => handleChange('change_phone', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                        <input type="checkbox" checked={formData.check_address || false} onChange={(e) => handleChange('check_address', e.target.checked)} className="accent-amber-500" /> Address
                      </label>
                      {formData.check_address && <input type="text" placeholder="New Address" value={formData.change_address || ''} onChange={(e) => handleChange('change_address', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm" />}
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1">
                        <input type="checkbox" checked={formData.check_relationship || false} onChange={(e) => handleChange('check_relationship', e.target.checked)} className="accent-amber-500" /> Relationship
                      </label>
                      {formData.check_relationship && (
                        <select value={formData.change_relationship || ''} onChange={(e) => handleChange('change_relationship', e.target.value)} className="w-full p-2.5 rounded-lg border border-slate-200 text-sm">
                          <option value="">— Select —</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Employer">Employer</option>
                          <option value="Others">Others</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </section>

          {/* Section D - Signatures */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">D. Signatures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Place of Signing</label>
                <input
                  type="text"
                  value={formData.place_of_signing || ''}
                  onChange={(e) => handleChange('place_of_signing', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Signing</label>
                <input
                  type="date"
                  value={formData.date_of_signing || ''}
                  onChange={(e) => handleChange('date_of_signing', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Planholder Printed Name</label>
                <input
                  type="text"
                  value={formData.planholder_printed_name || ''}
                  onChange={(e) => handleChange('planholder_printed_name', e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm"
                />
              </div>
            </div>
          </section>

        </div>
          </div>
        ) : (
          <div className="flex-1 h-full relative bg-slate-900 flex flex-col items-center justify-center p-4">
            {isPreviewLoading ? (
              <div className="flex flex-col items-center gap-3 text-white">
                <Loader2 size={32} className="animate-spin text-amber-500" />
                <p className="text-sm">Generating Literal Display...</p>
              </div>
            ) : pdfPreviewUrl ? (
              <iframe src={pdfPreviewUrl} className="w-full max-w-5xl h-full bg-white rounded-lg shadow-2xl" />
            ) : (
              <p className="text-white text-sm">Failed to load PDF preview.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
