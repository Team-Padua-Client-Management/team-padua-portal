'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Video, 
  Building2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  MapPin,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';
import { CalendarActivityItem } from './CalendarActivityCard';
import VenuePicker, { VenueData } from '@src/components/shared/VenuePicker';
import { useMeetingLinkParser } from '../hooks/useMeetingLinkParser';

const CATEGORY_OPTIONS = ['Meeting', 'Training', 'Work Session', 'Speaking Engagement', 'Bonding Activity', 'Client Servicing', 'Others'];
const ROLE_OPTIONS = ['Admin', 'Advisor', 'Bizdev'] as const;
const MODE_OPTIONS = ['Online', 'Onsite'] as const;

interface CalendarActivityModalProps {
  onSave: (activity: Omit<CalendarActivityItem, 'id' | 'createdAt'>, existingId?: string) => void;
  onClose: () => void;
  initialActivity?: Partial<CalendarActivityItem>;
}

export default function CalendarActivityModal({ 
  onSave, 
  onClose,
  initialActivity 
}: CalendarActivityModalProps) {
  const [title, setTitle] = useState(initialActivity?.title || '');
  const [date, setDate] = useState(initialActivity?.date || '');
  const [time, setTime] = useState(initialActivity?.time || '');
  const [mode, setMode] = useState<'Online' | 'Onsite'>(initialActivity?.mode || 'Online');
  const [category, setCategory] = useState(initialActivity?.category || CATEGORY_OPTIONS[0]);
  const [assignedRole, setAssignedRole] = useState<'Admin' | 'Advisor' | 'Bizdev'>(initialActivity?.assignedRole || 'Advisor');
  const [notes, setNotes] = useState(initialActivity?.notes || '');

  // Online details
  const [onlinePlatform, setOnlinePlatform] = useState(initialActivity?.onlinePlatform || '');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState(initialActivity?.onlineMeetingLink || '');
  const [onlineMeetingId, setOnlineMeetingId] = useState(initialActivity?.onlineMeetingId || '');
  const [onlinePasscode, setOnlinePasscode] = useState(initialActivity?.onlinePasscode || '');
  const [hasManuallyEditedDetails, setHasManuallyEditedDetails] = useState(false);

  // Onsite details (Google Places data)
  const [venueData, setVenueData] = useState<VenueData | null>(() => {
    if (initialActivity?.venue_name || initialActivity?.onsiteVenue) {
      return {
        venue_name: initialActivity.venue_name || initialActivity.onsiteVenue || '',
        venue_address: initialActivity.venue_address,
        venue_place_id: initialActivity.venue_place_id,
        venue_lat: initialActivity.venue_lat ?? initialActivity.latitude,
        venue_lng: initialActivity.venue_lng ?? initialActivity.longitude,
        venue_maps_url: initialActivity.venue_maps_url || initialActivity.googleMapsUrl,
      };
    }
    return null;
  });

  // Real-time Meeting Link parser
  const parsedMeeting = useMeetingLinkParser(onlineMeetingLink);

  // Auto-fill when URL parses into a known platform unless user has manually intervened
  useEffect(() => {
    if (parsedMeeting.isDetected && !hasManuallyEditedDetails) {
      if (parsedMeeting.platform) {
        setOnlinePlatform(parsedMeeting.platform);
      }
      if (parsedMeeting.meetingId) {
        setOnlineMeetingId(parsedMeeting.meetingId);
      }
      if (parsedMeeting.passcode) {
        setOnlinePasscode(parsedMeeting.passcode);
      }
    }
  }, [parsedMeeting, hasManuallyEditedDetails]);

  const handleLinkPasteOrBlur = () => {
    if (parsedMeeting.isDetected) {
      if (parsedMeeting.platform) setOnlinePlatform(parsedMeeting.platform);
      if (parsedMeeting.meetingId) setOnlineMeetingId(parsedMeeting.meetingId);
      if (parsedMeeting.passcode) setOnlinePasscode(parsedMeeting.passcode);
    }
  };

  const handleSave = () => {
    if (!title.trim() || !date) return;

    if (mode === 'Online') {
      const computedLocation = onlinePlatform.trim() || 'Online';
      onSave({
        title: title.trim(),
        date,
        time: time || undefined,
        mode: 'Online',
        location: computedLocation,
        category,
        assignedRole,
        notes: notes.trim() || undefined,
        onlinePlatform: onlinePlatform.trim() || (parsedMeeting.platform as string) || 'Online',
        onlineMeetingLink: onlineMeetingLink.trim(),
        meeting_link_raw: onlineMeetingLink.trim(),
        onlineMeetingId: onlineMeetingId.trim(),
        onlinePasscode: onlinePasscode.trim(),
      }, initialActivity?.id);
    } else {
      const venueName = venueData?.venue_name?.trim() || '';
      const computedLocation = venueName || venueData?.venue_address || 'Onsite';

      onSave({
        title: title.trim(),
        date,
        time: time || undefined,
        mode: 'Onsite',
        location: computedLocation,
        category,
        assignedRole,
        notes: notes.trim() || undefined,
        onsiteVenue: venueName,
        venue_name: venueName,
        venue_address: venueData?.venue_address?.trim(),
        venue_place_id: venueData?.venue_place_id,
        venue_lat: venueData?.venue_lat,
        venue_lng: venueData?.venue_lng,
        venue_maps_url: venueData?.venue_maps_url,
        googleMapsUrl: venueData?.venue_maps_url,
      }, initialActivity?.id);
    }
  };

  const isSaveDisabled = !title.trim() || !date || (!parsedMeeting.isValid && !!onlineMeetingLink.trim());
  const currentStatusColor = '#2563EB'; // Primary Blue

  return (
    <div className={styles.taskModalOverlay} onClick={onClose}>
      <div 
        className={styles.taskModalCard} 
        style={{ borderTop: `4px solid ${currentStatusColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.taskModalHeader}>
          <div className={styles.modalTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className={styles.modalTitleInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Log Calendar Activity..."
                autoFocus
                required
              />
            </div>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <X size={15} strokeWidth={2} />
          </button>
        </div>
        
        {/* Body Content */}
        <div className={styles.modalBodyContent}>
          {/* Mode Selector */}
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Activity Mode</label>
            <div className={styles.segmentedStatusRow}>
              {MODE_OPTIONS.map((st) => {
                const isActive = mode === st;
                return (
                  <button
                    key={st}
                    type="button"
                    className={`${styles.statusSegmentBtn} ${isActive ? styles.statusSegmentActive : ''}`}
                    style={isActive ? {
                      background: currentStatusColor,
                      color: '#FFFFFF',
                      borderColor: currentStatusColor,
                      boxShadow: `0 2px 8px ${currentStatusColor}55`
                    } : undefined}
                    onClick={() => setMode(st)}
                  >
                    {st === 'Online' ? <Video size={12} className="mr-1 inline-block" /> : <Building2 size={12} className="mr-1 inline-block" />}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Date & Time */}
          <div className={styles.modalTwoCol}>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Date *</label>
              <input
                type="date"
                className={styles.formInput}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Time (Optional)</label>
              <input
                type="time"
                className={styles.formInput}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Category & Assigned Role */}
          <div className={styles.modalTwoCol}>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Category</label>
              <select
                className={styles.formSelect}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formFieldLabel}>Assigned Role</label>
              <select
                className={styles.formSelect}
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value as 'Admin' | 'Advisor' | 'Bizdev')}
              >
                {ROLE_OPTIONS.map((role) => (<option key={role} value={role}>{role}</option>))}
              </select>
            </div>
          </div>
            
          {/* MODE: ONLINE (With Smart Zoom / Meeting Link Autofill) */}
          {mode === 'Online' ? (
            <div className={styles.modalSection}>
              <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl p-4 flex flex-col gap-3.5">
                
                {/* Meeting Link Input */}
                <div className={styles.formField}>
                  <div className="flex items-center justify-between mb-1">
                    <label className={styles.formFieldLabel}>Meeting Link</label>
                    {parsedMeeting.isDetected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 animate-in fade-in">
                        <Sparkles size={10} /> Auto-detected {parsedMeeting.platform}
                      </span>
                    )}
                  </div>
                  
                  <input
                    type="url"
                    className={`${styles.formInput} ${!parsedMeeting.isValid ? 'border-rose-400 ring-2 ring-rose-500/10' : ''}`}
                    value={onlineMeetingLink}
                    onChange={(e) => {
                      setOnlineMeetingLink(e.target.value);
                      setHasManuallyEditedDetails(false);
                    }}
                    onBlur={handleLinkPasteOrBlur}
                    onPaste={handleLinkPasteOrBlur}
                    placeholder="e.g. https://zoom.us/j/1234567890?pwd=... or meet.google.com/xxx-xxxx-xxx"
                  />

                  {!parsedMeeting.isValid && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {parsedMeeting.error}
                    </p>
                  )}

                  {parsedMeeting.note && (
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 size={11} /> {parsedMeeting.note}
                    </p>
                  )}
                </div>

                {/* Platform, Meeting ID, and Passcode */}
                <div className={styles.modalTwoCol}>
                  <div className={styles.formField}>
                    <div className="flex items-center justify-between">
                      <label className={styles.formFieldLabel}>Platform</label>
                      {parsedMeeting.isDetected && parsedMeeting.platform && (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Detected</span>
                      )}
                    </div>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onlinePlatform}
                      onChange={(e) => {
                        setOnlinePlatform(e.target.value);
                        setHasManuallyEditedDetails(true);
                      }}
                      placeholder="e.g. Zoom, Google Meet, MS Teams"
                    />
                  </div>

                  {!parsedMeeting.isGoogleMeet && (
                    <div className={styles.formField}>
                      <div className="flex items-center justify-between">
                        <label className={styles.formFieldLabel}>Meeting ID</label>
                        {parsedMeeting.meetingId && (
                          <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Extracted</span>
                        )}
                      </div>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={onlineMeetingId}
                        onChange={(e) => {
                          setOnlineMeetingId(e.target.value);
                          setHasManuallyEditedDetails(true);
                        }}
                        placeholder="e.g. 123 4567 8901"
                      />
                    </div>
                  )}
                </div>

                {!parsedMeeting.isGoogleMeet && (
                  <div className={styles.formField}>
                    <div className="flex items-center justify-between">
                      <label className={styles.formFieldLabel}>Passcode (Optional)</label>
                      {parsedMeeting.passcode && (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">Extracted</span>
                      )}
                    </div>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onlinePasscode}
                      onChange={(e) => {
                        setOnlinePasscode(e.target.value);
                        setHasManuallyEditedDetails(true);
                      }}
                      placeholder="e.g. 123456"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* MODE: ONSITE (Google Places Autocomplete Venue Picker) */
            <div className={styles.modalSection}>
              <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className={styles.formFieldLabel}>
                    Venue / Location
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <MapPin size={10} className="text-emerald-500" /> Links to OpenStreetMap
                  </span>
                </div>

                {/* Google Places Autocomplete Venue Picker */}
                <VenuePicker
                  value={venueData || undefined}
                  onChange={(selectedVenue) => setVenueData(selectedVenue)}
                  placeholder="Search venue or landmark (e.g. SM Megamall, Ayala Triangle)..."
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Notes / Agenda</label>
            <textarea
              className={styles.appleNotesTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type additional details or meeting agenda..."
              rows={3}
            />
          </div>
        </div>
        
        {/* Footer */}
        <div className={styles.modalFooter}>
          <div /> {/* Spacer */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className={styles.ghostCancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button 
              type="button" 
              className={styles.goldSaveBtn} 
              onClick={handleSave}
              disabled={isSaveDisabled}
              style={{ 
                background: currentStatusColor,
                opacity: isSaveDisabled ? 0.5 : 1, 
                cursor: isSaveDisabled ? 'not-allowed' : 'pointer' 
              }}
            >
              Save Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
