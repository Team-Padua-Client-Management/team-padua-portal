import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import UserAvatar, { UserProfile } from './UserAvatar';
import styles from '@/styles/admin/dashboard/page.module.css';

interface UserPickerSelectProps {
  label: string;
  value: string | null;
  profiles: UserProfile[];
  onChange: (val: string | null) => void;
}

export default function UserPickerSelect({
  label,
  value,
  profiles,
  onChange,
}: UserPickerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedProfile = profiles.find((p) => p.id === value);
  const filteredProfiles = profiles.filter((p) =>
    (p.full_name || p.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.role || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.userPickerContainer}>
      <label className={styles.formFieldLabel}>{label}</label>
      <button
        type="button"
        className={styles.userPickerTrigger}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedProfile ? (
          <div className={styles.userPickerBadge}>
            <UserAvatar profile={selectedProfile} size={20} />
            <span className={styles.userPickerName}>{selectedProfile.full_name || selectedProfile.email}</span>
          </div>
        ) : (
          <span className={styles.userPickerPlaceholder}>Unassigned</span>
        )}
        <ChevronDown size={14} className={styles.userPickerChevron} />
      </button>

      {isOpen && (
        <div className={styles.userPickerDropdown}>
          <div className={styles.userPickerSearchRow}>
            <Search size={13} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className={styles.userPickerSearchInput}
              placeholder="Search people..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.userPickerList}>
            <div
              className={`${styles.userPickerOption} ${!value ? styles.userPickerOptionSelected : ''}`}
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
            >
              <UserAvatar profile={null} size={24} />
              <div className={styles.userInfoCol}>
                <span className={styles.userName}>Unassigned</span>
                <span className={styles.userRole}>None</span>
              </div>
            </div>
            {filteredProfiles.map((p) => (
              <div
                key={p.id}
                className={`${styles.userPickerOption} ${value === p.id ? styles.userPickerOptionSelected : ''}`}
                onClick={() => {
                  onChange(p.id);
                  setIsOpen(false);
                }}
              >
                <UserAvatar profile={p} size={24} />
                <div className={styles.userInfoCol}>
                  <span className={styles.userName}>{p.full_name || p.email}</span>
                  <span className={styles.userRole}>{p.role || 'Member'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
