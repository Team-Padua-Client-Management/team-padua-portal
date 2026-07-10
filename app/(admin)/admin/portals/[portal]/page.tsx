import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { portalsConfig } from '@/app/lib/portals/config';
import PortalManagementClient from '@/app/(admin)/admin/portals/[portal]/PortalManagementClient';

interface Props {
  params: Promise<{ portal: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { portal } = await params;
  const config = portalsConfig.find(p => p.slug === portal);

  return {
    title: config ? `${config.name} Resource Center | Team Padua` : 'Portal Management | Team Padua',
    description: `Manage client and team resources for the ${config?.name || 'external'} portal.`
  };
}

export default async function DynamicPortalPage({ params }: Props) {
  const supabase = await createClient();
  const { portal } = await params;

  // Validate session
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) redirect("/auth/login");

  // Validate portal configuration
  const config = portalsConfig.find((p) => p.slug === portal);
  if (!config) notFound();

  return (
    <PortalManagementClient
      portalSlug={portal}
      portalName={config.name}
      portalColor={config.brandColor}
      defaultUrl={config.defaultUrl}
    />
  );
}
