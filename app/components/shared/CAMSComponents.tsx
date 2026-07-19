'use client';

import React from 'react';
import { Plus, Trash2, FileSpreadsheet, Upload, Search, AlertCircle, X, LucideIcon } from 'lucide-react';
import ExportDropdown from './ExportDropdown';

// 1. CAMS Page Header Component
interface CAMSPageHeaderProps {
  title: string;
  subtitle: string;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  primaryActionIcon?: React.ReactNode;
  selectedIdsCount?: number;
  onBulkDelete?: () => void;
  bulkDeleteLabel?: string;
}

export function CAMSPageHeader({
  title,
  subtitle,
  primaryActionLabel,
  onPrimaryAction,
  primaryActionIcon = <Plus size={14} />,
  selectedIdsCount = 0,
  onBulkDelete,
  bulkDeleteLabel = 'Purge Selected'
}: CAMSPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/50 pb-5">
      <div>
        <h1 className="text-xl font-serif font-semibold text-text">{title}</h1>
        <p className="text-[10px] text-text-secondary uppercase font-semibold tracking-wider mt-0.5">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {selectedIdsCount > 0 && onBulkDelete && (
          <button
            onClick={onBulkDelete}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs transition duration-150 shadow-2xs cursor-pointer"
          >
            <Trash2 size={13} />
            {bulkDeleteLabel} ({selectedIdsCount})
          </button>
        )}
        {primaryActionLabel && onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="flex items-center gap-2 bg-gradient-to-r from-[#F4C542] to-[#e6b800] hover:from-[#e6b800] hover:to-[#c59d28] text-black font-bold px-5 py-3 rounded-xl text-xs transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[#F4C542]/20 cursor-pointer border border-[#F4C542]/30"
          >
            {primaryActionIcon}
            {primaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// 2. CAMS Stats Cards Component
interface StatCardData {
  label: string;
  count: number;
  link: string;
  color: string;
  icon: LucideIcon;
  isYellowBorder?: boolean;
}

interface CAMSStatsCardsProps {
  stats: StatCardData[];
}

export function CAMSStatsCards({ stats }: CAMSStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className={`bg-card border p-5 rounded-xl shadow-xs flex flex-col justify-between hover:border-[#F4C542]/50 transition duration-200 hover:shadow-md ${
              stat.isYellowBorder ? 'border-[#F4C542]/40 ring-1 ring-[#F4C542]/10' : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start text-[9px] font-bold text-text-secondary tracking-wider uppercase">
              <span>{stat.label}</span>
              <Icon size={12} className="text-text-secondary" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-3">
              <span className="text-xl font-bold font-serif text-text">{stat.count}</span>
              <span className={`text-[10px] text-text-secondary uppercase font-semibold tracking-wider mt-0.5 ${stat.color}`}>{stat.link}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 3. CAMS Import Panel Component
interface CAMSImportPanelProps {
  title: string;
  description: string;
  onUploadClick: () => void;
}

export function CAMSImportPanel({ title, description, onUploadClick }: CAMSImportPanelProps) {
  return (
    <div className="bg-card border border-border/50 p-5 rounded-xl shadow-xs flex flex-col justify-between hover:border-[#F4C542]/50 transition duration-200 hover:shadow-md h-full">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet size={15} className="text-[#A97800] dark:text-[#F4C542]" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{title}</h3>
        </div>
        <p className="text-xs text-text-secondary leading-normal">
          {description}
        </p>
      </div>
      <button
        onClick={onUploadClick}
        className="mt-4 flex items-center justify-center gap-2 border border-border/50 bg-card hover:bg-surface-2/60 text-text font-semibold px-4 py-2.5 rounded-xl text-xs transition duration-155 cursor-pointer w-full"
      >
        <Upload size={14} />
        Upload Files
      </button>
    </div>
  );
}

// 4. CAMS Filter Bar Component
interface CAMSFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  children?: React.ReactNode;
}

export function CAMSFilterBar({
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  children
}: CAMSFilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-3 bg-card border border-border/50 p-4 rounded-xl shadow-2xs w-full">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-card border border-border/50 rounded-full h-11 pl-10 pr-4 text-sm text-text transition duration-150 focus:outline-none focus:border-[#F4C542] focus:ring-2 focus:ring-[#F4C542]/10"
        />
      </div>
      {children && (
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}

// 5. CAMS Table Component
interface CAMSTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function CAMSTable({ headers, children }: CAMSTableProps) {
  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-2xs w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap text-sm">
          <thead>
            <tr className="bg-surface-2 border-b border-border/50 font-semibold text-text-secondary uppercase text-[10px] tracking-wider">
              {headers.map((header, idx) => (
                <th key={idx} className="py-3 px-4 font-bold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 6. CAMS Empty State Component
interface CAMSEmptyStateProps {
  message?: string;
  colSpan: number;
}

export function CAMSEmptyState({ message = 'No records found matching the search criteria.', colSpan }: CAMSEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-text-secondary text-sm">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="text-muted" size={24} />
          <span>{message}</span>
        </div>
      </td>
    </tr>
  );
}

// 7. CAMS Modal Component
interface CAMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function CAMSModal({ isOpen, onClose, title, subtitle, footerActions, children }: CAMSModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md h-full rounded-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2 shrink-0">
          <div>
            <h2 className="text-base font-bold text-text">{title}</h2>
            {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-muted hover:text-text hover:bg-slate-200 rounded-xl transition">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {children}
        </div>
        
        {footerActions && (
          <div className="flex gap-3 p-6 border-t border-border bg-card shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
}

// 8. CAMS Form Component
interface CAMSFormProps {
  id?: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
}

export function CAMSForm({ id, onSubmit, children }: CAMSFormProps) {
  return (
    <form id={id} onSubmit={onSubmit} className="space-y-4 text-left">
      {children}
    </form>
  );
}

// 9. CAMS Export Dropdown Component
export { ExportDropdown as CAMSExportDropdown };
