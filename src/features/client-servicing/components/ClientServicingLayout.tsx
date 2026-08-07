'use client';

import React from 'react';
import ClientAdvisorSelector from '@src/features/client-servicing/components/ClientAdvisorSelector';

interface ClientServicingLayoutProps {
  /** The content to render in the main area (form + PDF preview). */
  children: React.ReactNode;
  /** The currently selected client ID. */
  selectedClient: string;
  /** Callback when a client is selected via the sidebar. */
  onClientChange: (clientId: string, clientData?: any) => void;
}

/**
 * Centralized two-column layout for all Client Servicing forms.
 *
 * Provides a fixed-width left sidebar containing the `ClientAdvisorSelector`
 * and a flexible main content area for the form itself.
 *
 * Usage:
 * ```tsx
 * <ClientServicingLayout
 *   selectedClient={clientId}
 *   onClientChange={handleClientSelect}
 * >
 *   <FormContent />
 * </ClientServicingLayout>
 * ```
 *
 * The layout does NOT include the form header — each form retains its own
 * header with form-specific actions (back, title, view toggle, save/export).
 */
export default function ClientServicingLayout({
  children,
  selectedClient,
  onClientChange,
}: ClientServicingLayoutProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar — ClientAdvisorSelector */}
      <aside className="w-72 shrink-0 bg-white border-r border-slate-200 overflow-y-auto hidden md:block">
        <div className="p-6">
          <ClientAdvisorSelector
            selectedClient={selectedClient}
            onClientChange={onClientChange}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
