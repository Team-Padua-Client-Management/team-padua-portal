'use client';

/**
 * AdminRouteGuard.tsx
 *
 * Client-side route guard for /admin/* pages.
 *
 * Responsibilities:
 * - Reads the current user's role via useAuthScope() (existing auth system).
 * - While loading: renders a neutral loading state — no admin data is fetched
 *   or rendered.
 * - If role === "Admin": renders children normally.
 * - If role !== "Admin": shows an access-denied modal and redirects to /dashboard.
 *   Children are never rendered for unauthorized users.
 *
 * This is defense-in-depth — the middleware already handles server-side redirects.
 * This component prevents the admin data hooks inside children from ever firing
 * for unauthorized users in the browser.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useAuthScope } from '@src/lib/authScope';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const router = useRouter();
  const { isAdmin, loading } = useAuthScope();

  // Auto-redirect after a short delay so the user can read the message
  useEffect(() => {
    if (!loading && !isAdmin) {
      const timer = setTimeout(() => {
        router.replace('/dashboard');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, isAdmin, router]);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F0F0F',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.1)',
              borderTop: '3px solid rgba(255,255,255,0.6)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontWeight: 500 }}>
            Verifying access…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Access Denied ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 10, 10, 0.92)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: '#FFFFFF',
            borderRadius: '24px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
            padding: '36px 32px',
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1.5px solid rgba(239, 68, 68, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#DC2626',
            }}
          >
            <ShieldX size={30} strokeWidth={1.8} />
          </div>

          {/* Heading */}
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#18181B',
              margin: '0 0 10px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Admin Access Required
          </h2>

          {/* Body */}
          <p
            style={{
              fontSize: '0.88rem',
              color: '#71717A',
              margin: '0 0 28px 0',
              lineHeight: 1.65,
              fontWeight: 500,
            }}
          >
            You do not have permission to access this page.
            <br />
            Redirecting you to your dashboard…
          </p>

          {/* Button */}
          <button
            id="admin-access-denied-return-btn"
            type="button"
            onClick={() => router.replace('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '999px',
              border: 'none',
              background: '#18181B',
              color: '#FFFFFF',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              transition: 'all 0.15s ease',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#27272A';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.24)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#18181B';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
            }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Authorized ───────────────────────────────────────────────────────────────
  return <>{children}</>;
}
