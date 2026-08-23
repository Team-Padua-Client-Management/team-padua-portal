'use client';

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Zap, Columns2, Target, GripVertical } from 'lucide-react';
import styles from '@/styles/admin/dashboard/page.module.css';

export type DashboardLayoutMode = 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4';

export interface DashboardLayoutSwitcherProps {
  currentLayout: DashboardLayoutMode;
  onSelectLayout: (layout: DashboardLayoutMode) => void;
}

interface LayoutOption {
  id: DashboardLayoutMode;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  badge: string;
}

const BASE_OPTIONS: LayoutOption[] = [
  {
    id: 'layout-1',
    label: 'Layout 1',
    sublabel: 'Default / Balanced',
    icon: LayoutGrid,
    badge: 'DEFAULT',
  },
  {
    id: 'layout-2',
    label: 'Layout 2',
    sublabel: 'Action-First',
    icon: Zap,
    badge: 'LAUNCHPAD',
  },
  {
    id: 'layout-3',
    label: 'Layout 3',
    sublabel: 'Workflow-Grouped',
    icon: Columns2,
    badge: 'DUAL COCKPIT',
  },
  {
    id: 'layout-4',
    label: 'Layout 4',
    sublabel: 'Compact Overview',
    icon: Target,
    badge: 'FOCUS',
  },
];

const ORDER_KEY = 'team_padua_layout_order';

function loadOrder(): DashboardLayoutMode[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (raw) {
      const parsed: DashboardLayoutMode[] = JSON.parse(raw);
      const validIds = BASE_OPTIONS.map((o) => o.id);
      if (
        parsed.length === validIds.length &&
        parsed.every((id) => validIds.includes(id)) &&
        validIds.every((id) => parsed.includes(id))
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return BASE_OPTIONS.map((o) => o.id);
}

function saveOrder(order: DashboardLayoutMode[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // ignore
  }
}

export default function DashboardLayoutSwitcher({
  currentLayout,
  onSelectLayout,
}: DashboardLayoutSwitcherProps) {
  const [order, setOrder] = useState<DashboardLayoutMode[]>(() =>
    BASE_OPTIONS.map((o) => o.id)
  );
  const [hoveredId, setHoveredId] = useState<DashboardLayoutMode | null>(null);
  const [draggedId, setDraggedId] = useState<DashboardLayoutMode | null>(null);
  const [dragOverId, setDragOverId] = useState<DashboardLayoutMode | null>(null);

  // Load persisted order after mount (avoids SSR mismatch)
  useEffect(() => {
    setOrder(loadOrder());
  }, []);

  const orderedOptions = order
    .map((id) => BASE_OPTIONS.find((o) => o.id === id)!)
    .filter(Boolean);

  const handleDragStart = (e: React.DragEvent, id: DashboardLayoutMode) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: DashboardLayoutMode) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== draggedId) setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: DashboardLayoutMode) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const next = [...order];
    const fromIdx = next.indexOf(draggedId);
    const toIdx = next.indexOf(targetId);
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, draggedId);
    setOrder(next);
    saveOrder(next);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className={styles.layoutSwitcherBar}>
      <div className="flex items-center gap-2">
        <span className={styles.layoutSwitcherLabel}>Dashboard Layout:</span>
      </div>

      <div className={styles.layoutSwitcherPills}>
        {orderedOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = currentLayout === opt.id;
          const isHovered = hoveredId === opt.id;
          const isDragging = draggedId === opt.id;
          const isDragOver = dragOverId === opt.id;
          // Expand on hover only; active keeps amber highlight but stays compact
          const isExpanded = isHovered;

          return (
            <button
              key={opt.id}
              type="button"
              draggable
              onDragStart={(e) => handleDragStart(e, opt.id)}
              onDragOver={(e) => handleDragOver(e, opt.id)}
              onDrop={(e) => handleDrop(e, opt.id)}
              onDragEnd={handleDragEnd}
              onMouseEnter={() => setHoveredId(opt.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectLayout(opt.id)}
              title={`${opt.label} — ${opt.sublabel} · ${opt.badge}`}
              className={[
                styles.layoutSwitcherPill,
                isActive ? styles.layoutSwitcherPillActive : '',
                isExpanded ? styles.layoutSwitcherPillExpanded : '',
                isDragging ? styles.layoutSwitcherPillDragging : '',
                isDragOver ? styles.layoutSwitcherPillDragOver : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* Grip — visible only when expanded */}
              <GripVertical
                size={11}
                strokeWidth={2}
                className={styles.layoutSwitcherGrip}
              />

              {/* Icon — always visible, amber when active */}
              <Icon
                size={14}
                strokeWidth={2.2}
                className={
                  isActive
                    ? styles.layoutSwitcherPillIconActive
                    : styles.layoutSwitcherPillIcon
                }
              />

              {/* Label area — slides in on hover */}
              <span className={styles.layoutSwitcherPillLabel}>
                <span className={styles.layoutSwitcherPillLabelName}>
                  {opt.label}
                </span>
                <span className={styles.layoutSwitcherPillLabelSub}>
                  · {opt.sublabel}
                </span>
                <span
                  className={[
                    styles.layoutSwitcherPillBadge,
                    isActive ? styles.layoutSwitcherPillBadgeActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {opt.badge}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
