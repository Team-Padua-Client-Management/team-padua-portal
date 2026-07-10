import React from 'react';

export interface PortalListItem {
  slug: string;
  name: string;
  description: string;
  defaultUrl: string;
  brandColor: string;
  logo: (className?: string) => React.ReactNode;
}

export const portalsConfig: PortalListItem[] = [
  {
    slug: 'canva',
    name: 'Canva',
    description: 'Design kits, recruitment posters, templates, and training slide decks.',
    defaultUrl: 'https://www.canva.com/',
    brandColor: '#7D2AE8',
    logo: (className = "w-10 h-10") => (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="canva-grad-config" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C4CC" />
            <stop offset="50%" stopColor="#7D2AE8" />
            <stop offset="100%" stopColor="#FF4F9A" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="url(#canva-grad-config)" />
        <text x="50" y="56" fill="white" fontSize="16" fontWeight="bold" fontFamily="'Fredoka One', 'Comfortaa', 'Nunito', sans-serif" textAnchor="middle" letterSpacing="-0.5">Canva</text>
      </svg>
    )
  },
  {
    slug: 'google-drive',
    name: 'Google Drive',
    description: 'Shared team directories, logo assets, document storage, and templates.',
    defaultUrl: 'https://drive.google.com/drive/folders/1ZLNJHFUFYDkVG9pQwMF2hio89j7vp04x?usp=sharing',
    brandColor: '#34A853',
    logo: (className = "w-10 h-10") => (
      <img
        src="/Image/icon/drive.png"
        alt="Google Drive"
        className={`${className} object-contain`}
      />
    )
  },
  {
    slug: 'google-sheets',
    name: 'Google Sheets',
    description: 'Trackers, financial spreadsheets, calculations, and analytical tables.',
    defaultUrl: 'https://bit.ly/4f2fpLK',
    brandColor: '#1F9A55',
    logo: (className = "w-10 h-10") => (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="ex-bg-config" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F9A55" /><stop offset="100%" stopColor="#0B4C28" />
          </linearGradient>
          <linearGradient id="ex-plate-config" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#167C41" /><stop offset="100%" stopColor="#0D522A" />
          </linearGradient>
          <linearGradient id="ex-x-config" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#E0E0E0" />
          </linearGradient>
        </defs>
        <rect x="30" y="15" width="55" height="70" rx="14" fill="url(#ex-bg-config)" />
        <path d="M 44 15 L 85 56 L 85 15 Z" fill="rgba(255,255,255,0.08)" />
        <rect x="15" y="32" width="36" height="36" rx="8" fill="url(#ex-plate-config)" stroke="#1F9A55" strokeWidth="1" />
        <rect x="16" y="33" width="34" height="34" rx="7" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <path d="M24 41 L30 41 L33 50 L36 41 L42 41 L36 53 L42 65 L36 65 L33 56 L30 65 L24 65 L30 53 Z" fill="url(#ex-x-config)" />
      </svg>
    )
  },
  {
    slug: 'jotform',
    name: 'JotForm',
    description: 'Forms, intern portals, client registrations, and query submissions.',
    defaultUrl: 'https://www.jotform.com/',
    brandColor: '#FF6100',
    logo: (className = "w-10 h-10") => (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="jt-blue-config" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#66B7FF" /><stop offset="30%" stopColor="#0087FF" /><stop offset="100%" stopColor="#004C99" />
          </linearGradient>
          <linearGradient id="jt-orange-config" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF9455" /><stop offset="30%" stopColor="#FF6100" /><stop offset="100%" stopColor="#B23E00" />
          </linearGradient>
          <linearGradient id="jt-yellow-config" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFD366" /><stop offset="30%" stopColor="#FFB700" /><stop offset="100%" stopColor="#B27A00" />
          </linearGradient>
          <linearGradient id="jt-dark-config" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3275" /><stop offset="100%" stopColor="#061138" />
          </linearGradient>
        </defs>
        <path d="M 12 62 C 12 60, 14 59, 16 61 L 39 84 C 41 86, 40 88, 38 88 L 16 88 C 14 88, 12 86, 12 84 Z" fill="url(#jt-dark-config)" />
        <path d="M 52 13 C 58 19, 58 29, 52 35 L 34 53 C 28 59, 18 59, 12 53 C 6 47, 6 37, 12 31 L 30 13 C 36 7, 46 7, 52 13 Z" fill="url(#jt-blue-config)" />
        <path d="M 78 27 C 84 33, 84 43, 78 49 L 49 78 C 43 84, 33 84, 27 78 C 21 72, 21 62, 27 56 L 56 27 C 62 21, 72 21, 78 27 Z" fill="url(#jt-orange-config)" />
        <path d="M 83 53 C 89 59, 89 69, 83 75 L 69 89 C 63 95, 53 95, 47 89 C 41 83, 41 73, 47 67 L 61 53 C 67 47, 77 47, 83 53 Z" fill="url(#jt-yellow-config)" />
      </svg>
    )
  },
  {
    slug: 'microsoft-teams',
    name: 'Microsoft Teams',
    description: 'Internal communications, virtual meetings, channels, and team schedules.',
    defaultUrl: 'https://teams.microsoft.com/',
    brandColor: '#464EB8',
    logo: (className = "w-10 h-10") => (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="teams-bg-grad-config" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7B83EB" /><stop offset="100%" stopColor="#464EB8" />
          </linearGradient>
          <linearGradient id="teams-icon-grad-config" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5B64E2" /><stop offset="100%" stopColor="#3B429F" />
          </linearGradient>
        </defs>
        <rect x="25" y="20" width="55" height="55" rx="12" fill="url(#teams-bg-grad-config)" />
        <rect x="15" y="32" width="30" height="30" rx="8" fill="url(#teams-icon-grad-config)" />
        <text x="30" y="53" fill="white" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">T</text>
        <circle cx="60" cy="38" r="8" fill="white" />
        <path d="M48 58 C48 51, 54 48, 60 48 C66 48, 72 51, 72 58 Z" fill="white" />
      </svg>
    )
  },
  {
    slug: 'zoom',
    name: 'Zoom',
    description: 'Scheduled conferences, room IDs, guidelines, and webinar schedules.',
    defaultUrl: 'https://bit.ly/4wrEVBg',
    brandColor: '#2D8CFF',
    logo: (className = "w-10 h-10") => (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <linearGradient id="zoom-grad-config" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2D8CFF" />
            <stop offset="100%" stopColor="#0B5CFF" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="url(#zoom-grad-config)" />
        <path d="M 33 42 C 33 40, 35 38, 37 38 L 57 38 C 59 38, 61 40, 61 42 L 61 58 C 61 60, 59 62, 57 62 L 37 62 C 35 62, 33 60, 33 58 Z M 63 45 L 75 37 L 75 63 L 63 55 Z" fill="white" />
      </svg>
    )
  },
  {
    slug: 'task-tracker',
    name: 'Task Tracker',
    description: 'Internal Team Padua Task Tracker portal and dashboard.',
    defaultUrl: 'https://teampaduatracker.vercel.app/tasktracker',
    brandColor: '#E44D26',
    logo: (className = "w-10 h-10") => (
      <img
        src="/Image/icon/TP.png"
        alt="Task Tracker"
        className={`${className} object-contain`}
      />
    )
  },
  {
    slug: 'sun-life',
    name: 'Sun Life Portal',
    description: 'Primary customer service operations portal and tools.',
    defaultUrl: 'https://www.sunlife.com.ph/en/',
    brandColor: '#F4C542',
    logo: (className = "w-10 h-10") => (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <radialGradient id="sl-config-globe" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFECA0" />
            <stop offset="50%" stopColor="#F4C542" />
            <stop offset="90%" stopColor="#B28200" />
            <stop offset="100%" stopColor="#7C5B00" />
          </radialGradient>
          <linearGradient id="sl-config-ray" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="30%" stopColor="#F4C542" />
            <stop offset="70%" stopColor="#D89D00" />
            <stop offset="100%" stopColor="#966C00" />
          </linearGradient>
          <mask id="sl-config-mask">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </mask>
        </defs>
        <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#sl-config-ray)" />
        <circle cx="45" cy="56" r="31" fill="url(#sl-config-globe)" mask="url(#sl-config-mask)" />
      </svg>
    )
  },
  {
    slug: 'advisor-office',
    name: 'Advisor Office',
    description: 'Advisor administrative services, commission logs, and operational reports.',
    defaultUrl: 'https://advisorhomeoffice.sunlife.com.ph/aho/index.html#/:',
    brandColor: '#D89D00',
    logo: (className = "w-10 h-10") => (
      <svg viewBox="0 0 100 100" className={className}>
        <defs>
          <radialGradient id="sl-config-globe-2" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFECA0" /><stop offset="50%" stopColor="#F4C542" /><stop offset="90%" stopColor="#B28200" /><stop offset="100%" stopColor="#7C5B00" />
          </radialGradient>
          <linearGradient id="sl-config-ray-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B2" /><stop offset="30%" stopColor="#F4C542" /><stop offset="70%" stopColor="#D89D00" /><stop offset="100%" stopColor="#966C00" />
          </linearGradient>
          <mask id="sl-config-mask-2">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <path d="M 10 52 Q 45 38 80 52" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 12 68 Q 45 54 78 68" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 26 27 Q 44 55 26 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 43 23 Q 60 55 43 87" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 60 27 Q 73 55 60 83" stroke="black" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </mask>
        </defs>
        <path d="M 30 25 Q 31 15 34 13 Q 38 18 41 21 Q 43 11 47 9 Q 50 15 52 19 Q 57 10 61 9 Q 63 16 64 21 Q 70 13 75 13 Q 76 20 76 25 Q 83 19 87 20 Q 86 28 85 32 Q 93 29 96 32 Q 94 39 91 43 Q 99 42 101 46 Q 97 52 94 55 Q 101 56 101 61 Q 96 66 92 68 Q 98 71 96 77 Q 90 79 86 81 Q 90 85 87 91 Q 81 90 76 87 Q 78 95 73 98 Q 69 94 66 90 Q 66 97 60 99 Q 57 93 55 89" fill="url(#sl-config-ray-2)" />
        <circle cx="45" cy="56" r="31" fill="url(#sl-config-globe-2)" mask="url(#sl-config-mask-2)" />
      </svg>
    )
  }
];
