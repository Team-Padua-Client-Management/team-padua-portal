import React, { useState, useEffect } from 'react';
import { supabase } from '@src/lib/supabase/client';
import { useACICRForm } from './hooks';
import { ACICRFormRecord } from './types';
import { Loader2, Save, X, User, FileText, CheckCircle2 } from 'lucide-react';

interface ACICRFormProps {
  initialData?: Partial<ACICRFormRecord>;
  onClose: () => void;
  onSuccess: (data: ACICRFormRecord) => void;
}

export default function ACICRForm({ initialData, onClose, onSuccess }: ACICRFormProps) {
  const { formData, updateField, saveForm, loading: saving, error: saveError } = useACICRForm(initialData);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { fetchScopedClients } = await import('@src/lib/authScope');
        const data = await fetchScopedClients('id, client_name, policy_number, birthdate');
        if (data) {
          setClients(data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId);
    if (client) {
      updateField('client_id', client.id);
      updateField('policy_number', client.policy_number || '');

      // Attempt to split client name to auto-fill
      const parts = (client.client_name || '').split(' ');
      if (parts.length > 1) {
        updateField('last_name', parts[parts.length - 1]);
        updateField('first_name', parts.slice(0, parts.length - 1).join(' '));
      } else {
        updateField('first_name', client.client_name || '');
      }
    } else {
      updateField('client_id', '');
      updateField('policy_number', '');
      updateField('first_name', '');
      updateField('last_name', '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await saveForm();
      onSuccess(result as ACICRFormRecord);
    } catch (err) {
      // Handled by hook
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";
  const sectionClass = "bg-card/50 border border-border p-5 rounded-2xl space-y-4";
  const sectionTitleClass = "text-[15px] font-extrabold text-slate-800 dark:text-white flex items-center gap-2 mb-4 border-b border-border pb-3";

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex items-center justify-between p-5 border-b border-border bg-card">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Address & Contact Information Change Request</h2>
          <p className="text-sm text-slate-500">Update client registered address, contact numbers, and email information.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface-2 rounded-full transition-colors">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <form id="acicr-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {saveError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              {saveError}
            </div>
          )}

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}><User size={16} className="text-primary" /> A. General Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelClass}>Select Client from CPST</label>
                <div className="relative">
                  <select
                    className={inputClass}
                    value={formData.client_id || ''}
                    onChange={handleClientChange}
                    disabled={loadingClients}
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.client_name} {c.policy_number ? `(${c.policy_number})` : ''}</option>
                    ))}
                  </select>
                  {loadingClients && <Loader2 size={14} className="absolute right-3 top-3.5 animate-spin text-slate-400" />}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Policy/Group Contract/Plan/Mutual Fund Account Number(s)</label>
                <input required type="text" className={inputClass} value={formData.policy_number || ''} onChange={e => updateField('policy_number', e.target.value)} placeholder="e.g. 12345678" />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>For Individual Policy Owner</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input type="text" className={inputClass} value={formData.last_name || ''} onChange={e => updateField('last_name', e.target.value)} placeholder="Last Name" />
                  <input type="text" className={inputClass} value={formData.first_name || ''} onChange={e => updateField('first_name', e.target.value)} placeholder="First Name" />
                  <input type="text" className={inputClass} value={formData.middle_initial || ''} onChange={e => updateField('middle_initial', e.target.value)} placeholder="M.I." />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>For Company/Business Policy Owner</label>
                <input type="text" className={inputClass} value={formData.company_name || ''} onChange={e => updateField('company_name', e.target.value)} placeholder="Company or Business Name" />
              </div>
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}><FileText size={16} className="text-primary" /> B. Address and Contact Information Details</h3>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-800 dark:text-white">Address Change to:</label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>2. Permanent Home Address</label>
                  <input type="text" className={inputClass} value={formData.permanent_address || ''} onChange={e => updateField('permanent_address', e.target.value)} placeholder="No., Street, Village, City, Province, Country" />
                </div>
                <div>
                  <label className={labelClass}>3. Zip Code</label>
                  <input type="text" className={inputClass} value={formData.permanent_zip_code || ''} onChange={e => updateField('permanent_zip_code', e.target.value)} placeholder="Zip Code" />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 mb-2">
                <input type="checkbox" id="sameAsPermanent" className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" checked={formData.same_as_permanent || false} onChange={e => updateField('same_as_permanent', e.target.checked)} />
                <label htmlFor="sameAsPermanent" className="text-sm font-medium text-slate-700 dark:text-slate-300">Same as Permanent Home Address</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>4. Present Home Address</label>
                  <input type="text" className={inputClass} value={formData.present_address || ''} onChange={e => updateField('present_address', e.target.value)} placeholder="Present Home Address" disabled={formData.same_as_permanent} />
                </div>
                <div>
                  <label className={labelClass}>5. Zip Code</label>
                  <input type="text" className={inputClass} value={formData.present_zip_code || ''} onChange={e => updateField('present_zip_code', e.target.value)} placeholder="Zip Code" disabled={formData.same_as_permanent} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>6. Work Address</label>
                  <input type="text" className={inputClass} value={formData.work_address || ''} onChange={e => updateField('work_address', e.target.value)} placeholder="Work Address" />
                </div>
                <div>
                  <label className={labelClass}>7. Zip Code</label>
                  <input type="text" className={inputClass} value={formData.work_zip_code || ''} onChange={e => updateField('work_zip_code', e.target.value)} placeholder="Zip Code" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className={labelClass}>8. Other Address</label>
                  <input type="text" className={inputClass} value={formData.other_address || ''} onChange={e => updateField('other_address', e.target.value)} placeholder="Other Address" />
                </div>
                <div>
                  <label className={labelClass}>9. Zip Code</label>
                  <input type="text" className={inputClass} value={formData.other_zip_code || ''} onChange={e => updateField('other_zip_code', e.target.value)} placeholder="Zip Code" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className={labelClass}>10. Preferred Mailing Address</label>
                  <div className="space-y-2">
                    {['Permanent Home Address', 'Present Home Address', 'Work Address', 'Other Address'].map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <input type="radio" id={`mail_${opt}`} name="mailing" className="w-4 h-4 border-slate-300 text-primary focus:ring-primary" checked={formData.preferred_mailing_address === opt} onChange={() => updateField('preferred_mailing_address', opt as any)} />
                        <label htmlFor={`mail_${opt}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>11. Update information on all existing policies/plans/accounts?</label>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <input type="radio" id="upd_yes" name="upd_all" className="w-4 h-4 border-slate-300 text-primary focus:ring-primary" checked={formData.update_all_policies === 'Yes'} onChange={() => updateField('update_all_policies', 'Yes')} />
                      <label htmlFor="upd_yes" className="text-sm font-medium text-slate-700 dark:text-slate-300">Yes</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="radio" id="upd_no" name="upd_all" className="w-4 h-4 border-slate-300 text-primary focus:ring-primary" checked={formData.update_all_policies === 'No'} onChange={() => updateField('update_all_policies', 'No')} />
                      <label htmlFor="upd_no" className="text-sm font-medium text-slate-700 dark:text-slate-300">No</label>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">(Considered NO if unanswered)</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <label className={labelClass}>Contact Information Change to:</label>
                <div className="flex flex-wrap gap-4 mb-4">
                  {[
                    { id: 'contact_change_policy', label: 'Policy' },
                    { id: 'contact_change_group', label: 'Group Contract' },
                    { id: 'contact_change_plan', label: 'Plan' },
                    { id: 'contact_change_mutual_fund', label: 'Mutual Fund Account' },
                    { id: 'contact_change_all', label: 'All' },
                  ].map(opt => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input type="checkbox" id={opt.id} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" checked={(formData as any)[opt.id] || false} onChange={e => updateField(opt.id as any, e.target.checked)} />
                      <label htmlFor={opt.id} className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</label>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>12. Mobile Phone* (country code, mobile no.)</label>
                    <input type="text" className={inputClass} value={formData.mobile_phone || ''} onChange={e => updateField('mobile_phone', e.target.value)} placeholder="+639123456789" />
                  </div>
                  <div>
                    <label className={labelClass}>13. Home Phone (country code, area code, tel. no.)</label>
                    <input type="text" className={inputClass} value={formData.home_phone || ''} onChange={e => updateField('home_phone', e.target.value)} placeholder="+63285558888" />
                  </div>
                  <div>
                    <label className={labelClass}>14. Work Phone (country code, area code, tel. no.)</label>
                    <input type="text" className={inputClass} value={formData.work_phone || ''} onChange={e => updateField('work_phone', e.target.value)} placeholder="+63285558888" />
                  </div>
                  <div>
                    <label className={labelClass}>15. Email Address**</label>
                    <input type="email" className={inputClass} value={formData.email_address || ''} onChange={e => updateField('email_address', e.target.value)} placeholder="Email Address" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <label className={labelClass}>16. Notifications and Deliveries for Life Insurance policy(-ies)</label>
                <div className="space-y-2">
                  {['SMS + Electronic Copy', 'SMS + Printed Copy', 'Printed Copy only'].map(opt => (
                    <div key={opt} className="flex items-center gap-2">
                      <input type="radio" id={`billing_${opt}`} name="billing" className="w-4 h-4 border-slate-300 text-primary focus:ring-primary" checked={formData.billing_preference === opt} onChange={() => updateField('billing_preference', opt as any)} />
                      <label htmlFor={`billing_${opt}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt}</label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">*If you select SMS, please fill out Mobile Phone. **If you select electronic copy, please fill out email address.</p>
              </div>

            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}><CheckCircle2 size={16} className="text-primary" /> C. Compliance with Regulatory Requirements</h3>
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-800 dark:text-white">17. Has there been any change in your citizenship(s)/nationality(-ies) or country of legal residence?</label>
              <div className="space-y-2">
                {[
                  { value: 'Resident', label: 'Yes, I am a citizen/national and a legal resident of (specify country).' },
                  { value: 'Non-Resident', label: 'Yes, I am a citizen/national of (specify country) but I legally reside in (specify country).' },
                  { value: 'None', label: 'None' }
                ].map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <input type="radio" id={`reg_${opt.value}`} name="regulatory" className="w-4 h-4 border-slate-300 text-primary focus:ring-primary" checked={formData.citizenship_change === opt.value} onChange={() => updateField('citizenship_change', opt.value as any)} />
                    <label htmlFor={`reg_${opt.value}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</label>
                  </div>
                ))}
              </div>

              {formData.citizenship_change === 'Resident' && (
                <div className="mt-4 p-4 bg-surface-2 rounded-xl border border-border">
                  <label className={labelClass}>Specify Country (Citizen & Resident)</label>
                  <input type="text" className={inputClass} value={formData.citizenship_country || ''} onChange={e => updateField('citizenship_country', e.target.value)} placeholder="Country" />
                </div>
              )}

              {formData.citizenship_change === 'Non-Resident' && (
                <div className="mt-4 p-4 bg-surface-2 rounded-xl border border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Specify Country (Citizen)</label>
                    <input type="text" className={inputClass} value={formData.citizenship_country || ''} onChange={e => updateField('citizenship_country', e.target.value)} placeholder="Citizen Country" />
                  </div>
                  <div>
                    <label className={labelClass}>Specify Country (Resident)</label>
                    <input type="text" className={inputClass} value={formData.residence_country || ''} onChange={e => updateField('residence_country', e.target.value)} placeholder="Resident Country" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={sectionClass}>
            <h3 className={sectionTitleClass}><CheckCircle2 size={16} className="text-primary" /> D. Signatures</h3>
            <div className="flex flex-col gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                28. Would you like to receive personalized communication and product offers from Sun Life of Canada (Philippines), Inc. (SLOCPI) and other members?
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="radio" id="consent_yes" name="consent" className="w-4 h-4 border-slate-300 text-primary focus:ring-primary" checked={formData.receive_offers === 'Yes'} onChange={() => updateField('receive_offers', 'Yes')} />
                  <label htmlFor="consent_yes" className="text-sm font-medium text-slate-700 dark:text-slate-300">Yes</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="radio" id="consent_no" name="consent" className="w-4 h-4 border-slate-300 text-primary focus:ring-primary" checked={formData.receive_offers === 'No'} onChange={() => updateField('receive_offers', 'No')} />
                  <label htmlFor="consent_no" className="text-sm font-medium text-slate-700 dark:text-slate-300">No</label>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>

      <div className="p-5 border-t border-border bg-card flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full font-semibold text-sm border border-border hover:bg-surface-2 transition-colors">
          Cancel
        </button>
        <button type="submit" form="acicr-form" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-primary/90 transition-all disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save ACICR Form'}
        </button>
      </div>
    </div>
  );
}
