'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Search, Grid, List, Edit2, Trash2, ExternalLink, 
  Copy, Star, StarOff, Archive, Eye, EyeOff, Loader2, 
  ArrowLeft, Check, AlertCircle, Sparkles, Upload, Image, X,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/app/components/admin/AdminSidebar/page';
import Header from '@/app/components/admin/AdminHeader/page';
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

interface PortalManagementClientProps {
  portalSlug: string;
  portalName: string;
  portalColor: string;
  defaultUrl: string;
}

export default function PortalManagementClient({
  portalSlug,
  portalName,
  portalColor,
  defaultUrl
}: PortalManagementClientProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // View/Filter States
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [sortBy, setSortBy] = useState('display_order');
  const [showArchived, setShowArchived] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    category_id: '',
    category_name: '',
    display_order: 0,
    favorite: false,
    status: 'Active' as Resource['status']
  });

  // UI Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Close context menu on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Events for File Uploader
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop Event for File Uploader
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Manual File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  // Upload File to Supabase Storage
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      triggerToast('error', 'Only image files are allowed.');
      return;
    }
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `portals/${fileName}`;

      // Uploading to design_assets bucket
      const { error: uploadError } = await supabase.storage
        .from("design_assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("design_assets")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail: urlData.publicUrl }));
      triggerToast('success', 'Image uploaded successfully!');
    } catch (err: any) {
      console.error(err);
      triggerToast('error', err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

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

      // Fetch resources
      const statusParam = showArchived ? 'ALL' : 'Active';
      const resRes = await fetch(`/api/portals/resources?portal=${portalSlug}&sortBy=${sortBy}&category=${selectedCategoryId}&search=${encodeURIComponent(searchQuery)}&status=${statusParam}`);
      if (!resRes.ok) throw new Error("Failed to load resources");
      const resData = await resRes.json();
      setResources(resData);
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Error syncing portal data. Check database connections.');
    } finally {
      setIsLoading(false);
    }
  }, [portalSlug, sortBy, selectedCategoryId, searchQuery, showArchived]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Open Form for Adding
  const handleOpenAdd = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      description: '',
      url: '',
      thumbnail: '',
      category_id: categories[0]?.id || '',
      category_name: categories[0]?.name || '',
      display_order: resources.length + 1,
      favorite: false,
      status: 'Active'
    });
    setShowUrlField(false);
    setDragActive(false);
    setIsAddModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      url: resource.url,
      thumbnail: resource.thumbnail || '',
      category_id: resource.category_id || '',
      category_name: resource.category?.name || '',
      display_order: resource.display_order,
      favorite: resource.favorite,
      status: resource.status
    });
    setShowUrlField(!!resource.thumbnail);
    setDragActive(false);
    setIsAddModalOpen(true);
  };

  // Handle Form Submission (Create or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      triggerToast('error', 'Please fill out all required fields.');
      return;
    }

    try {
      // Resolve category name to category_id if possible
      const categoryName = (formData.category_name || '').trim();
      const matchedCat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
      const category_id = matchedCat ? matchedCat.id : (formData.category_id || '');

      const payload = {
        ...formData,
        category_id,
        portal_slug: portalSlug
      };

      let res;
      if (editingResource) {
        // Edit mode (PUT)
        res = await fetch('/app/api/portals/resources', { // Wait, relative api route is '/api/portals/resources'
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingResource.id, ...payload })
        });
      } else {
        // Add mode (POST)
        res = await fetch('/api/portals/resources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // Check fallback of absolute route in Next.js
      if (!res.ok) {
        // If route PUT has issues, try relative route endpoint
        res = await fetch('/api/portals/resources', {
          method: editingResource ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingResource ? { id: editingResource.id, ...payload } : payload)
        });
      }

      if (!res.ok) throw new Error("API transaction failed");

      triggerToast('success', editingResource ? 'Resource updated successfully.' : 'Resource added successfully.');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Failed to save resource. Please retry.');
    }
  };

  // Handle Favorite Toggle
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

  // Handle Status Toggle (Active <-> Hidden)
  const handleToggleStatus = async (resource: Resource) => {
    const nextStatus = resource.status === 'Active' ? 'Hidden' : 'Active';
    try {
      const res = await fetch('/api/portals/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resource.id, status: nextStatus })
      });
      if (!res.ok) throw new Error("Toggle status failed");
      triggerToast('success', `Resource status set to ${nextStatus}.`);
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Could not update status.');
    }
  };

  // Handle Archive
  const handleArchive = async (resource: Resource) => {
    try {
      const res = await fetch('/api/portals/resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: resource.id, status: 'Archived' })
      });
      if (!res.ok) throw new Error("Archive failed");
      triggerToast('success', 'Resource archived successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Could not archive resource.');
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    try {
      const res = await fetch(`/api/portals/resources?id=${confirmDeleteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Delete failed");
      triggerToast('success', 'Resource deleted successfully.');
      setConfirmDeleteId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Could not delete resource.');
    }
  };

  // Handle Duplicate Resource
  const handleDuplicate = async (resource: Resource) => {
    try {
      const payload = {
        title: `${resource.title} (Copy)`,
        description: resource.description || '',
        url: resource.url,
        thumbnail: resource.thumbnail || '',
        category_id: resource.category_id || '',
        display_order: resource.display_order + 1,
        favorite: false,
        status: resource.status,
        portal_slug: portalSlug
      };
      const res = await fetch('/api/portals/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Duplicate failed");
      triggerToast('success', 'Resource duplicated successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      triggerToast('error', 'Could not duplicate resource.');
    }
  };

  // Copy URL to Clipboard
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    triggerToast('success', 'Resource link copied to clipboard.');
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Render Thumbnail or abstract aesthetic fallback card top
  const renderThumbnail = (resource: Resource) => {
    const categoryColor = resource.category?.color || portalColor || '#F4C542';
    
    if (resource.thumbnail) {
      return (
        <img
          src={resource.thumbnail}
          alt={resource.title}
          className={`${styles.cardThumbnail} group-hover:scale-105`}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }

    return (
      <div 
        className={styles.cardThumbnailPlaceHolder}
        style={{
          background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}30 100%)`,
          color: categoryColor
        }}
      >
        <Sparkles size={24} style={{ color: categoryColor }} className="opacity-70 animate-pulse" />
        <span className="mt-1 font-mono text-[9px] tracking-widest">{resource.category?.name || 'Asset'}</span>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <Sidebar />

      <div className={styles.container_10}>
        <Header />

        <main className={styles.content}>
          {/* Header Row */}
          <div className={styles.headerCard}>
            <div className={styles.headerGlow} />
            <div className="flex flex-col gap-2">
              <Link 
                href="/admin/portals" 
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
                Configure links, manage folders, and toggle templates distributed to team members under the {portalName} portal.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a 
                href={defaultUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-bold text-text-secondary bg-card/40 hover:bg-surface-2 hover:text-text transition-all"
              >
                Open Main Site <ExternalLink size={12} />
              </a>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#F4C542] hover:bg-[#F4C542]/85 text-black text-xs font-bold shadow-md hover:shadow-lg transition-all border border-[#F4C542] cursor-pointer"
              >
                <Plus size={14} /> Add {portalName} Link
              </button>
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

                {/* Show/Hide Archived checkbox */}
                <label className="flex items-center gap-1.5 text-xs text-text-secondary font-medium select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="accent-[#F4C542] rounded"
                  />
                  Show Archived
                </label>

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
                We couldn&apos;t find any resources matching your search queries or category filters. Click the button above to add one!
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid Layout */
            <div className={styles.resourcesGrid}>
              {resources.map((resource) => {
                const catColor = resource.category?.color || '#cbd5e1';
                return (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.resourceCard}
                  >
                    {/* Full Edge-to-Edge Thumbnail */}
                    <div className={styles.cardImageWrapper}>
                      {renderThumbnail(resource)}
                    </div>

                    {/* Ambient Dark Gradient Overlay */}
                    <div className={styles.cardGradientOverlay} />

                    {/* Floating Controls Star / Options Context Menu */}
                    <div className={styles.floatingControls}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFavorite(resource);
                        }}
                        className={styles.cardFavoriteBtnFloating}
                        title={resource.favorite ? "Unpin Favorite" : "Pin Favorite"}
                      >
                        <Star 
                          size={13} 
                          className={resource.favorite ? "fill-[#F4C542] text-[#F4C542]" : "text-white/80 hover:text-[#F4C542] transition-colors"} 
                        />
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === resource.id ? null : resource.id);
                        }}
                        className={styles.cardMenuBtnFloating}
                        title="Options"
                      >
                        <MoreVertical size={13} className="text-white/80 hover:text-white transition-colors" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === resource.id && (
                        <div className={styles.menuDropdown} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.open(resource.url, '_blank');
                              setActiveMenuId(null);
                            }}
                            className={styles.dropdownItem}
                          >
                            <ExternalLink size={12} /> Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleCopyLink(resource.url, resource.id);
                              setActiveMenuId(null);
                            }}
                            className={styles.dropdownItem}
                          >
                            <Copy size={12} /> Copy Link
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenEdit(resource);
                              setActiveMenuId(null);
                            }}
                            className={styles.dropdownItem}
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDuplicate(resource);
                              setActiveMenuId(null);
                            }}
                            className={styles.dropdownItem}
                          >
                            <Copy size={12} /> Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleStatus(resource);
                              setActiveMenuId(null);
                            }}
                            className={styles.dropdownItem}
                          >
                            {resource.status === 'Active' ? <EyeOff size={12} /> : <Eye size={12} />}
                            {resource.status === 'Active' ? 'Hide' : 'Show'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleArchive(resource);
                              setActiveMenuId(null);
                            }}
                            className={styles.dropdownItem}
                          >
                            <Archive size={12} /> Archive
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmDeleteId(resource.id);
                              setActiveMenuId(null);
                            }}
                            className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Text & Badges content overlaid directly on the card bottom */}
                    <div className={styles.cardOverlayContent}>
                      <h3 className={styles.cardTitle} title={resource.title}>
                        {resource.title}
                      </h3>
                      <p className={styles.cardDescription} title={resource.description}>
                        {resource.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className={styles.badgeCategory}
                          style={{
                            borderColor: `${catColor}30`,
                            backgroundColor: `${catColor}20`,
                            color: catColor,
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          {resource.category?.name || 'Uncategorized'}
                        </span>
                        <span 
                          className={`${styles.badgeStatus} ${
                            resource.status === 'Active' ? styles.badgeStatusActive : styles.badgeStatusHidden
                          }`}
                        >
                          {resource.status}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            /* Table Layout */
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Thumbnail</th>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Category</th>
                    <th className={styles.th}>Description</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Display Order</th>
                    <th className={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => {
                    const catColor = resource.category?.color || '#cbd5e1';
                    return (
                      <tr key={resource.id} className={styles.tr}>
                        <td className={styles.td}>
                          {resource.thumbnail ? (
                            <img 
                              src={resource.thumbnail} 
                              alt="" 
                              className={styles.tableThumbnail}
                            />
                          ) : (
                            <div 
                              className={`${styles.tableThumbnail} flex items-center justify-center font-bold text-[8px] uppercase tracking-wide`}
                              style={{
                                background: `linear-gradient(135deg, ${catColor}15 0%, ${catColor}30 100%)`,
                                color: catColor
                              }}
                            >
                              {resource.category?.name?.substring(0,2) || 'AS'}
                            </div>
                          )}
                        </td>
                        <td className={styles.td}>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text">{resource.title}</span>
                            {resource.favorite && (
                              <Star size={11} className="fill-[#F4C542] text-[#F4C542]" />
                            )}
                          </div>
                        </td>
                        <td className={styles.td}>
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
                        <td className={styles.td}>
                          <p className="max-w-[240px] truncate text-text-secondary" title={resource.description}>
                            {resource.description || '-'}
                          </p>
                        </td>
                        <td className={styles.td}>
                          <span 
                            className={`${styles.badgeStatus} ${
                              resource.status === 'Active' ? styles.badgeStatusActive : styles.badgeStatusHidden
                            }`}
                          >
                            {resource.status}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <span className="font-mono">{resource.display_order}</span>
                        </td>
                        <td className={styles.td}>
                          <div className={styles.tableActions}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.cardActionBtn}
                              title="Open Link"
                            >
                              <ExternalLink size={12} />
                            </a>
                            <button
                              onClick={() => handleCopyLink(resource.url, resource.id)}
                              className={styles.cardActionBtn}
                              title="Copy URL"
                            >
                              <Copy size={12} />
                            </button>
                            <button
                              onClick={() => handleToggleFavorite(resource)}
                              className={styles.cardActionBtn}
                              title="Toggle Pin"
                            >
                              <Star size={12} className={resource.favorite ? "fill-[#F4C542] text-[#F4C542]" : ""} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(resource)}
                              className={styles.cardActionBtn}
                              title={resource.status === 'Active' ? "Hide Resource" : "Show Resource"}
                            >
                              {resource.status === 'Active' ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                            <button
                              onClick={() => handleOpenEdit(resource)}
                              className={styles.cardActionBtn}
                              title="Edit Details"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleArchive(resource)}
                              className={styles.cardActionBtn}
                              title="Archive Details"
                            >
                              <Archive size={12} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(resource.id)}
                              className={styles.cardActionBtn}
                              title="Delete Link"
                            >
                              <Trash2 size={12} className="hover:text-rose-500" />
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

      {/* Add/Edit Resource Modal */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingResource ? `Edit ${portalName} Link` : `Add New ${portalName} Link`}
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className={styles.modalCloseBtn}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className={styles.formField}>
                <label className={styles.formLabel}>Resource Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Social Media Posters, Onboarding Folder..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  placeholder="Summarize what this resource contains..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                <label className={styles.formLabel}>Resource Category *</label>
                <input
                  type="text"
                  list="category-list"
                  placeholder="Type or select a category"
                  value={formData.category_name}
                  onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                  className={styles.formInput}
                  required
                />
                <datalist id="category-list">
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name} />
                  ))}
                </datalist>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })}
                    className={styles.formInput}
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Resource URL *</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Thumbnail Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className={styles.uploadPreviewContainer}>
                    <div className={styles.uploadLoader}>
                      <Loader2 className="animate-spin text-[#F4C542] w-6 h-6" />
                      <span className="text-[10px] text-text-secondary font-bold font-mono uppercase tracking-wider">Uploading asset...</span>
                    </div>
                  </div>
                ) : formData.thumbnail && !showUrlField ? (
                  <div className={styles.uploadPreviewContainer}>
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail Preview"
                      className={styles.uploadPreview}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail: '' })}
                      className={styles.uploadDeleteBtn}
                      title="Remove Image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : !showUrlField ? (
                  <div
                    className={`${styles.uploadZone} ${dragActive ? styles.uploadZoneActive : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className={styles.uploadIcon} />
                    <span className={styles.uploadText}>Drag & drop an image, or click to upload</span>
                    <span className={styles.uploadSubtext}>Supports PNG, JPG, WEBP, or GIF</span>
                  </div>
                ) : null}

                {showUrlField && (
                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      placeholder="https://image-path..."
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      className={styles.formInput}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowUrlField(!showUrlField)}
                  className={styles.urlInputToggle}
                >
                  {showUrlField ? "← Use drag-and-drop uploader" : "or paste an image URL instead"}
                </button>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Resource['status'] })}
                    className={styles.formInput}
                  >
                    <option value="Active">Active</option>
                    <option value="Hidden">Hidden</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center h-full">
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.favorite}
                      onChange={(e) => setFormData({ ...formData, favorite: e.target.checked })}
                      className={styles.checkboxInput}
                    />
                    Pin Favorite
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSave}
                >
                  Save Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle} style={{ color: 'var(--color-text)' }}>Confirm Deletion</h2>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className={styles.modalCloseBtn}
              >
                &times;
              </button>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed my-2">
              Are you sure you want to delete this resource link? This action is permanent and cannot be undone.
            </p>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className={styles.btnCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-full transition-all cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
