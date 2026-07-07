'use client';

/**
 * AnnouncementWidget.tsx
 *
 * Reusable card widget for listing announcements in Admin and User dashboards.
 * Manages modal detailed view triggers and tracks user acknowledgement status.
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, ChevronRight, User, Clock, Flag, 
  CheckCircle, AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import AnnouncementDetailsModal from './AnnouncementDetailsModal';
import styles from '@/styles/components/shared/AnnouncementWidget.module.css';

interface Announcement {
  id: string;
  title: string;
  subtitle?: string;
  content?: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  author: string;
  publishDate: string;
  isPinned: boolean;
  audience: string[];
  
  // Event properties
  event_date?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  event_type?: string;

  // Location properties
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;

  // Configuration settings
  visibility_type?: string;
  require_acknowledgement?: boolean;
}

interface AnnouncementWidgetProps {
  announcement: Announcement;
  onRefresh?: () => void;
}

/**
 * AnnouncementWidget
 *
 * Renders announcement card and toggles details modal view.
 */
export default function AnnouncementWidget({ announcement, onRefresh }: AnnouncementWidgetProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchAckStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: ack } = await supabase
        .from('announcement_acknowledgements')
        .select('id')
        .eq('announcement_id', announcement.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (ack) {
        setIsAcknowledged(true);
      }
    }
  };

  useEffect(() => {
    if (announcement.require_acknowledgement) {
      fetchAckStatus();
    }
  }, [announcement.id, announcement.require_acknowledgement]);

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'Urgent': return styles.priorityUrgent;
      case 'High': return styles.priorityHigh;
      case 'Low': return styles.priorityLow;
      default: return styles.priorityMedium;
    }
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.headerRow}>
          <div className={styles.badges}>
            <span className={styles.category}>{announcement.category}</span>
            <span className={`${styles.priority} ${getPriorityClass(announcement.priority)}`}>
              {announcement.priority}
            </span>
          </div>
          {announcement.isPinned && (
            <span className={styles.pinned} title="Pinned Announcement">
              📌
            </span>
          )}
        </div>

        <div className={styles.titleArea}>
          <h3 
            className={styles.title} 
            onClick={() => setIsDetailsOpen(true)}
          >
            {announcement.title}
          </h3>
          {announcement.subtitle && <p className={styles.subtitle}>{announcement.subtitle}</p>}
        </div>

        {/* Dynamic Event Box */}
        {announcement.event_date && (
          <div className={styles.eventBlock}>
            <Calendar size={11} style={{ color: '#F4C542' }} />
            <span>Event: {announcement.event_date} ({announcement.start_time || '—'})</span>
          </div>
        )}

        {/* Dynamic Location Box */}
        {announcement.location_name && (
          <div className={styles.locationBlock}>
            <MapPin size={11} style={{ color: '#ef4444' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {announcement.location_name}
            </span>
          </div>
        )}

        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <User size={10} />
            <span>{announcement.author}</span>
          </div>
          <div className={styles.metaItem}>
            <Clock size={10} />
            <span>{announcement.publishDate}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            type="button"
            onClick={() => setIsDetailsOpen(true)}
            className={styles.readMoreBtn}
          >
            Read details <ChevronRight size={12} />
          </button>

          {announcement.require_acknowledgement && currentUserId && (
            <div>
              {isAcknowledged ? (
                <span className={styles.ackDone}>✓ Acknowledged</span>
              ) : (
                <span className={styles.ackPending}>⚠ Acknowledgment Required</span>
              )}
            </div>
          )}
        </div>
      </div>

      {isDetailsOpen && (
        <AnnouncementDetailsModal 
          announcement={announcement}
          onClose={() => setIsDetailsOpen(false)}
          onAcknowledged={() => {
            setIsAcknowledged(true);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}
