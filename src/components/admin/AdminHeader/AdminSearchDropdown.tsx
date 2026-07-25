'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, FileText, Calendar, CheckSquare, Loader2, ArrowRight } from 'lucide-react';
import { GroupedSearchResults, SearchResultItem } from '@src/lib/search/useAdminSearch';
import styles from '@/styles/components/admin/AdminHeader/page.module.css';

interface AdminSearchDropdownProps {
  isOpen: boolean;
  query: string;
  isLoading: boolean;
  groupedResults: GroupedSearchResults;
  hasResults: boolean;
  onClose: () => void;
  onSelectResult?: () => void;
}

export default function AdminSearchDropdown({
  isOpen,
  query,
  isLoading,
  groupedResults,
  hasResults,
  onClose,
  onSelectResult,
}: AdminSearchDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !query.trim()) {
    return null;
  }

  const handleItemClick = (item: SearchResultItem) => {
    onClose();
    if (onSelectResult) onSelectResult();
    router.push(item.href);
  };

  const renderSection = (
    title: string,
    items: SearchResultItem[],
    IconComponent: React.ElementType
  ) => {
    if (items.length === 0) return null;

    return (
      <div className={styles.searchDropdownSection}>
        <div className={styles.searchSectionHeader}>
          <IconComponent size={13} className={styles.searchSectionIcon} />
          <span>{title}</span>
          <span className={styles.searchSectionBadge}>{items.length}</span>
        </div>
        <div className={styles.searchSectionList}>
          {items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              type="button"
              className={styles.searchResultItem}
              onClick={() => handleItemClick(item)}
            >
              <div className={styles.searchResultMain}>
                <span className={styles.searchResultLabel}>{item.label}</span>
                <span className={styles.searchResultSubtitle}>{item.subtitle}</span>
              </div>
              <ArrowRight size={13} className={styles.searchResultArrow} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div ref={dropdownRef} className={styles.searchDropdownMenu}>
      {isLoading ? (
        <div className={styles.searchDropdownLoading}>
          <Loader2 size={18} className="animate-spin text-primary" />
          <span>Searching database...</span>
        </div>
      ) : !hasResults ? (
        <div className={styles.searchDropdownEmpty}>
          <p className={styles.emptyTitle}>No results found</p>
          <p className={styles.emptySubtitle}>No records match &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className={styles.searchDropdownContent}>
          {renderSection('CPST Clients', groupedResults.clients, User)}
          {renderSection('Client Servicing Requests', groupedResults.requests, FileText)}
          {renderSection('Calendar & Activities', groupedResults.activities, Calendar)}
          {renderSection('Tasks & To-Dos', groupedResults.tasks, CheckSquare)}
          {renderSection('Other Items', groupedResults.others, FileText)}
        </div>
      )}
    </div>
  );
}
