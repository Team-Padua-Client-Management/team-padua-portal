import React, { createContext, useContext, ReactNode } from 'react';
import { useAdvisorClients, AdvisorRecord, ClientRecord } from './useAdvisorClients';

interface AdvisorClientContextType {
  advisors: AdvisorRecord[];
  clients: ClientRecord[];
  selectedAdvisor: AdvisorRecord | null;
  selectedClient: ClientRecord | null;
  loadingAdvisors: boolean;
  loadingClients: boolean;
  handleSelectAdvisor: (advisorId: string) => void;
  handleSelectClient: (clientId: string) => void;
  setSelectedAdvisor: React.Dispatch<React.SetStateAction<AdvisorRecord | null>>;
  setSelectedClient: React.Dispatch<React.SetStateAction<ClientRecord | null>>;
}

const AdvisorClientContext = createContext<AdvisorClientContextType | undefined>(undefined);

export function AdvisorClientProvider({ children }: { children: ReactNode }) {
  const advisorClients = useAdvisorClients();

  return (
    <AdvisorClientContext.Provider value={advisorClients}>
      {children}
    </AdvisorClientContext.Provider>
  );
}

export function useAdvisorClientContext() {
  const context = useContext(AdvisorClientContext);
  if (context === undefined) {
    throw new Error('useAdvisorClientContext must be used within an AdvisorClientProvider');
  }
  return context;
}
