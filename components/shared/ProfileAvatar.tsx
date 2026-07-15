'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

export default function ProfileAvatar({
  avatarUrl,
  name = 'User',
  size = 40,
  className = '',
}: ProfileAvatarProps) {
  const url = avatarUrl;
  const fallbackUrl = '/images/default-avatar.png';
  const [imgSrc, setImgSrc] = useState<string>(fallbackUrl);

  useEffect(() => {
    if (url) {
      setImgSrc(url);
    } else {
      setImgSrc(fallbackUrl);
    }
  }, [url]);

  return (
    <div 
      className={`relative rounded-full overflow-hidden flex items-center justify-center shrink-0 ${className} ring-2 ring-primary/20 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10`}
      style={{
        width: size,
        height: size,
      }}
    >
      <div className="absolute inset-0 bg-linear-to-br from-black/0 to-black/5 dark:from-white/0 dark:to-white/5 pointer-events-none z-10" />
      <Image
        src={imgSrc}
        alt={name || 'Avatar'}
        fill
        className="object-cover"
        onError={() => {
          if (imgSrc !== fallbackUrl) {
            setImgSrc(fallbackUrl);
          }
        }}
        unoptimized
      />
    </div>
  );
}
