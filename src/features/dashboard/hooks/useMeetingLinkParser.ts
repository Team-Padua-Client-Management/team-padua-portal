import { useMemo } from 'react';

export interface ParsedMeetingLink {
  platform: 'Zoom' | 'Google Meet' | 'Microsoft Teams' | '' | string;
  meetingId: string;
  passcode: string;
  isValid: boolean;
  isDetected: boolean;
  isZoom: boolean;
  isGoogleMeet: boolean;
  isTeams: boolean;
  isPersonalMeeting: boolean;
  rawUrl: string;
  note?: string;
  error?: string;
}

/** Formats 9, 10, or 11-digit meeting ID for clean display e.g. "123 4567 8901" */
export function formatMeetingId(rawId: string): string {
  const digits = rawId.replace(/\D/g, '');
  if (digits.length === 11) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return digits || rawId;
}

/**
 * Pure parser function for meeting links (Zoom, Google Meet, MS Teams)
 */
export function parseMeetingLink(rawInput: string): ParsedMeetingLink {
  const trimmed = (rawInput || '').trim();

  const emptyResult: ParsedMeetingLink = {
    platform: '',
    meetingId: '',
    passcode: '',
    isValid: true,
    isDetected: false,
    isZoom: false,
    isGoogleMeet: false,
    isTeams: false,
    isPersonalMeeting: false,
    rawUrl: trimmed,
  };

  if (!trimmed) {
    return emptyResult;
  }

  // Check valid URL structure (supports with or without https:// protocol during typing)
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  const normalizedUrl = hasProtocol ? trimmed : `https://${trimmed}`;

  let urlObj: URL;
  try {
    urlObj = new URL(normalizedUrl);
  } catch {
    return {
      ...emptyResult,
      isValid: false,
      error: 'Please enter a valid meeting URL (e.g. https://zoom.us/j/...)',
    };
  }

  const hostname = urlObj.hostname.toLowerCase();
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  // 1. ZOOM URL DETECTION
  if (hostname.includes('zoom.us')) {
    // Check Personal Meeting Room (zoom.us/my/username)
    const myMatch = pathname.match(/^\/my\/([a-zA-Z0-9._-]+)/i);
    if (myMatch) {
      return {
        platform: 'Zoom',
        meetingId: '',
        passcode: '',
        isValid: true,
        isDetected: true,
        isZoom: true,
        isGoogleMeet: false,
        isTeams: false,
        isPersonalMeeting: true,
        rawUrl: trimmed,
        note: 'Personal meeting link — no numeric ID or passcode to extract.',
      };
    }

    // Standard Zoom join or web link: /j/{meetingId} or /w/{meetingId} or /wc/{meetingId}
    const standardMatch = pathname.match(/^\/(?:j|w|wc)\/(\d+)/i);
    if (standardMatch && standardMatch[1]) {
      const rawMeetingId = standardMatch[1];
      const pwdParam = searchParams.get('pwd') || '';

      // If pwd is a long base64 hash (>22 chars or contains complex symbols), Zoom generated an encrypted token
      // rather than the plaintext passcode. Leave it blank for user manual entry rather than showing hash noise.
      const isEncryptedToken = pwdParam.length > 20 || /^[A-Za-z0-9+/=]{22,}$/.test(pwdParam);
      const extractedPasscode = isEncryptedToken ? '' : decodeURIComponent(pwdParam);

      return {
        platform: 'Zoom',
        meetingId: formatMeetingId(rawMeetingId),
        passcode: extractedPasscode,
        isValid: true,
        isDetected: true,
        isZoom: true,
        isGoogleMeet: false,
        isTeams: false,
        isPersonalMeeting: false,
        rawUrl: trimmed,
        note: isEncryptedToken && pwdParam
          ? 'Link contains encrypted token; enter numeric passcode if needed.'
          : undefined,
      };
    }

    return {
      platform: 'Zoom',
      meetingId: '',
      passcode: '',
      isValid: true,
      isDetected: true,
      isZoom: true,
      isGoogleMeet: false,
      isTeams: false,
      isPersonalMeeting: false,
      rawUrl: trimmed,
    };
  }

  // 2. GOOGLE MEET DETECTION
  if (hostname.includes('meet.google.com')) {
    return {
      platform: 'Google Meet',
      meetingId: '',
      passcode: '',
      isValid: true,
      isDetected: true,
      isZoom: false,
      isGoogleMeet: true,
      isTeams: false,
      isPersonalMeeting: false,
      rawUrl: trimmed,
      note: 'Google Meet does not require a separate meeting ID or passcode.',
    };
  }

  // 3. MICROSOFT TEAMS DETECTION
  if (hostname.includes('teams.microsoft.com') || hostname.includes('teams.live.com')) {
    return {
      platform: 'Microsoft Teams',
      meetingId: '',
      passcode: '',
      isValid: true,
      isDetected: true,
      isZoom: false,
      isGoogleMeet: false,
      isTeams: true,
      isPersonalMeeting: false,
      rawUrl: trimmed,
    };
  }

  // Generic valid URL
  return {
    ...emptyResult,
    isValid: true,
    isDetected: false,
    rawUrl: trimmed,
  };
}

/**
 * React hook that parses a meeting link in real-time
 */
export function useMeetingLinkParser(url: string): ParsedMeetingLink {
  return useMemo(() => parseMeetingLink(url), [url]);
}
