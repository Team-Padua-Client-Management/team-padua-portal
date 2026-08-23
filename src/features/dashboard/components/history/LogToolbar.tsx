import React from 'react';
import { Search, Filter, Tag, X, ChevronDown } from 'lucide-react';
import { LogTabType, getCategoryMeta } from './types';

interface LogToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statuses: string[];
  selectedRole?: string;
  onRoleChange?: (role: string) => void;
  activeTab: LogTabType;
  totalFilteredCount: number;
  onResetFilters: () => void;
}

export default function LogToolbar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedStatus,
  onStatusChange,
  statuses,
  selectedRole,
  onRoleChange,
  activeTab,
  totalFilteredCount,
  onResetFilters,
}: LogToolbarProps) {
  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedCategory !== 'All' ||
    selectedStatus !== 'All' ||
    (selectedRole && selectedRole !== 'All');

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'servicing':
        return 'Search servicing requests by policy owner, number, insured...';
      case 'inquiries':
        return 'Search client inquiries by client name, concern, category...';
      case 'calendar':
        return 'Search calendar activities by title, location, role, notes...';
      default:
        return 'Search all logs by client, policy number, title, keywords...';
    }
  };

  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-slate-200/80 dark:border-border/80 shadow-xs p-2.5 sm:p-3 flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-all">
      {/* Search Input */}
      <div className="relative flex-1 flex items-center bg-slate-50 dark:bg-surface-2 rounded-lg border border-slate-200/70 dark:border-border/70 px-3.5 py-2 transition-all focus-within:border-[#E8A33D] focus-within:ring-2 focus-within:ring-[#E8A33D]/20">
        <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={getSearchPlaceholder()}
          className="w-full bg-transparent border-none outline-hidden text-[13.5px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 transition-colors"
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Dropdown Filters Container */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Categories Dropdown */}
        <div className="relative flex-1 sm:flex-none flex items-center bg-slate-50 dark:bg-surface-2 rounded-lg border border-slate-200/70 dark:border-border/70 px-3 py-2 transition-all hover:border-slate-300 dark:hover:border-border focus-within:border-[#E8A33D]">
          <Tag size={14} className="text-slate-500 dark:text-slate-400 shrink-0 mr-2" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="bg-transparent border-none outline-hidden text-[13px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer pr-6 appearance-none"
          >
            {categories.map((cat) => {
              const label = cat === 'All' ? 'All Categories' : getCategoryMeta(cat).title;
              return (
                <option key={cat} value={cat} className="bg-white dark:bg-surface text-slate-900 dark:text-white">
                  {label}
                </option>
              );
            })}
          </select>
          <ChevronDown size={13} className="text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Statuses Dropdown */}
        <div className="relative flex-1 sm:flex-none flex items-center bg-slate-50 dark:bg-surface-2 rounded-lg border border-slate-200/70 dark:border-border/70 px-3 py-2 transition-all hover:border-slate-300 dark:hover:border-border focus-within:border-[#E8A33D]">
          <Filter size={14} className="text-slate-500 dark:text-slate-400 shrink-0 mr-2" />
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="bg-transparent border-none outline-hidden text-[13px] font-semibold text-slate-700 dark:text-slate-200 cursor-pointer pr-6 appearance-none"
          >
            {statuses.map((st) => (
              <option key={st} value={st} className="bg-white dark:bg-surface text-slate-900 dark:text-white">
                {st === 'All' ? 'All Statuses' : st}
              </option>
            ))}
          </select>
          <ChevronDown size={13} className="text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#E8A33D] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer shrink-0"
          >
            <X size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}
