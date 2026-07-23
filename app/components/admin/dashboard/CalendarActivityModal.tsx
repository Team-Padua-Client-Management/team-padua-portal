import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Video, Building2 } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';
import { CalendarActivityItem } from './CalendarActivityCard';
import { PHILIPPINE_LOCATIONS } from '@/app/lib/constants/philippineLocations';

const CATEGORY_OPTIONS = ['Client Meeting', 'Training', 'Internal', 'Site Visit', 'Others'];
const ROLE_OPTIONS = ['Admin', 'Advisor', 'Bizdev'] as const;
const MODE_OPTIONS = ['Online', 'Onsite'] as const;

interface CalendarActivityModalProps {
  onSave: (activity: Omit<CalendarActivityItem, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export default function CalendarActivityModal({ onSave, onClose }: CalendarActivityModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState<'Online' | 'Onsite'>('Online');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [assignedRole, setAssignedRole] = useState<'Admin' | 'Advisor' | 'Bizdev'>('Advisor');
  const [notes, setNotes] = useState('');

  // Online details
  const [onlinePlatform, setOnlinePlatform] = useState('');
  const [onlineMeetingLink, setOnlineMeetingLink] = useState('');
  const [onlineMeetingId, setOnlineMeetingId] = useState('');
  const [onlinePasscode, setOnlinePasscode] = useState('');

  // Onsite details
  const [onsiteVenue, setOnsiteVenue] = useState('');
  const [onsiteBuilding, setOnsiteBuilding] = useState('');
  const [onsiteStreet, setOnsiteStreet] = useState('');
  const [onsiteBarangay, setOnsiteBarangay] = useState('');
  const [onsiteCity, setOnsiteCity] = useState('');
  const [onsiteProvince, setOnsiteProvince] = useState('');
  const [onsiteZip, setOnsiteZip] = useState('');

  const selectedProvinceData = PHILIPPINE_LOCATIONS.find(p => p.province === onsiteProvince);
  const availableCities = selectedProvinceData ? selectedProvinceData.cities : [];

  const handleSave = () => {
    if (!title.trim() || !date) return;
    
    const computedLocation = mode === 'Online'
      ? onlinePlatform
      : [onsiteVenue, onsiteBuilding, onsiteStreet, onsiteCity].filter(Boolean).join(', ');

    onSave({
      title: title.trim(),
      date,
      time: time || undefined,
      mode,
      location: computedLocation || location.trim(),
      onlinePlatform: onlinePlatform.trim(),
      onlineMeetingLink: onlineMeetingLink.trim(),
      onlineMeetingId: onlineMeetingId.trim(),
      onlinePasscode: onlinePasscode.trim(),
      onsiteVenue: onsiteVenue.trim(),
      onsiteBuilding: onsiteBuilding.trim(),
      onsiteStreet: onsiteStreet.trim(),
      onsiteBarangay: onsiteBarangay.trim(),
      onsiteCity: onsiteCity.trim(),
      onsiteProvince: onsiteProvince.trim(),
      onsiteZip: onsiteZip.trim(),
      category,
      assignedRole,
      notes: notes.trim() || undefined,
    });
  };

  // Calendar modal uses a neutral/blue accent since it has no specific status
  const currentStatusColor = '#2563EB'; // Blue

  return (
    <div className={styles.taskModalOverlay} onClick={onClose}>
      <div 
        className={styles.taskModalCard} 
        style={{ borderTop: `4px solid ${currentStatusColor}` }}
        onClick={(e) => e.stopPropagation()}
      >
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
        
        <div className={styles.modalBodyContent}>
          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Mode</label>
            <div className={styles.segmentedStatusRow}>
              {MODE_OPTIONS.map((st) => {
                const isActive = mode === st;
                const colorHex = '#2563EB'; // Unified blue

                return (
                  <button
                    key={st}
                    type="button"
                    className={`${styles.statusSegmentBtn} ${isActive ? styles.statusSegmentActive : ''}`}
                    style={isActive ? {
                      background: colorHex,
                      color: '#FFFFFF',
                      borderColor: colorHex,
                      boxShadow: `0 2px 8px ${colorHex}55`
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
                onChange={(e) => setAssignedRole(e.target.value as any)}
              >
                {ROLE_OPTIONS.map((role) => (<option key={role} value={role}>{role}</option>))}
              </select>
            </div>
          </div>
            
          {mode === 'Online' ? (
            <div className={styles.modalSection}>
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 flex flex-col gap-3">
                <div className={styles.modalTwoCol}>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Platform</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onlinePlatform}
                      onChange={(e) => setOnlinePlatform(e.target.value)}
                      placeholder="e.g. Zoom, Google Meet"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Meeting Link</label>
                    <input
                      type="url"
                      className={styles.formInput}
                      value={onlineMeetingLink}
                      onChange={(e) => setOnlineMeetingLink(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                </div>
                <div className={styles.modalTwoCol}>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Meeting ID</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onlineMeetingId}
                      onChange={(e) => setOnlineMeetingId(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Passcode</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onlinePasscode}
                      onChange={(e) => setOnlinePasscode(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.modalSection}>
              <div className="bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-lg p-4 flex flex-col gap-3">
                <div className={styles.modalTwoCol}>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Province</label>
                    <select
                      className={styles.formSelect}
                      value={onsiteProvince}
                      onChange={(e) => {
                        setOnsiteProvince(e.target.value);
                        setOnsiteCity(''); // reset city when province changes
                      }}
                    >
                      <option value="" disabled>Select Province</option>
                      {PHILIPPINE_LOCATIONS.map(loc => (
                        <option key={loc.province} value={loc.province}>{loc.province}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>City / Municipality</label>
                    <select
                      className={styles.formSelect}
                      value={onsiteCity}
                      onChange={(e) => setOnsiteCity(e.target.value)}
                      disabled={!onsiteProvince}
                    >
                      <option value="" disabled>
                        {!onsiteProvince ? 'Select Province first' : 'Select City / Municipality'}
                      </option>
                      {availableCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.modalTwoCol}>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Barangay</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onsiteBarangay}
                      onChange={(e) => setOnsiteBarangay(e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Street Address</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onsiteStreet}
                      onChange={(e) => setOnsiteStreet(e.target.value)}
                      placeholder=""
                    />
                  </div>
                </div>
                <div className={styles.modalTwoCol}>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Building</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onsiteBuilding}
                      onChange={(e) => setOnsiteBuilding(e.target.value)}
                      placeholder="e.g. 5th Avenue"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>Venue Name</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onsiteVenue}
                      onChange={(e) => setOnsiteVenue(e.target.value)}
                      placeholder="e.g. Sun Life Center"
                    />
                  </div>
                </div>
                <div className={styles.modalTwoCol}>
                  <div className={styles.formField}>
                    <label className={styles.formFieldLabel}>ZIP Code</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={onsiteZip}
                      onChange={(e) => setOnsiteZip(e.target.value)}
                      placeholder=""
                    />
                  </div>
                  <div></div>
                </div>
              </div>
            </div>
          )}

          <div className={styles.modalSection}>
            <label className={styles.formFieldLabel}>Notes</label>
            <textarea
              className={styles.appleNotesTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Type additional details..."
              rows={3}
            />
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <div /> {/* Spacer */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className={styles.ghostCancelBtn} onClick={onClose}>Cancel</button>
            <button 
              type="button" 
              className={styles.goldSaveBtn} 
              onClick={handleSave}
              disabled={!title.trim() || !date}
              style={{ 
                background: currentStatusColor,
                opacity: (!title.trim() || !date) ? 0.5 : 1, 
                cursor: (!title.trim() || !date) ? 'not-allowed' : 'pointer' 
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
