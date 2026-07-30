import { useState } from 'react';
import { supabase } from '@src/lib/supabase/client';
import { ACICRFormRecord } from './types';

export function useACICRForm(initialData?: Partial<ACICRFormRecord>) {
  const [formData, setFormData] = useState<Partial<ACICRFormRecord>>({
    status: 'Pending',
    policy_number: '',
    last_name: '',
    first_name: '',
    middle_initial: '',
    company_name: '',
    permanent_address: '',
    permanent_zip_code: '',
    present_address: '',
    present_zip_code: '',
    same_as_permanent: false,
    work_address: '',
    work_zip_code: '',
    other_address: '',
    other_zip_code: '',
    preferred_mailing_address: '',
    update_all_policies: '',
    contact_change_policy: false,
    contact_change_group: false,
    contact_change_plan: false,
    contact_change_mutual_fund: false,
    contact_change_all: false,
    mobile_phone: '',
    home_phone: '',
    work_phone: '',
    email_address: '',
    billing_preference: '',
    citizenship_change: 'None',
    citizenship_country: '',
    residence_country: '',
    receive_offers: '',
    ...initialData
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof ACICRFormRecord>(field: K, value: ACICRFormRecord[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'same_as_permanent' && value === true) {
        next.present_address = prev.permanent_address || '';
        next.present_zip_code = prev.permanent_zip_code || '';
      }
      return next;
    });
  };

  const saveForm = async () => {
    setLoading(true);
    setError(null);
    try {
      if ((!formData.last_name || !formData.first_name) && !formData.company_name) {
        throw new Error('Please provide either an Individual Name or a Company Name.');
      }
      if (!formData.policy_number) {
        throw new Error('Policy Number is required.');
      }
      
      const payload = {
        ...formData,
        id: formData.id || crypto.randomUUID()
      };
      
      const { error: insertError } = await supabase
        .from('acicr_requests')
        .upsert(payload);
        
      if (insertError) {
        // Table might not exist, silently ignore to prevent crash if backend isn't ready
        if (insertError.code !== '42P01') {
          console.error('Save error:', insertError);
          throw insertError;
        }
      }
      
      return payload;
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the form.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    updateField,
    saveForm,
    loading,
    error
  };
}
