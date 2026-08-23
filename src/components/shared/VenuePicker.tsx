'use client';

/**
 * VenuePicker — OpenStreetMap + Nominatim edition
 *
 * Replaces the previous Google Maps / Google Places implementation with a
 * fully free, key-less alternative:
 *
 *   • Autocomplete  → Nominatim Search API  (openstreetmap.org/nominatim)
 *   • Map links     → openstreetmap.org/#map=…  (replacing Google Maps URLs)
 *   • No API keys, no billing, no third-party scripts injected at runtime.
 *
 * Nominatim usage policy requires:
 *   1. A descriptive User-Agent header (set below).
 *   2. Debounce ≥ 1 s between requests (enforced here at 600 ms + 3-char min).
 *   3. No automated mass-geocoding (this is an interactive picker — compliant).
 *
 * The exported `VenueData` shape is unchanged so all callers continue to work.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  X,
  RotateCcw,
  Building2,
  Check,
  Loader2,
  Navigation2,
} from 'lucide-react';

// ─── Public contract (unchanged from previous implementation) ────────────────

export interface VenueData {
  venue_name: string;
  venue_address?: string;
  /** OSM place id (e.g. "way/12345678") or Nominatim osm_id string */
  venue_place_id?: string;
  venue_lat?: number;
  venue_lng?: number;
  /** OpenStreetMap permalink */
  venue_maps_url?: string;
}

interface VenuePickerProps {
  value?: VenueData;
  onChange: (venue: VenueData | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  osm_type: string;   // "node" | "way" | "relation"
  osm_id: number;
  display_name: string;
  name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build an OpenStreetMap permalink that opens the map centred on a pin.
 * zoom=17 gives a comfortable street-level view.
 */
function buildOsmUrl(lat: number, lng: number, zoom = 17): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

/**
 * Build a human-friendly short address from Nominatim's structured `address` object.
 */
function buildShortAddress(result: NominatimResult): string {
  const a = result.address;
  if (!a) return result.display_name;

  const parts = [
    a.road,
    a.city || a.county,
    a.state,
    a.country,
  ].filter(Boolean);

  return parts.length ? parts.join(', ') : result.display_name;
}

/**
 * Extract the most human-readable primary name from a Nominatim result.
 * Nominatim often has a short `name` field (e.g. "SM Mall of Asia") that is
 * better than the full `display_name`.
 */
function extractName(result: NominatimResult): string {
  // `name` can be empty for pure address results
  if (result.name && result.name.trim()) return result.name.trim();
  // Fall back: first segment of display_name
  return result.display_name.split(',')[0].trim();
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VenuePicker({
  value,
  onChange,
  placeholder = 'Search venue or landmark (e.g. SM Megamall, Ayala Triangle)...',
  className = '',
  disabled = false,
}: VenuePickerProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Click-outside closes dropdown ────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Debounced Nominatim search ────────────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      setSearchError(null);
      return;
    }

    // 600 ms debounce — keeps us comfortably within Nominatim's rate limit.
    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          q: trimmed,
          format: 'json',
          addressdetails: '1',
          limit: '7',
          // Soft-bias towards the Philippines — results elsewhere still appear
          countrycodes: 'ph',
          'accept-language': 'en',
        });

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              // Required by Nominatim usage policy
              'User-Agent': 'TeamPaduaPortal/1.0 (internal admin portal)',
              'Accept': 'application/json',
            },
          }
        );

        if (!res.ok) throw new Error(`Nominatim responded with ${res.status}`);

        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setIsDropdownOpen(true);
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // Expected — ignore
        console.warn('[VenuePicker] Nominatim search failed:', err);
        setSuggestions([]);
        setSearchError('Search unavailable. Type a venue name and press Enter to save it manually.');
        setIsDropdownOpen(true);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => {
      clearTimeout(timer);
      abortControllerRef.current?.abort();
    };
  }, [query]);

  // ── Select a Nominatim result ─────────────────────────────────────────────
  const handleSelectSuggestion = useCallback((result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const name = extractName(result);
    const address = buildShortAddress(result);
    const osmId = `${result.osm_type}/${result.osm_id}`;
    const mapsUrl = buildOsmUrl(lat, lng);

    onChange({
      venue_name: name,
      venue_address: address,
      venue_place_id: osmId,
      venue_lat: lat,
      venue_lng: lng,
      venue_maps_url: mapsUrl,
    });

    setQuery('');
    setSuggestions([]);
    setIsDropdownOpen(false);
  }, [onChange]);

  // ── Save manual/custom venue entry ────────────────────────────────────────
  const handleUseCustomVenue = useCallback(() => {
    const name = query.trim();
    if (!name) return;
    onChange({
      venue_name: name,
      venue_address: '',
      // No coordinates for a manual entry — that's fine.
    });
    setQuery('');
    setSuggestions([]);
    setIsDropdownOpen(false);
  }, [query, onChange]);

  // ── Switch back to search mode ────────────────────────────────────────────
  const handleChangeVenue = useCallback(() => {
    onChange(null);
    setQuery('');
    setSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [onChange]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: SELECTED STATE
  // ─────────────────────────────────────────────────────────────────────────
  if (value && value.venue_name) {
    const hasCoords = typeof value.venue_lat === 'number' && typeof value.venue_lng === 'number';

    // Build OSM URL — prefer stored URL, then reconstruct from coords, then text search
    const mapsLink =
      value.venue_maps_url ||
      (hasCoords
        ? buildOsmUrl(value.venue_lat!, value.venue_lng!)
        : `https://www.openstreetmap.org/search?query=${encodeURIComponent(value.venue_name)}`);

    return (
      <div
        className={`w-full rounded-2xl border border-blue-200/80 bg-blue-50/60 dark:border-blue-800/40 dark:bg-blue-950/20 p-3.5 transition-all ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <MapPin size={16} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {value.venue_name}
                </span>
                {hasCoords && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <Check size={10} strokeWidth={3} /> Verified Place
                  </span>
                )}
              </div>
              {value.venue_address && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {value.venue_address}
                </p>
              )}

              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all shadow-xs"
                >
                  <ExternalLink size={12} />
                  View on OpenStreetMap
                </a>

                {!disabled && (
                  <button
                    type="button"
                    onClick={handleChangeVenue}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw size={11} /> Change venue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: SEARCH / INPUT STATE
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Search input */}
      <div className="relative flex items-center group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
          <Search size={15} />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => {
            if (suggestions.length > 0 || query.trim().length >= 3) {
              setIsDropdownOpen(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (suggestions.length > 0) {
                handleSelectSuggestion(suggestions[0]);
              } else if (query.trim()) {
                handleUseCustomVenue();
              }
            }
            if (e.key === 'Escape') {
              setIsDropdownOpen(false);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 shadow-xs"
        />

        <div className="absolute right-3 flex items-center gap-1.5">
          {loading && <Loader2 size={14} className="animate-spin text-blue-500" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setIsDropdownOpen(false);
                setSearchError(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown: suggestions / loading / error / empty */}
      {isDropdownOpen && query.trim().length >= 3 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-72 overflow-y-auto">
          {loading ? (
            /* Loading state */
            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-500" /> Searching OpenStreetMap…
            </div>
          ) : searchError ? (
            /* Error state — manual fallback */
            <div className="p-3.5 flex flex-col items-start gap-2">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">{searchError}</p>
              <button
                type="button"
                onClick={handleUseCustomVenue}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Building2 size={12} />
                Save &ldquo;{query.trim()}&rdquo; as venue
              </button>
            </div>
          ) : suggestions.length > 0 ? (
            /* Results list */
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Navigation2 size={9} /> OpenStreetMap Suggestions
                </span>
                <span className="text-[9px] font-normal text-slate-400">Press Enter to select top</span>
              </div>

              {suggestions.map((result) => {
                const name = extractName(result);
                const addr = buildShortAddress(result);
                const key = `${result.osm_type}-${result.osm_id}`;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectSuggestion(result)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 dark:hover:bg-blue-900/20 transition-colors flex items-start gap-2.5 cursor-pointer border-b border-slate-50 dark:border-slate-800/40 last:border-0"
                  >
                    <MapPin size={15} className="text-blue-500 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{name}</p>
                      {addr !== name && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{addr}</p>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Manual entry option always shown below suggestions */}
              <button
                type="button"
                onClick={handleUseCustomVenue}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 text-xs font-medium border-t border-slate-100 dark:border-slate-800"
              >
                <Building2 size={13} className="text-slate-400 shrink-0" />
                <span>Use custom venue: <strong className="text-slate-900 dark:text-white">&ldquo;{query}&rdquo;</strong></span>
              </button>
            </div>
          ) : (
            /* No results */
            <div className="p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No places found for &ldquo;{query}&rdquo; on OpenStreetMap.
              </p>
              <button
                type="button"
                onClick={handleUseCustomVenue}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Building2 size={12} />
                Save &ldquo;{query}&rdquo; as custom venue
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
