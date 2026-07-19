import React from 'react';
import { useClientList } from '@/app/lib/hooks/useClientList';
import { Loader2 } from 'lucide-react';

interface ClientSelectorProps {
  value: string;
  onChange: (clientId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ClientSelector({ value, onChange, placeholder = "Select a client...", disabled }: ClientSelectorProps) {
  const { clients, loading, error } = useClientList();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 border border-border rounded-xl bg-card">
        <Loader2 className="animate-spin" size={14} /> Loading clients...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-500 border border-red-500/20 px-3 py-2 rounded-xl bg-red-500/5">
        Failed to load clients
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground disabled:opacity-50"
    >
      <option value="" disabled>{placeholder}</option>
      {clients.map(c => (
        <option key={c.id} value={c.id}>
          {c.client_name} {c.policy_number ? `(${c.policy_number})` : ''}
        </option>
      ))}
    </select>
  );
}
