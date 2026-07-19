import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase/client';

export interface ClientOption {
  id: string;
  client_name: string;
  policy_number: string | null;
  email: string | null;
  mobile_number: string | null;
}

export function useClientList() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('cpst_clients')
        .select('id, client_name, policy_number, email, mobile_number')
        .order('client_name', { ascending: true });
        
      if (err) throw err;
      setClients(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return { clients, loading, error, refetch: fetchClients };
}
