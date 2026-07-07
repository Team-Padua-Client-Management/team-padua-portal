'use client';

/**
 * NotificationBell.tsx
 *
 * Realtime Notification Bell Component.
 * Fetches notifications directly from Supabase, updates instantly on postgres inserts,
 * and links clicks to open the Announcement details modal.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import AnnouncementDetailsModal from './AnnouncementDetailsModal';
import styles from '@/styles/components/shared/NotificationBell.module.css';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

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
  event_date?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  event_type?: string;
  location_name?: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  google_place_id?: string;
  visibility_type?: string;
  require_acknowledgement?: boolean;
}

/**
 * NotificationBell
 *
 * Renders interactive bell icon, unread counter, dropdown feed,
 * and handles detail view triggers.
 */
export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          description: n.description,
          type: n.type || 'info',
          is_read: n.is_read || false,
          created_at: n.created_at
        })));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Setup realtime subscription
    const channel = supabase
      .channel('realtime_notification_bell')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle clicking outside to close the dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    // 1. Mark as read
    if (!item.is_read) {
      await handleMarkAsRead(item.id);
    }
    setIsOpen(false);

    // 2. If it is an announcement type, let's load it from the database and open the details modal
    if (item.type === 'announcement' || item.title.toLowerCase().includes('announcement')) {
      try {
        // Strip out prefixes if any to find the match
        const searchTitle = item.title.replace(/^New Announcement:\s*/i, '').trim();
        
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('title', searchTitle)
          .maybeSingle();

        if (!error && data) {
          setSelectedAnnouncement({
            id: data.id,
            title: data.title,
            subtitle: data.subtitle,
            content: data.content,
            category: data.category,
            priority: data.priority,
            author: data.author,
            publishDate: data.publish_date ? new Date(data.publish_date).toISOString().split('T')[0] : '—',
            isPinned: data.is_pinned || false,
            audience: data.audience || [],
            event_date: data.event_date,
            start_time: data.start_time,
            end_time: data.end_time,
            timezone: data.timezone,
            event_type: data.event_type,
            location_name: data.location_name,
            location_address: data.location_address,
            latitude: data.latitude,
            longitude: data.longitude,
            google_place_id: data.google_place_id,
            visibility_type: data.visibility_type,
            require_acknowledgement: data.require_acknowledgement
          });
        } else {
          alert(`Could not open details. Announcement "${searchTitle}" may have been modified or deleted.`);
        }
      } catch (err) {
        console.error('Failed to link announcement details:', err);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div ref={dropdownRef} className={styles.bellContainer}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={styles.bellBtn}
        aria-label="Toggle notifications dropdown"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.title}>Notifications</span>
            {unreadCount > 0 && (
              <span className={styles.unreadCount}>{unreadCount} New</span>
            )}
          </div>

          <div className={styles.feedList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                🎉 No new updates found.
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleNotificationClick(item)}
                  className={`${styles.item} ${!item.is_read ? styles.unreadItem : ''}`}
                >
                  {!item.is_read && <span className={styles.unreadIndicator} />}
                  <div className={styles.itemTitle}>{item.title}</div>
                  <div className={styles.itemDesc}>{item.description}</div>
                  <div className={styles.itemFooter}>
                    <span>{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    {!item.is_read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                        className={styles.markReadBtn}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {selectedAnnouncement && (
        <AnnouncementDetailsModal 
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
        />
      )}
    </div>
  );
}
