'use client';

/**
 * 403 Forbidden Page
 *
 * Displayed when a user attempts to access a resource
 * they do not have permission to view.
 */

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '3rem 2.5rem',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(244, 197, 66, 0.15)',
          marginBottom: '1.5rem',
        }}>
          <ShieldAlert size={40} color="#F4C542" />
        </div>

        <h1 style={{
          fontSize: '4rem',
          fontWeight: 800,
          color: '#F4C542',
          margin: '0 0 0.5rem 0',
          lineHeight: 1,
        }}>
          403
        </h1>

        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#e0e0e0',
          margin: '0 0 1rem 0',
        }}>
          Access Denied
        </h2>

        <p style={{
          color: '#9ca3af',
          fontSize: '0.95rem',
          lineHeight: 1.6,
          margin: '0 0 2rem 0',
        }}>
          You don&apos;t have permission to access this page.
          Please contact your administrator if you believe this is an error.
        </p>

        <Link
          href="/admin/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 2rem',
            background: 'linear-gradient(135deg, #F4C542, #e6b800)',
            color: '#1a1a2e',
            fontWeight: 600,
            fontSize: '0.9rem',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 15px rgba(244, 197, 66, 0.3)',
          }}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
