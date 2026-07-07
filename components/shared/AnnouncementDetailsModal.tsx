'use client';

/**
 * AnnouncementDetailsModal.tsx
 *
 * Detailed layout viewer for announcements. Handles maps rendering,
 * attachments listing, and submitting reader acknowledgements to Supabase.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, MapPin, Download, Check, Clock, Globe, Shield, 
  Map, ExternalLink, Paperclip, CheckCircle2 
} from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import styles from '@/styles/components/shared/AnnouncementDetailsModal.module.css';

interface AttachedFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
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

interface AnnouncementDetailsModalProps {
  announcement: Announcement;
  onClose: () => void;
  onAcknowledged?: () => void;
}

/**
 * AnnouncementDetailsModal
 *
 * Renders the modal showing detailed announcement data.
 */
export default function AnnouncementDetailsModal({ 
  announcement, 
  onClose,
  onAcknowledged
}: AnnouncementDetailsModalProps) {
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const init = async () => {
      // 1. Fetch current auth user to track acknowledgements
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Check if user has already acknowledged this announcement
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

      // 2. Fetch attachments from announcement_attachments table
      try {
        const { data, error } = await supabase
          .from('announcement_attachments')
          .select('*')
          .eq('announcement_id', announcement.id);

        if (!error && data) {
          setAttachments(data);
        }
      } catch (err) {
        console.error('Failed to load attachments:', err);
      } finally {
        setLoadingAttachments(false);
      }
    };

    init();
  }, [announcement.id]);

  // Log a view count increment inside database when modal opens
  useEffect(() => {
    const incrementViews = async () => {
      try {
        const { error } = await supabase.rpc('increment_announcement_views', { announcement_id: announcement.id });
        if (error) {
          // Fallback: regular update if rpc is not present
          const { data: current } = await supabase
            .from('announcements')
            .select('views')
            .eq('id', announcement.id)
            .maybeSingle();
          if (current) {
            await supabase
              .from('announcements')
              .update({ views: (current.views || 0) + 1 })
              .eq('id', announcement.id);
          }
        }
      } catch (err) {
        console.error('Failed to increment views via RPC:', err);
      }
    };
    incrementViews();
  }, [announcement.id]);

  // Render static Canvas representation of maps location
  useEffect(() => {
    if (!announcement.latitude || !announcement.longitude) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#374151';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(announcement.location_name || 'Mapped Location', canvas.width / 2, canvas.height / 2 + 15);
  }, [announcement.latitude, announcement.longitude, announcement.location_name]);

  const handleAcknowledge = async () => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('announcement_acknowledgements')
        .insert({
          announcement_id: announcement.id,
          user_id: currentUserId
        });

      if (!error) {
        setIsAcknowledged(true);
        if (onAcknowledged) onAcknowledged();
      } else {
        throw error;
      }
    } catch (err) {
      console.error('Failed to submit acknowledgement:', err);
      alert('Failed to submit acknowledgement.');
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'Urgent': return styles.priorityUrgent;
      case 'High': return styles.priorityHigh;
      case 'Low': return styles.priorityLow;
      default: return styles.priorityMedium;
    }
  };

  const getMapLink = () => {
    if (announcement.google_place_id) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(announcement.location_name || '')}&query_place_id=${announcement.google_place_id}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${announcement.latitude},${announcement.longitude}`;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={styles.closeBtn}>&times;</button>
        
        <div className={styles.modalBody}>
          <div className={styles.badgeRow}>
            <span className={styles.categoryBadge}>{announcement.category}</span>
            <span className={`${styles.priorityBadge} ${getPriorityClass(announcement.priority)}`}>
              {announcement.priority}
            </span>
            {announcement.isPinned && <span className={styles.pinnedBadge}>📌 Pinned</span>}
          </div>

          <div className={styles.titleArea}>
            <h2 className={styles.title}>{announcement.title}</h2>
            {announcement.subtitle && <p className={styles.subtitle}>{announcement.subtitle}</p>}
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Author</span>
              <span className={styles.metaValue}>{announcement.author}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Publish Date</span>
              <span className={styles.metaValue}>{announcement.publishDate}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Scope / Visibility</span>
              <span className={styles.metaValue}>
                <Globe size={10} style={{ marginRight: '2px', verticalAlign: 'middle' }} />
                {announcement.visibility_type || 'Public'}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Audience</span>
              <span className={styles.metaValue}>{announcement.audience?.join(', ') || 'All Members'}</span>
            </div>
          </div>

          {/* Event Schedule Display */}
          {announcement.event_date && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>📅 Event Schedule</div>
              <div className={styles.metaGrid} style={{ backgroundColor: 'rgba(244, 197, 66, 0.04)', borderColor: 'rgba(244, 197, 66, 0.15)' }}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Event Date & Type</span>
                  <span className={styles.metaValue}>
                    {announcement.event_date} ({announcement.event_type || 'Meeting'})
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Event Time ({announcement.timezone || 'PHT'})</span>
                  <span className={styles.metaValue}>
                    {announcement.start_time || '—'} - {announcement.end_time || '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionTitle}>Announcement Details</div>
            <div className={styles.contentBlock}>
              {announcement.content || 'No details specified.'}
            </div>
          </div>

          {/* Mapped Location Details */}
          {announcement.location_name && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>📍 Location Intelligence</div>
              <div className={styles.locationCard}>
                <div className={styles.locationHeader}>
                  <MapPin size={16} style={{ color: '#ef4444' }} />
                  <div>
                    <div className={styles.locationName}>{announcement.location_name}</div>
                    <div className={styles.locationAddress}>{announcement.location_address}</div>
                  </div>
                </div>
                {announcement.latitude && (
                  <div className={styles.mapPreview}>
                    <canvas ref={canvasRef} width={450} height={120} className={styles.mapPreviewCanvas} />
                  </div>
                )}
                <a 
                  href={getMapLink()} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.mapLinkBtn}
                >
                  <ExternalLink size={10} /> Open Google Maps
                </a>
              </div>
            </div>
          )}

          {/* Attachments Section */}
          {(!loadingAttachments && attachments.length > 0) && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>📎 Attachments ({attachments.length})</div>
              <div className={styles.attachmentList}>
                {attachments.map((file, idx) => (
                  <div key={idx} className={styles.attachmentItem}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Paperclip size={12} />
                      {file.file_name} <span style={{ fontSize: '0.55rem', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>({formatSize(file.file_size)})</span>
                    </span>
                    <a 
                      href={file.file_url} 
                      download 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.downloadLink}
                    >
                      <Download size={11} /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Acknowledgement Widget */}
          {announcement.require_acknowledgement && currentUserId && (
            <div className={styles.ackBox}>
              {!isAcknowledged ? (
                <>
                  <div className={styles.ackText}>Acknowledgment Required for this broadcast.</div>
                  <button onClick={handleAcknowledge} className={styles.ackBtn}>
                    <Check size={12} /> Acknowledge Receipt
                  </button>
                </>
              ) : (
                <div className={styles.ackCompleted}>
                  <CheckCircle2 size={14} /> You have acknowledged reading this announcement.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
