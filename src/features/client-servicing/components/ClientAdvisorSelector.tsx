'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@src/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { getAuthScope } from '@src/lib/authScope';

interface ClientAdvisorSelectorProps {
  selectedClient: string;
  onClientChange: (clientId: string, clientData?: any) => void;
}

export default function ClientAdvisorSelector({
  selectedClient,
  onClientChange,
}: ClientAdvisorSelectorProps) {
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>('');
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [isAdvisorsLoading, setIsAdvisorsLoading] = useState(true);
  const [isClientsLoading, setIsClientsLoading] = useState(false);
  const [isAdvisorLocked, setIsAdvisorLocked] = useState(false);

  // Load advisors on mount with auth scope
  useEffect(() => {
    async function loadAdvisorsAndInit() {
      setIsAdvisorsLoading(true);
      try {
        const scope = await getAuthScope();

        if (scope.isAdvisor) {
          const visible = scope.visibleAdvisors.map(a => ({ id: a.id, advisor_name: a.advisor_name }));
          setAdvisors(visible);
          if (visible.length > 0) {
            setSelectedAdvisor(visible[0].id);
          }
          setIsAdvisorLocked(true);
        } else if (scope.isBizdev) {
          const visible = scope.visibleAdvisors.map(a => ({ id: a.id, advisor_name: a.advisor_name }));
          setAdvisors(visible);
          if (visible.length > 0) {
            setSelectedAdvisor(visible[0].id);
          }
          setIsAdvisorLocked(false);
        } else if (scope.isAdmin) {
          const { data: adData } = await supabase
            .from('advisors')
            .select('id, advisor_name')
            .order('advisor_name');

          if (adData) {
            setAdvisors(adData);
          }
          setIsAdvisorLocked(false);
        } else {
          setAdvisors([]);
          setIsAdvisorLocked(true);
        }

        // If a client is already selected, verify and load advisor
        if (selectedClient) {
          let { data: cData } = await supabase
            .from('cgpt_clients')
            .select('advisor_id')
            .eq('id', selectedClient)
            .maybeSingle();

          if (!cData || !cData.advisor_id) {
            const fallback = await supabase
              .from('cpst_clients')
              .select('advisor_id')
              .eq('id', selectedClient)
              .maybeSingle();
            if (fallback.data) cData = fallback.data;
          }

          if (cData && cData.advisor_id) {
            setSelectedAdvisor(cData.advisor_id);
          }
        }
      } catch (err) {
        console.error('Error in ClientAdvisorSelector:', err);
      } finally {
        setIsAdvisorsLoading(false);
      }
    }
    loadAdvisorsAndInit();
  }, [selectedClient]);

  // Fetch clients whenever the selected advisor changes
  useEffect(() => {
    async function loadClients() {
      if (!selectedAdvisor) {
        setClients([]);
        return;
      }

      setIsClientsLoading(true);
      try {
        let { data } = await supabase
          .from('cgpt_clients')
          .select('id, client_name, policy_number, birthdate, mobile_number, email, address, beneficiary')
          .eq('advisor_id', selectedAdvisor)
          .order('client_name');

        if (!data || data.length === 0) {
          const fallback = await supabase
            .from('cpst_clients')
            .select('id, client_name, policy_number, birthdate, mobile_number, email, address, beneficiary')
            .eq('advisor_id', selectedAdvisor)
            .order('client_name');
          if (fallback.data) data = fallback.data;
        }

        if (data) {
          setClients(data);
        }
      } catch (err) {
        console.error('Error fetching clients for advisor:', err);
      } finally {
        setIsClientsLoading(false);
      }
    }
    loadClients();
  }, [selectedAdvisor]);

  const handleAdvisorSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (isAdvisorLocked) return;
    const val = e.target.value;
    setSelectedAdvisor(val);
    onClientChange('', null);
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const clientData = clients.find(c => c.id === val);
    onClientChange(val, clientData);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Select Advisor *</label>
        <div className="relative">
          <select
            value={selectedAdvisor}
            onChange={handleAdvisorSelect}
            disabled={isAdvisorsLoading || isAdvisorLocked}
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-slate-700 bg-slate-50 hover:bg-white disabled:opacity-60 appearance-none"
          >
            {!isAdvisorLocked && <option value="">-- Select Advisor --</option>}
            {advisors.map(a => (
              <option key={a.id} value={a.id}>{a.advisor_name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            {isAdvisorsLoading ? (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Select Client *</label>
        <div className="relative">
          <select
            value={selectedClient}
            onChange={handleClientSelect}
            disabled={!selectedAdvisor || isClientsLoading}
            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all font-medium text-slate-700 bg-slate-50 hover:bg-white disabled:opacity-60 appearance-none"
          >
            {!selectedAdvisor ? (
              <option value="">Please select an advisor first.</option>
            ) : isClientsLoading ? (
              <option value="">Loading advisor clients...</option>
            ) : clients.length === 0 ? (
              <option value="">No clients found for this advisor.</option>
            ) : (
              <>
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.client_name}</option>
                ))}
              </>
            )}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            {isClientsLoading ? (
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            )}
          </div>
        </div>
        {!selectedAdvisor && !isAdvisorLocked && (
          <p className="mt-2 text-xs text-amber-600 font-medium">Only clients assigned to the selected advisor will be shown.</p>
        )}
      </div>
    </div>
  );
}
