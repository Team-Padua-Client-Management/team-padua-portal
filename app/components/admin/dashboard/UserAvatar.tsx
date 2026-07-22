import React, { useState } from 'react';
import styles from '@/styles/admin/dashboard/page.module.css';

export type UserProfile = {
  id: string;
  full_name: string;
  email?: string;
  role: string;
  avatar_url: string | null;
};

interface UserAvatarProps {
  profile: UserProfile | null;
  size?: number;
  showTooltip?: boolean;
  tooltipPrefix?: string;
}

export const getInitials = (name?: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function UserAvatar({
  profile,
  size = 26,
  showTooltip = false,
  tooltipPrefix = ''
}: UserAvatarProps) {
  const [imgErr, setImgErr] = useState(false);

  if (!profile) {
    return (
      <div
        className={styles.userAvatarInitials}
        style={{ width: size, height: size, fontSize: Math.max(9, Math.floor(size * 0.38)) }}
        title="Unassigned"
      >
        —
      </div>
    );
  }

  const displayName = profile.full_name || profile.email || 'User';
  const tooltipText = tooltipPrefix ? `${tooltipPrefix}: ${displayName}` : displayName;
  const initials = getInitials(displayName);

  if (profile.avatar_url && !imgErr) {
    return (
      <img
        src={profile.avatar_url}
        alt={displayName}
        className={styles.userAvatarImg}
        style={{ width: size, height: size }}
        title={showTooltip ? tooltipText : undefined}
        onError={() => setImgErr(true)}
      />
    );
  }

  return (
    <div
      className={styles.userAvatarInitials}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.floor(size * 0.42)) }}
      title={showTooltip ? tooltipText : undefined}
    >
      {initials}
    </div>
  );
}
