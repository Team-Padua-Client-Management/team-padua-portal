'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

const getGradientForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-purple-600',
  ];
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function ProfileAvatar({
  avatarUrl,
  name = 'User',
  size = 40,
  className = '',
}: ProfileAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'US';

  const hasAvatar = avatarUrl && !imgError;

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 ${className} ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10`}
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="absolute inset-0 bg-linear-to-br from-black/0 to-black/5 dark:from-white/0 dark:to-white/5 pointer-events-none z-10" />
      {hasAvatar ? (
        <Image
          src={avatarUrl}
          alt={name || 'Avatar'}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <div 
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getGradientForName(name)} text-white font-bold tracking-wider`}
          style={{ fontSize: size * 0.38 }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
