'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Grid, List, ExternalLink, 
  Copy, Star, Loader2, ArrowLeft, Check, AlertCircle, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '@/styles/admin/portals/page.module.css';
import { supabase } from '@/app/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Resource {
  id: string;
  category_id: string;
  portal_slug: string;
  title: string;
  description: string;
  url: string;
  thumbnail?: string;
  favorite: boolean;
  status: 'Active' | 'Hidden' | 'Archived';
  display_order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

interface PortalClientViewProps {
  portalSlug: string;
  portalName: string;
  portalColor: string;
  defaultUrl: string;
}

export default function PortalClientView({
  portalSlug,
  portalName,
  portalColor,
  defaultUrl
}: PortalClientViewProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View/Filter States
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [sortBy, setSortBy] = useState('display_order');

  // UI Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Trigger Notification Toast
  const triggerToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch all resources and categories
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch categories
      const catRes = await fetch('/api/portals/categories');
      if (!catRes.ok) throw new Error("Failed to load categories");
      const catData = await catRes.json();
      setCategories(catData);

      // Fetch active resources for client/user
      const resRes = await fetch(`/api/portals/resources?portal=${portalSlug}&sortBy=${sortBy}&category=${selectedCategoryId}&search=${encodeURIComponent(searchQuery)}&status=Active`);
      if (!resRes.ok) throw new Error("Failed to load resources");
      const resData = await resRes.json();
      setResources(resData);
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Error syncing portal data. Check connection.');
    } finally {
      setIsLoading(false);
    }
  }, [portalSlug, sortBy, selectedCategoryId, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy URL to Clipboard
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    triggerToast('success', 'Resource link copied to clipboard.');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Handle Toggle Favorite (using public api endpoint)
  const handleToggleFavorite = async (resource: Resource) => {
    try {
      const res = await fetch('/api/portals/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resource.id, favorite: !resource.favorite })
      });
      if (!res.ok) throw new Error("Toggle favorite failed");
      triggerToast('success', !resource.favorite ? 'Pinned to favorites.' : 'Removed from favorites.');
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Could not toggle favorite status.');
    }
  };


  return (
    <div className={styles.container_10}>
      <main className={styles.content} style={{ paddingLeft: 0, paddingRight: 0 }}>
        {/* Header Row */}
        <div className={styles.headerCard}>
          <div className={styles.headerGlow} />
          <div className="flex flex-col gap-2">
            <Link 
              href="/portals" 
              className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-text-secondary hover:text-[#A97800] dark:hover:text-[#F4C542] mb-1"
            >
              <ArrowLeft size={10} /> Back to Directory
            </Link>
            <div className="flex items-center gap-3">
              <div 
                className="w-1.5 h-7 rounded-full" 
                style={{ backgroundColor: portalColor }} 
              />
              <h1 className={styles.title}>{portalName} Resource Center</h1>
            </div>
            <p className={styles.subtitle}>
              Access, open, and download external application shortcuts, files, and templates distributed under the {portalName} portal.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a 
              href={defaultUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-border text-xs font-bold text-text-secondary bg-card/40 hover:bg-surface-2 hover:text-text transition-all"
            >
              Open Main Site <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Search, Filters, and Controls Block */}
        <div className={styles.controlsBlock}>
          <div className={styles.controlsTop}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder={`Search by title, description, or tags...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filtersRight}>
              {/* Sort By selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.selectInput}
              >
                <option value="display_order">Sort: Custom Order</option>
                <option value="updated">Sort: Recently Updated</option>
                <option value="title">Sort: Alphabetical</option>
                <option value="favorite">Sort: Starred First</option>
              </select>

              <div className="w-px h-6 bg-border mx-1" />

              {/* View Toggles */}
              <button
                onClick={() => setViewMode('grid')}
                className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
                title="Grid View"
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
                title="Table View"
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Category Filter Pills Row */}
          <div className={styles.categoryScroller}>
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`${styles.categoryPill} ${selectedCategoryId === 'all' ? styles.categoryPillActive : ''}`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`${styles.categoryPill} ${selectedCategoryId === cat.id ? styles.categoryPillActive : ''}`}
                style={selectedCategoryId === cat.id ? undefined : ({ borderColor: `${cat.color}20`, '--hover-border-color': cat.color } as React.CSSProperties)}
              >
                <span 
                  className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" 
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div 
            className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all shadow-md ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
            }`}
          >
            {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Resources Workspace */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-[#F4C542]" />
            <p className="text-xs text-text-secondary font-medium">Syncing portal registry...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={36} className="text-[#F4C542] animate-bounce" />
            <h3 className={styles.emptyStateTitle}>No Resources Found</h3>
            <p className={styles.emptyStateDesc}>
              We couldn&apos;t find any active resources matching your search queries or category filters.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {resources.map((resource) => {
              const catColor = resource.category?.color || '#cbd5e1';
              return (
                <div key={resource.id} className="relative h-[280px] overflow-hidden rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 group border border-border/10">
                  {/* Full Background Cover */}
                  {resource.thumbnail ? (
                    <Image
                      src={resource.thumbnail}
                      alt={resource.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div 
                      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-transform duration-700 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${catColor}15 0%, ${catColor}30 100%)`,
                        color: catColor
                      }}
                    >
                      <Sparkles size={48} style={{ color: catColor }} className="opacity-40 animate-pulse" />
                      <span className="mt-4 font-mono text-[10px] tracking-widest opacity-60 uppercase">{resource.category?.name || 'Asset'}</span>
                    </div>
                  )}

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

                  {/* Top-Right Favorite Button */}
                  <div className="absolute top-4 right-4 z-10">
                    <button
                      onClick={() => handleToggleFavorite(resource)}
                      className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors hover:bg-black/60"
                      title={resource.favorite ? "Unpin Favorite" : "Pin Favorite"}
                    >
                      <Star 
                        size={14} 
                        className={resource.favorite ? "fill-[#F4C542] text-[#F4C542]" : "text-white/70 hover:text-white"} 
                      />
                    </button>
                  </div>

                  {/* Bottom Content Area */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10 flex flex-col justify-end">
                    <h3 className="text-white font-bold text-lg leading-tight mb-1" title={resource.title}>
                      {resource.title}
                    </h3>
                    <p className="text-zinc-300 text-xs line-clamp-2 mb-4" title={resource.description}>
                      {resource.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                      {/* Tags */}
                      <div className="flex gap-2">
                        <span 
                          className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border backdrop-blur-md"
                          style={{
                            borderColor: `${catColor}50`,
                            backgroundColor: `${catColor}20`,
                            color: catColor
                          }}
                        >
                          {resource.category?.name || 'Uncategorized'}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 backdrop-blur-md">
                          {resource.status}
                        </span>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyLink(resource.url, resource.id)}
                          className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
                          title="Copy URL"
                        >
                          <Copy size={12} className={copiedId === resource.id ? "text-emerald-400" : ""} />
                        </button>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
                          title="Open Resource"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table Layout */
          <div className={styles.tableWrapper}>
            <table className={styles.resourcesTable}>
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((resource) => {
                  const catColor = resource.category?.color || '#cbd5e1';
                  return (
                    <tr key={resource.id}>
                      <td>
                        <button
                          onClick={() => handleToggleFavorite(resource)}
                          title={resource.favorite ? "Unpin Favorite" : "Pin Favorite"}
                        >
                          <Star 
                            size={14} 
                            className={resource.favorite ? "fill-[#F4C542] text-[#F4C542]" : "text-muted hover:text-[#F4C542]"} 
                          />
                        </button>
                      </td>
                      <td>
                        <div className="font-bold text-xs">{resource.title}</div>
                        <div className="text-[10px] text-text-secondary overflow-hidden line-clamp-1">{resource.url}</div>
                      </td>
                      <td>
                        <div className="text-xs text-text-secondary max-w-md overflow-hidden line-clamp-2">
                          {resource.description || '—'}
                        </div>
                      </td>
                      <td>
                        <span 
                          className={styles.badgeCategory}
                          style={{
                            borderColor: `${catColor}30`,
                            backgroundColor: `${catColor}10`,
                            color: catColor
                          }}
                        >
                          {resource.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.cardActionBtn}
                            title="Open Resource"
                          >
                            <ExternalLink size={12} />
                          </a>
                          <button
                            onClick={() => handleCopyLink(resource.url, resource.id)}
                            className={styles.cardActionBtn}
                            title="Copy URL"
                          >
                            <Copy size={12} className={copiedId === resource.id ? "text-emerald-500" : ""} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
