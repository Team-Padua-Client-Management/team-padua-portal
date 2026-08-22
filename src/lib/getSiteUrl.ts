/**
 * Utility functions for managing Local vs Production environment URLs.
 */

export function getSiteUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3000';

  url = url.trim();

  if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL.includes('localhost'))) {
    url = window.location.origin;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url.replace(/\/$/, '');
}

export function getProductionUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PRODUCTION_URL ||
    'https://team-padua-portal.vercel.app'
  );
}

export function getLocalUrl(): string {
  return 'http://localhost:3000';
}

export function isLocalEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local')
    );
  }
  return (
    process.env.NODE_ENV === 'development' ||
    Boolean(process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost'))
  );
}
