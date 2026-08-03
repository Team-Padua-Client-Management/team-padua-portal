import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@src/lib/supabase/client";

export interface AdvisorRecord {
  id: string;
  advisorCode: string;
  advisorName: string;
  email: string;
}

export interface ClientRecord {
  id: string;
  advisor_id: string;
  client_name: string;
  policy_number?: string | null;
  birthdate?: string | null;
  relationship?: string | null;
  email?: string | null;
}

export function useAdvisorClients() {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorRecord | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);

  const [loadingAdvisors, setLoadingAdvisors] = useState(true);
  const [loadingClients, setLoadingClients] = useState(false);

  // Fetch all advisors on mount
  useEffect(() => {
    async function fetchAdvisors() {
      setLoadingAdvisors(true);
      try {
        const { data, error } = await supabase
          .from('advisors')
          .select('*')
          .order('advisor_name', { ascending: true });

        if (error) throw error;
        
        if (data) {
          setAdvisors(data.map(a => ({
            id: a.id,
            advisorCode: a.advisor_code || '',
            advisorName: a.advisor_name || '',
            email: a.email || ''
          })));
        }
      } catch (err) {
        console.error('Error fetching advisors:', err);
      } finally {
        setLoadingAdvisors(false);
      }
    }
    fetchAdvisors();
  }, []);

  // Fetch clients when selectedAdvisor changes
  useEffect(() => {
    async function fetchClients() {
      if (!selectedAdvisor) {
        setClients([]);
        setSelectedClient(null); // Reset selected client when advisor is cleared
        return;
      }

      setLoadingClients(true);
      try {
        const { data, error } = await supabase
          .from('cpst_clients')
          .select('*')
          .eq('advisor_id', selectedAdvisor.id)
          .order('client_name', { ascending: true });

        if (error) throw error;
        
        if (data) {
          setClients(data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, [selectedAdvisor]);

  const handleSelectAdvisor = useCallback((advisorId: string) => {
    const adv = advisors.find(a => a.id === advisorId) || null;
    setSelectedAdvisor(adv);
    setSelectedClient(null); // Reset client immediately
  }, [advisors]);

  const handleSelectClient = useCallback((clientId: string) => {
    const cli = clients.find(c => c.id === clientId) || null;
    setSelectedClient(cli);
  }, [clients]);

  return {
    advisors,
    clients,
    selectedAdvisor,
    selectedClient,
    loadingAdvisors,
    loadingClients,
    handleSelectAdvisor,
    handleSelectClient,
    setSelectedAdvisor,
    setSelectedClient,
  };
}
