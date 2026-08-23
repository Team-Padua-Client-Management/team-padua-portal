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
  Info,
  Lock
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
  moduleKey: string;
};

export type UserPermissions = Record<string, { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean; export?: boolean }> | null;

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
  userRole?: string | null;
  userPermissions?: UserPermissions;
  variant?: 'accordion' | 'grid';
  defaultExpanded?: boolean;
}

function hasFormAccess(
  moduleKey: string,
  userRole: string | null | undefined,
  userPermissions: UserPermissions | undefined
): boolean {
  if (!userRole) return false;
  const normalizedRole = userRole.toLowerCase();
  if (normalizedRole === 'admin' || normalizedRole === 'advisor') return true;
  if (!userPermissions) return false;
  return userPermissions[moduleKey]?.view === true;
}

export default function RequestFormsAccordion({
  kpis,
  userRole,
  userPermissions,
  variant = 'accordion',
  defaultExpanded = false,
}: RequestFormsAccordionProps) {
  const [isCardExpanded, setIsCardExpanded] = useState(defaultExpanded);
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
      tint: 'rgba(79, 70, 229, 0.12)',
      moduleKey: 'acr'
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
      tint: 'rgba(37, 99, 235, 0.12)',
      moduleKey: 'bcr'
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
      tint: 'rgba(5, 150, 105, 0.12)',
      moduleKey: 'fst'
    },
    {
      id: 'FW',
      name: 'Fund Withdrawal Request',
      category: 'Funds & Investments',
      description: 'Process partial or full investment fund redemptions and payout bank account instructions.',
      sla: '2-3 business days',
      count: kpis.fw || kpis.fwr || 0,
      href: '/admin/fund-withdrawal',
      accent: '#10B981',
      tint: 'rgba(16, 185, 129, 0.12)',
      moduleKey: 'fw'
    },
    {
      id: 'ACA',
      name: 'Auto Credits Arrangement',
      category: 'Billing & Payment',
      description: 'Setup automated credit payout authorization and direct account distribution.',
      sla: 'Same-day verification',
      count: kpis.aca || 0,
      href: '/admin/aca',
      accent: '#7C3AED',
      tint: 'rgba(124, 58, 237, 0.12)',
      moduleKey: 'aca'
    },
    {
      id: 'ADA / MOA',
      name: 'Auto Debit Arrangement',
      category: 'Billing & Payment',
      description: 'Setup bank account automated debit authorization for recurring premium payments.',
      sla: 'Same-day verification',
      count: kpis.ada || 0,
      href: '/admin/ada',
      accent: '#8B5CF6',
      tint: 'rgba(139, 92, 246, 0.12)',
      moduleKey: 'ada'
    },
    {
      id: 'SRO',
      name: 'Reinstatement (SRO)',
      category: 'Billing & Reinstatement',
      description: 'Special Reinstatement Offer processing for lapsed policies under simplified guidelines.',
      sla: '24-48 hrs turnaround',
      count: kpis.sro || 0,
      href: '/admin/reinstatement-sro',
      accent: '#D97706',
      tint: 'rgba(217, 119, 6, 0.12)',
      moduleKey: 'sro'
    },
    {
      id: 'PPI',
      name: 'Reinstatement (PPI)',
      category: 'Billing & Reinstatement',
      description: 'Policy Payor Insurability / Personal Statement of Insurability medical reinstatement assessment.',
      sla: '48-72 hrs medical review',
      count: kpis.ppi || 0,
      href: '/admin/reinstatement-pdi',
      accent: '#EA580C',
      tint: 'rgba(234, 88, 12, 0.12)',
      moduleKey: 'pdi'
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
      tint: 'rgba(13, 148, 136, 0.12)',
      moduleKey: 'cpst'
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
      tint: 'rgba(9, 146, 104, 0.12)',
      moduleKey: 'csmv'
    },
    {
      id: 'ACICR',
      name: 'Address and Contact Information Change Request',
      category: 'Client Profile',
      description: 'Update client registered address, contact numbers, and email information.',
      sla: '24-48 hrs turnaround',
      count: kpis.acicr || 0,
      href: '/admin/acicr',
      accent: '#D946EF',
      tint: 'rgba(217, 70, 239, 0.12)',
      moduleKey: 'acicr'
    }
  ], [kpis]);

  const formsWithAccess = useMemo(() => {
    return forms.map(form => ({
      ...form,
      hasAccess: hasFormAccess(form.moduleKey, userRole, userPermissions)
    }));
  }, [forms, userRole, userPermissions]);

  const accessibleForms = useMemo(() => formsWithAccess.filter(f => f.hasAccess), [formsWithAccess]);

  const formCategories = useMemo(() => [
    { label: 'Transfers & Policy', color: '#4F46E5' },
    { label: 'Funds & Investments', color: '#059669' },
    { label: 'Billing & Payment', color: '#7C3AED' },
    { label: 'Billing & Reinstatement', color: '#D97706' },
    { label: 'Compliance & Verification', color: '#099268' },
    { label: 'Client Profile', color: '#D946EF' },
  ], []);

  const totalActiveRequests = useMemo(() => {
    return accessibleForms.reduce((sum, f) => sum + f.count, 0);
  }, [accessibleForms]);

  const toggleFormExpand = (formId: string) => {
    setExpandedFormId((prev) => (prev === formId ? null : formId));
  };

  if (variant === 'grid') {
    return (
      <div className={`${styles.dashboardCard} ${styles.requestFormsLaunchpadCard}`}>
        <div className={styles.dashboardCardHeader}>
          <div className={styles.headerTitleWrapper}>
            <div className={styles.headerIconBadge}>
              <FileText size={18} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight m-0 leading-tight">
                Client Servicing Requests
              </h3>
              <span className="text-xs font-semibold text-text-secondary">
                Primary Action Hub &bull; Direct Portals Launch
              </span>
            </div>
          </div>

          <div className={styles.headerRightActions}>
            <span className={styles.formsCountPill} title="Total Active Servicing Requests">
              <Zap size={12} className={styles.sparkleIcon} />
              {totalActiveRequests} Active
            </span>
          </div>
        </div>

        <div className={styles.dashboardCardBody} style={{ padding: '4px 0 0' }}>
          {accessibleForms.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIcon}>
                <Lock size={24} className="text-gray-400" />
              </div>
              <div className={styles.emptyStateTitle}>No Forms Available</div>
              <div className={styles.emptyStateDescription}>
                You do not have permission to access any Client Servicing forms.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {formsWithAccess.map((form) => {
                if (!form.hasAccess) {
                  return (
                    <div
                      key={form.id}
                      className="flex flex-col justify-between p-3.5 rounded-xl border border-border bg-surface/50 opacity-40"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-extrabold"
                          style={{ color: form.accent, background: form.tint }}
                        >
                          {form.id}
                        </span>
                        <Lock size={12} className="text-gray-400" />
                      </div>
                      <div className="text-xs font-bold text-text mb-1 truncate">{form.name}</div>
                      <div className="text-[10.5px] text-text-tertiary">Access Required</div>
                    </div>
                  );
                }

                return (
                  <div
                    key={form.id}
                    className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border bg-surface hover:bg-surface-2 hover:border-amber-500/50 hover:shadow-md transition-all duration-200"
                    style={{ borderLeft: `3.5px solid ${form.accent}` }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-black tracking-wide"
                          style={{ color: form.accent, background: form.tint }}
                        >
                          {form.id}
                        </span>
                        <span
                          className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            form.count > 0
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black'
                              : 'text-text-tertiary bg-surface-2'
                          }`}
                          title={`${form.count} active requests`}
                        >
                          {form.count} {form.count === 1 ? 'req' : 'reqs'}
                        </span>
                      </div>

                      <h4 className="text-[13px] font-bold text-text m-0 mb-1 leading-snug line-clamp-2" title={form.name}>
                        {form.name}
                      </h4>
                      <p className="text-[11px] text-text-secondary m-0 mb-3 line-clamp-2 leading-relaxed">
                        {form.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-text-tertiary flex items-center gap-1">
                        <Zap size={10} style={{ color: form.accent }} />
                        {form.sla.split(' ')[0]} SLA
                      </span>
                      <Link
                        href={form.href}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all shadow-xs"
                        title={`Launch ${form.name}`}
                      >
                        <span>Launch</span>
                        <ArrowUpRight size={11} strokeWidth={2.5} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.dashboardCard} ${styles.requestFormsCard} ${!isCardExpanded ? styles.requestFormsCardCollapsed : ''}`}>
      {/* Card Header Row */}
      <div className={styles.dashboardCardHeader}>
        <div className={styles.headerTitleWrapper}>
          <div className={styles.headerIconBadge}>
            <FileText size={16} strokeWidth={2.2} />
          </div>
          <div className={styles.dashboardCardTitle}>
            <h3>Client Servicing Request</h3>
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


      {/* Expanded State Body */}
      {isCardExpanded && (
        <div className={styles.dashboardCardBody}>
          {accessibleForms.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIcon}>
                <Lock size={24} className="text-gray-400" />
              </div>
              <div className={styles.emptyStateTitle}>No Forms Available</div>
              <div className={styles.emptyStateDescription}>
                You do not have permission to access any Client Servicing forms.
                Contact your administrator to request access.
              </div>
            </div>
          ) : (
            <>
              {/* Form Rows List */}
              <div className={`${styles.flatFormsList} space-y-1.5`}>
                {formsWithAccess.map((form) => {
                  const isExpanded = expandedFormId === form.id;

                  if (!form.hasAccess) {
                    return (
                      <div
                        key={form.id}
                        className={`${styles.flatFormItem} opacity-50`}
                        style={{ borderLeftColor: form.accent }}
                      >
                        <div className={styles.flatFormHeaderRow} style={{ cursor: 'default' }}>
                          <span
                            className={styles.flatFormBadge}
                            style={{ color: form.accent, background: form.tint }}
                          >
                            {form.id}
                          </span>

                          <span className={styles.flatFormName}>{form.name}</span>

                          <div className={styles.flatFormRight}>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                              <Lock size={9} />
                              Access Required
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

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
                            className={`${styles.flatFormCountPill} ${form.count > 0 ? styles.flatFormCountPillHasCount : ''}`}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
