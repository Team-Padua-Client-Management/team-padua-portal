import React from 'react';
import { useAdvisorClientContext } from './AdvisorClientProvider';
import { Loader2 } from 'lucide-react';

export function AdvisorSelector() {
  const { advisors, selectedAdvisor, handleSelectAdvisor, loadingAdvisors } = useAdvisorClientContext();

  if (loadingAdvisors) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 border border-border rounded-xl bg-card">
        <Loader2 className="animate-spin" size={14} /> Loading advisors...
      </div>
    );
  }

  return (
    <select
      value={selectedAdvisor?.id || ''}
      onChange={(e) => handleSelectAdvisor(e.target.value)}
      className="w-full max-w-xs px-3 py-2 border border-border rounded-xl text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-card text-foreground"
    >
      <option value="" disabled>Select an advisor...</option>
      {advisors.map(adv => (
        <option key={adv.id} value={adv.id}>
          {adv.advisorName}
        </option>
      ))}
    </select>
  );
}
