import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export interface LandingStats {
  totalClients: number;
  activeClients: number;
  acrRequests: number;
  teamMembers: number;
  upcomingEvents: number;
  birthdaysThisMonth: number;
  faqs: {
    question: string;
    answer: string;
    is_pinned: boolean;
    category: string;
  }[];
}

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      totalClientsResult,
      activeClientsResult,
      acrRequestsResult,
      teamMembersResult,
      upcomingEventsResult,
      birthdaysResult,
      faqsResult,
    ] = await Promise.all([
      // Total clients in the CPST table
      supabase.from('clients').select('*', { count: 'exact', head: true }),

      // Active / Serviced clients
      supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Serviced'),

      // ACR requests submitted
      supabase.from('acr_requests').select('*', { count: 'exact', head: true }),

      // Portal team members (profiles)
      supabase.from('profiles').select('*', { count: 'exact', head: true }),

      // Upcoming calendar events (today or future)
      supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .gte('event_date', new Date().toISOString().split('T')[0]),

      // Clients with birthdays this calendar month
      // birthdate is stored as TEXT (ISO string) — extract month via LIKE pattern
      supabase
        .from('clients')
        .select('birthdate', { count: 'exact', head: false })
        .then(async ({ data }) => {
          if (!data) return { count: 0, error: null };
          const currentMonth = new Date().getMonth() + 1;
          const count = data.filter((c) => {
            try {
              return new Date(c.birthdate).getMonth() + 1 === currentMonth;
            } catch {
              return false;
            }
          }).length;
          return { count, error: null };
        }),

      // Published FAQs ordered by pinned first
      supabase
        .from('faqs')
        .select('question, answer, is_pinned, category')
        .eq('status', 'Published')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const stats: LandingStats = {
      totalClients: totalClientsResult.count ?? 0,
      activeClients: activeClientsResult.count ?? 0,
      acrRequests: acrRequestsResult.count ?? 0,
      teamMembers: teamMembersResult.count ?? 0,
      upcomingEvents: upcomingEventsResult.count ?? 0,
      birthdaysThisMonth:
        typeof birthdaysResult === 'object' && 'count' in birthdaysResult
          ? (birthdaysResult.count as number)
          : 0,
      faqs: (faqsResult.data ?? []).map((f) => ({
        question: f.question,
        answer: f.answer,
        is_pinned: f.is_pinned,
        category: f.category,
      })),
    };

    return NextResponse.json(stats);
  } catch (err) {
    console.error('[landing-stats] fetch error:', err);
    // Return safe zeroed fallback — page must never crash
    return NextResponse.json({
      totalClients: 0,
      activeClients: 0,
      acrRequests: 0,
      teamMembers: 0,
      upcomingEvents: 0,
      birthdaysThisMonth: 0,
      faqs: [],
    } satisfies LandingStats);
  }
}
