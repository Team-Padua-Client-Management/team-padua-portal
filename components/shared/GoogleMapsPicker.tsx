'use client';

/**
 * GoogleMapsPicker.tsx
 *
 * Provides a location intelligence management module with autocomplete,
 * coordinates display, and place presets.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';
import styles from '@/styles/components/shared/GoogleMapsPicker.module.css';

interface LocationData {
  location_name: string;
  location_address: string;
  latitude: number;
  longitude: number;
  google_place_id: string;
}

interface GoogleMapsPickerProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
}

const locationPresets = [
  {
    name: 'World Trade Center Manila',
    address: 'Sen. Gil J. Puyat Ave, Pasay, Metro Manila',
    lat: 14.5538,
    lng: 120.9834,
    placeId: 'ChIJV-T_g_HNHBrr93'
  },
  {
    name: 'Padua Head Office',
    address: 'Rizal Avenue, Manila, Metro Manila',
    lat: 14.5995,
    lng: 120.9842,
    placeId: 'ChIJz2x3w-LLmzkR'
  },
  {
    name: 'SM Mall of Asia',
    address: 'Jose Diokno Blvd, Pasay, Metro Manila',
    lat: 14.5351,
    lng: 120.9822,
    placeId: 'ChIJU1uFz-LNmzkR'
  }
];

/**
 * GoogleMapsPicker
 *
 * Renders interactive location picker interface.
 */
export default function GoogleMapsPicker({ value, onChange }: GoogleMapsPickerProps) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<typeof locationPresets>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render a premium mock map grid on canvas to show coordinates relative to Manila area
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map background grid
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw mock geographical labels
    ctx.fillStyle = '#9ca3af';
    ctx.font = '8px sans-serif';
    ctx.fillText('Manila Bay', 20, 180);
    ctx.fillText('EDSA Avenue', 180, 80);
    ctx.fillText('Roxas Blvd', 60, 110);

    // Draw a star/circle representing coordinates
    const scaleX = (value.longitude - 120.90) * 1000;
    const scaleY = (14.65 - value.latitude) * 1000;

    ctx.beginPath();
    ctx.arc(scaleX, scaleY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [value.latitude, value.longitude]);

  // Click on mock map translates to coordinates updates
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Translate coordinate values back relative to Manila scale
    const newLng = Math.round((120.90 + x / 1000) * 10000) / 10000;
    const newLat = Math.round((14.65 - y / 1000) * 10000) / 10000;

    onChange({
      ...value,
      latitude: newLat,
      longitude: newLng,
      location_name: `Point (${newLat}, ${newLng})`,
      location_address: `Coordinates in Manila Sector: Lat ${newLat}, Lng ${newLng}`,
      google_place_id: `custom-pin-${Date.now()}`
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearch(query);

    if (query.trim().length > 1) {
      const filtered = locationPresets.filter(preset =>
        preset.name.toLowerCase().includes(query.toLowerCase()) ||
        preset.address.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectPreset = (preset: typeof locationPresets[0]) => {
    onChange({
      location_name: preset.name,
      location_address: preset.address,
      latitude: preset.lat,
      longitude: preset.lng,
      google_place_id: preset.placeId
    });
    setSearch('');
    setSuggestions([]);
  };

  return (
    <div className={styles.pickerContainer}>
      <div className={styles.searchWrapper}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search location (e.g. World Trade Center)..."
          value={search}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        {suggestions.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '2.2rem',
            left: 0,
            right: 0,
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                onClick={() => selectPreset(s)}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                  color: 'var(--foreground)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--muted)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ fontWeight: 'bold' }}>{s.name}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted-foreground)' }}>{s.address}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.mapWrapper}>
        <canvas
          ref={canvasRef}
          width={350}
          height={250}
          onClick={handleMapClick}
          className={styles.canvasMap}
        />
        <div style={{
          position: 'absolute',
          bottom: '0.5rem',
          right: '0.5rem',
          backgroundColor: 'rgba(0,0,0,0.6)',
          padding: '0.2rem 0.4rem',
          borderRadius: '0.25rem',
          fontSize: '0.55rem',
          color: '#fff',
          fontFamily: 'monospace'
        }}>
          Click canvas grid to map marker
        </div>
      </div>

      <div>
        <div className={styles.presetsHeader}>Preset Locations</div>
        <div className={styles.presetsGrid}>
          {locationPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectPreset(preset)}
              className={styles.presetBtn}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div>
          <div className={styles.infoLabel}>Location Name</div>
          <div className={styles.infoValue}>{value.location_name || '—'}</div>
        </div>
        <div>
          <div className={styles.infoLabel}>Place ID</div>
          <div className={styles.infoValue}>{value.google_place_id || '—'}</div>
        </div>
        <div className={styles.fullSpan}>
          <div className={styles.infoLabel}>Full Address</div>
          <div className={styles.infoValue}>{value.location_address || '—'}</div>
        </div>
        <div>
          <div className={styles.infoLabel}>Latitude</div>
          <div className={styles.infoValue}>{value.latitude || '0.0000'}</div>
        </div>
        <div>
          <div className={styles.infoLabel}>Longitude</div>
          <div className={styles.infoValue}>{value.longitude || '0.0000'}</div>
        </div>
      </div>
    </div>
  );
}
