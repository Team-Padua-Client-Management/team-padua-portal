import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Info
} from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export type CsrFormItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  sla: string;
  count: number;
  href: string;
  accent: string;
  tint: string;
};

interface RequestFormsAccordionProps {
  kpis: {
    acr: number;
    mngt: number;
    cpst: number;
    cpc: number;
    fst: number;
    ppu: number;
    [key: string]: number;
  };
}

export default function RequestFormsAccordion({ kpis }: RequestFormsAccordionProps) {
  const [isCardExpanded, setIsCardExpanded] = useState(true);
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);

  const forms: CsrFormItem[] = useMemo(() => [
    {
      id: 'ACR',
      name: 'Advisor Change Request',
      category: 'Transfers & Policy',
      description: 'Process client transfer or assignment to a new servicing financial advisor with auto-routing.',
      sla: '24-48 hrs turnaround',
      count: kpis.acr || 0,
      href: '/admin/acr',
      accent: '#4F46E5',
      tint: 'rgba(79, 70, 229, 0.12)'
    },
    {
      id: 'BCR',
      name: 'Beneficiary Change Request',
      category: 'Transfers & Policy',
      description: 'Update primary or contingent policy beneficiaries and trust distribution instructions.',
      sla: '24-48 hrs turnaround',
      count: kpis.bcr || 0,
      href: '/admin/bcr',
      accent: '#2563EB',
      tint: 'rgba(37, 99, 235, 0.12)'
    },
    {
      id: 'CPC',
      name: 'Client Policy Change',
      category: 'Transfers & Policy',
      description: 'Request policy owner profile updates, contact detail changes, or coverage options.',
      sla: '24 hrs turnaround',
      count: kpis.cpc || 0,
      href: '/admin/cpc',
      accent: '#0284C7',
      tint: 'rgba(2, 132, 199, 0.12)'
    },
    {
      id: 'CPST',
      name: 'Client Policy Status Tracking',
      category: 'Transfers & Policy',
      description: 'Track real-time policy lifecycle status, processing milestones, and servicing history.',
      sla: 'Real-time update',
      count: kpis.cpst || 0,
      href: '/admin/cpst',
      accent: '#0D9488',
      tint: 'rgba(13, 148, 136, 0.12)'
    },
    {
      id: 'FSR',
      name: 'Fund Switching Request',
      category: 'Funds & Investments',
      description: 'Reallocate or switch existing investment-linked policy fund balances and unit ratios.',
      sla: '1-2 business days',
      count: kpis.fst || 0,
      href: '/admin/fund-switching',
      accent: '#059669',
      tint: 'rgba(5, 150, 105, 0.12)'
    },
    {
      id: 'FWR',
      name: 'Fund Withdrawal Request',
      category: 'Funds & Investments',
      description: 'Process partial or full investment fund redemptions and payout bank account instructions.',
      sla: '2-3 business days',
      count: 0,
      href: '/admin/fund-withdrawal',
      accent: '#10B981',
      tint: 'rgba(16, 185, 129, 0.12)'
    },
    {
      id: 'FST',
      name: 'Fund Switching Tool',
      category: 'Funds & Investments',
      description: 'Calculate unit allocations and portfolio rebalancing projections before submission.',
      sla: 'Instant calculation',
      count: kpis.fst || 0,
      href: '/admin/fst',
      accent: '#14B8A6',
      tint: 'rgba(20, 184, 166, 0.12)'
    },
    {
      id: 'ACA',
      name: 'Auto Charge Arrangement',
      category: 'Billing & Reinstatement',
      description: 'Setup recurring credit/debit card automated premium payment authorization.',
      sla: 'Same-day verification',
      count: 0,
      href: '/admin/aca',
      accent: '#7C3AED',
      tint: 'rgba(124, 58, 237, 0.12)'
    },
    {
      id: 'MDA',
      name: 'Modification / Debit Arrangement',
      category: 'Billing & Reinstatement',
      description: 'Modify payment schedules, direct bank debit mandates, or premium payment frequencies.',
      sla: '24-48 hrs turnaround',
      count: kpis.mngt || 0,
      href: '/admin/mngt',
      accent: '#8B5CF6',
      tint: 'rgba(139, 92, 246, 0.12)'
    },
    {
      id: 'SRO',
      name: 'Reinstatement (SRO)',
      category: 'Billing & Reinstatement',
      description: 'Special Reinstatement Offer processing for lapsed policies under simplified guidelines.',
      sla: '24-48 hrs turnaround',
      count: 0,
      href: '/admin/reinstatement-sro',
      accent: '#D97706',
      tint: 'rgba(217, 119, 6, 0.12)'
    },
    {
      id: 'PDI',
      name: 'Reinstatement (PDI)',
      category: 'Billing & Reinstatement',
      description: 'Policy Declaration of Insurability medical reinstatement assessment for lapsed coverage.',
      sla: '48-72 hrs medical review',
      count: 0,
      href: '/admin/reinstatement-pdi',
      accent: '#EA580C',
      tint: 'rgba(234, 88, 12, 0.12)'
    },
    {
      id: 'PPU',
      name: 'Policy Premium Update',
      category: 'Billing & Reinstatement',
      description: 'Adjust policy premium amounts, payment terms, or top-up lump sum contributions.',
      sla: '24 hrs turnaround',
      count: kpis.ppu || 0,
      href: '/admin/ppu',
      accent: '#C9962E',
      tint: 'rgba(201, 150, 46, 0.12)'
    },
    {
      id: 'CSMV',
      name: 'Client Servicing Monitoring Verification',
      category: 'Compliance & Verification',
      description: 'Audit trail, identity verification & compliance monitoring portal for servicing requests.',
      sla: 'Audit compliant',
      count: 0,
      href: '/admin/csmv',
      accent: '#099268',
      tint: 'rgba(9, 146, 104, 0.12)'
    }
  ], [kpis]);

  const totalActiveRequests = useMemo(() => {
    return forms.reduce((sum, f) => sum + f.count, 0);
  }, [forms]);

  const toggleFormExpand = (formId: string) => {
    setExpandedFormId((prev) => (prev === formId ? null : formId));
  };

  return (
    <div className={`${styles.dashboardCard} ${styles.requestFormsCard} ${!isCardExpanded ? styles.requestFormsCardCollapsed : ''}`}>
      {/* Card Header Row */}
      <div className={styles.dashboardCardHeader}>
        <div className={styles.headerTitleWrapper}>
          <div className={styles.headerIconBadge}>
            <FileText size={16} strokeWidth={2.2} />
          </div>
          <div className={styles.dashboardCardTitle}>
            <h3>Client Servicing Request Forms</h3>
          </div>
        </div>

        <div className={styles.headerRightActions}>
          <span className={styles.formsCountPill} title="Total Active Servicing Requests">
            <Zap size={11} className={styles.sparkleIcon} />
            {totalActiveRequests} Active
          </span>

          <button
            type="button"
            className={styles.cardHeaderToggleBtn}
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            aria-label="Toggle request forms card"
            title={isCardExpanded ? "Collapse card container" : "Expand all request forms"}
          >
            {isCardExpanded ? (
              <ChevronUp size={15} strokeWidth={2} />
            ) : (
              <ChevronDown size={15} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Collapsed State Summary Bar */}
      {!isCardExpanded && (
        <div
          className={styles.collapsedSummaryBar}
          onClick={() => setIsCardExpanded(true)}
          title="Click to expand form tools"
        >
          <div className={styles.collapsedChip}>
            <span className={styles.collapsedDot} style={{ background: '#4F46E5' }} />
            Transfers ({forms.filter(f => f.category === 'Transfers & Policy').length})
          </div>
          <div className={styles.collapsedChip}>
            <span className={styles.collapsedDot} style={{ background: '#059669' }} />
            Funds ({forms.filter(f => f.category === 'Funds & Investments').length})
          </div>
          <div className={styles.collapsedChip}>
            <span className={styles.collapsedDot} style={{ background: '#8B5CF6' }} />
            Billing & Reinstatement ({forms.filter(f => f.category === 'Billing & Reinstatement').length})
          </div>
          <div className={styles.collapsedExpandHint}>
            <span>View All {forms.length} Forms</span>
            <ArrowUpRight size={13} />
          </div>
        </div>
      )}

      {/* Expanded State Body */}
      {isCardExpanded && (
        <div className={styles.dashboardCardBody}>
          {/* Form Rows List */}
          <div className={styles.flatFormsList}>
            {forms.map((form) => {
              const isExpanded = expandedFormId === form.id;

              return (
                <div
                  key={form.id}
                  className={`${styles.flatFormItem} ${isExpanded ? styles.flatFormItemExpanded : ''}`}
                  style={{ borderLeftColor: form.accent }}
                >
                  {/* Collapsed Row Header: Badge | Title | Count | Launch | Chevron */}
                  <div
                    className={styles.flatFormHeaderRow}
                    onClick={() => toggleFormExpand(form.id)}
                  >
                    <span
                      className={styles.flatFormBadge}
                      style={{ color: form.accent, background: form.tint }}
                    >
                      {form.id}
                    </span>

                    <span className={styles.flatFormName}>{form.name}</span>

                    <div className={styles.flatFormRight}>
                      <span
                        className={styles.flatFormCountPill}
                        title={`${form.count} pending requests`}
                      >
                        {form.count}
                      </span>

                      <Link
                        href={form.href}
                        className={styles.flatFormQuickLaunchBtn}
                        onClick={(e) => e.stopPropagation()}
                        title={`Launch ${form.name}`}
                      >
                        <span>Launch</span>
                        <ArrowUpRight size={12} />
                      </Link>

                      <ChevronDown
                        size={14}
                        className={`${styles.flatFormChevron} ${isExpanded ? styles.flatFormChevronOpen : ''}`}
                      />
                    </div>
                  </div>

                  {/* Expanded Detail Body */}
                  {isExpanded && (
                    <div className={styles.flatFormDropdownBody}>
                      <p className={styles.flatFormDescription}>{form.description}</p>

                      <div className={styles.flatFormMetaRow}>
                        <span className={styles.flatFormSlaBadge}>
                          <Zap size={11} style={{ color: form.accent }} />
                          {form.sla}
                        </span>

                        <span className={styles.flatFormStatusText}>
                          <CheckCircle2 size={11} style={{ color: 'var(--status-done)' }} />
                          Form Operational & Ready
                        </span>
                      </div>

                      <div className={styles.flatFormActionsRow}>
                        <span className={styles.flatFormSecuredNote}>
                          <ShieldCheck size={11} style={{ color: 'var(--accent-strong)' }} />
                          Auto-PDF & Compliance Stamped
                        </span>

                        <Link href={form.href} className={styles.flatFormOpenLink}>
                          <span>Open Dedicated Portal</span>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Humanized Tip */}
          <div className={styles.flatFormFooterTip}>
            <Info size={13} style={{ color: 'var(--accent-strong)', flexShrink: 0 }} />
            <span>
              All client servicing form submissions generate digitally stamped PDFs and automatically trigger tracking status updates in real-time.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
