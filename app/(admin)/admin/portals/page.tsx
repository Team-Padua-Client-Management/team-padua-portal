import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { createClient } from '@/app/lib/supabase/server';
import { supabaseAdmin } from '@/app/lib/supabase/admin';
import Sidebar from '@/app/components/admin/AdminSidebar';
import Header from '@/app/components/admin/AdminHeader';
import { portalsConfig } from '@/app/lib/portals/config';
import styles from '@/styles/admin/portals/page.module.css';

export const metadata = {
  title: 'Portal Management Overview | Team Padua Portal',
  description: 'Manage external resources, links, and documents for Google Drive, JotForm, Canva, Microsoft Teams, and other enterprise portals.',
};

export default async function PortalsOverviewPage() {
  const supabase = await createClient();
  
  // Verify admin session
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) redirect("/auth/login");

  // Fetch counts from DB
  const { data: resources } = await supabaseAdmin
    .from("portal_resources")
    .select("portal_slug");

  const counts: Record<string, number> = {};
  resources?.forEach((r) => {
    counts[r.portal_slug] = (counts[r.portal_slug] || 0) + 1;
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      
      <div className={styles.container_10}>
        <Header />
        
        <main className={styles.content}>
          {/* Header Panel */}
          <div className={styles.headerCard}>
            <div className={styles.headerGlow} />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase font-mono px-3 py-1.5 rounded-full w-fit bg-[#F4C542]/10 text-[#A97800] dark:text-[#F4C542]">
                <LayoutGrid size={12} /> Portal Directory
              </div>
              <h1 className={`${styles.title} mt-3`}>Portal Management Overview</h1>
              <p className={styles.subtitle}>
                Centralized operational terminal to configure, audit, and audit-trail external application shortcuts and resource links.
              </p>
            </div>
          </div>

          {/* Grid of Portals */}
          <div className={styles.portalGrid}>
            {portalsConfig.map((portal) => {
              const count = counts[portal.slug] || 0;
              return (
                <Link
                  key={portal.slug}
                  href={`/admin/portals/${portal.slug}`}
                  className={`${styles.portalCard} group`}
                >
                  <div className={portal.slug === 'sun-life' || portal.slug === 'advisor-office' ? 'absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl bg-[#F4C542]' : 'absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl'} style={portal.slug !== 'sun-life' && portal.slug !== 'advisor-office' ? { backgroundColor: portal.brandColor } : undefined} />
                  
                  <div className={styles.portalCardHeader}>
                    <div className={styles.portalIconWrapper}>
                      {portal.logo("w-8 h-8")}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-surface-2 border border-border text-text-secondary select-none">
                      {count} {count === 1 ? 'Resource' : 'Resources'}
                    </span>
                  </div>

                  <div className={styles.portalMeta}>
                    <h3 className={styles.portalTitle}>{portal.name}</h3>
                    <p className="text-[10px] text-text-secondary leading-relaxed mt-1 overflow-hidden line-clamp-2 h-8">
                      {portal.description}
                    </p>
                  </div>

                  <span className={styles.portalActionLink}>
                    Manage Resources <ArrowRight size={10} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
