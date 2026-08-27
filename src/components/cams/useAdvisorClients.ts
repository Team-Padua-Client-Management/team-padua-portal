import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@src/lib/supabase/client";
import { getAuthScope } from "@src/lib/authScope";

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
  const [isAdvisorLocked, setIsAdvisorLocked] = useState(false);

  // Fetch advisors according to user role & auth scope
  useEffect(() => {
    async function fetchAdvisors() {
      setLoadingAdvisors(true);
      try {
        const scope = await getAuthScope();

        if (scope.isAdvisor) {
          // If Advisor: only their own advisor record
          const visible = scope.visibleAdvisors.map(a => ({
            id: a.id,
            advisorCode: a.advisor_code || '',
            advisorName: a.advisor_name || '',
            email: a.email || ''
          }));
          setAdvisors(visible);
          if (visible.length > 0) {
            setSelectedAdvisor(visible[0]);
          }
          setIsAdvisorLocked(true);
        } else if (scope.isBizdev) {
          // If Bizdev: only authorized advisors
          const visible = scope.visibleAdvisors.map(a => ({
            id: a.id,
            advisorCode: a.advisor_code || '',
            advisorName: a.advisor_name || '',
            email: a.email || ''
          }));
          setAdvisors(visible);
          if (visible.length > 0) {
            setSelectedAdvisor(visible[0]);
          }
          setIsAdvisorLocked(false);
        } else if (scope.isAdmin) {
          // If Admin: all advisors
          const { data, error } = await supabase
            .from('advisors')
            .select('*')
            .order('advisor_name', { ascending: true });

          if (error) throw error;
          
          if (data) {
            const mapped = data.map(a => ({
              id: a.id,
              advisorCode: a.advisor_code || '',
              advisorName: a.advisor_name || '',
              email: a.email || ''
            }));
            setAdvisors(mapped);
          }
          setIsAdvisorLocked(false);
        } else {
          // Member
          setAdvisors([]);
          setIsAdvisorLocked(true);
        }
      } catch (err) {
        console.error('Error fetching advisors in useAdvisorClients:', err);
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
        setSelectedClient(null);
        return;
      }

      setLoadingClients(true);
      try {
        let { data, error } = await supabase
          .from('cgpt_clients')
          .select('*')
          .eq('advisor_id', selectedAdvisor.id)
          .order('client_name', { ascending: true });

        if (error || !data || data.length === 0) {
          const fallback = await supabase
            .from('cpst_clients')
            .select('*')
            .eq('advisor_id', selectedAdvisor.id)
            .order('client_name', { ascending: true });
          if (fallback.data) {
            data = fallback.data;
          }
        }
        
        if (data) {
          setClients(data as ClientRecord[]);
        } else {
          setClients([]);
        }
      } catch (err) {
        console.error('Error fetching clients in useAdvisorClients:', err);
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, [selectedAdvisor]);

  const handleSelectAdvisor = useCallback((advisorId: string) => {
    if (isAdvisorLocked && selectedAdvisor && selectedAdvisor.id !== advisorId) {
      return; // Locked to self for Advisor role
    }
    const adv = advisors.find(a => a.id === advisorId) || null;
    setSelectedAdvisor(adv);
    setSelectedClient(null);
  }, [advisors, isAdvisorLocked, selectedAdvisor]);

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
    isAdvisorLocked,
    handleSelectAdvisor,
    handleSelectClient,
    setSelectedAdvisor,
    setSelectedClient,
  };
}
