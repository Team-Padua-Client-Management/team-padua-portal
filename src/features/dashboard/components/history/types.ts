import { CalendarActivityItem } from '../CalendarActivityCard';
import { KNOWN_CATEGORIES, PURPLE } from '../TaskList';

export type LogTabType = 'all' | 'servicing' | 'inquiries' | 'calendar';

export type CalendarActivityLog = CalendarActivityItem;

export interface CategoryMeta {
  badge: string;
  title: string;
  accent: string;
  tint: string;
}

export function formatDate(value?: string | null): string {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const CALENDAR_CATEGORY_METAS: Record<string, CategoryMeta> = {
  Meeting: {
    badge: 'MEET',
    title: 'Meeting',
    accent: '#3B82F6',
    tint: 'rgba(59, 130, 246, 0.10)',
  },
  'Client Meeting': {
    badge: 'CLIENT',
    title: 'Client Meeting',
    accent: '#0284C7',
    tint: 'rgba(2, 132, 199, 0.10)',
  },
  'Speaking Engagement': {
    badge: 'SPEAK',
    title: 'Speaking Engagement',
    accent: '#D97706',
    tint: 'rgba(217, 119, 6, 0.10)',
  },
  Training: {
    badge: 'TRAIN',
    title: 'Training',
    accent: '#8B5CF6',
    tint: 'rgba(139, 92, 246, 0.10)',
  },
  'Work Session': {
    badge: 'WORK',
    title: 'Work Session',
    accent: '#10B981',
    tint: 'rgba(16, 185, 129, 0.10)',
  },
  'Bonding Activity': {
    badge: 'BOND',
    title: 'Bonding Activity',
    accent: '#EC4899',
    tint: 'rgba(236, 72, 153, 0.10)',
  },
  'Client Servicing': {
    badge: 'SERV',
    title: 'Client Servicing',
    accent: '#059669',
    tint: 'rgba(5, 150, 105, 0.10)',
  },
  Others: {
    badge: 'OTHER',
    title: 'Other Activity',
    accent: '#64748B',
    tint: 'rgba(100, 116, 139, 0.10)',
  },
};

export function getCategoryMeta(category?: string | null): CategoryMeta {
  const raw = category || 'Others';
  if (raw === 'Client Inquiry' || raw === 'Inquiry') {
    return {
      badge: 'INQ',
      title: 'Client Inquiry Log',
      accent: '#0284C7',
      tint: 'rgba(2, 132, 199, 0.10)',
    };
  }

  // Check known servicing categories
  const known = KNOWN_CATEGORIES.find((c) => c.badge === raw || c.title === raw);
  if (known) {
    return {
      badge: known.badge,
      title: known.title,
      accent: known.accent,
      tint: known.tint,
    };
  }

  // Check calendar activity categories
  if (CALENDAR_CATEGORY_METAS[raw]) {
    return CALENDAR_CATEGORY_METAS[raw];
  }

  return {
    badge: raw.slice(0, 5).toUpperCase(),
    title: raw,
    accent: PURPLE,
    tint: 'rgba(109, 40, 217, 0.10)',
  };
}
