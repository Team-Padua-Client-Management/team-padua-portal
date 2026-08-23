import React from 'react';
import { CategoryMeta } from './types';

interface LogGroupHeaderProps {
  meta: CategoryMeta;
  count: number;
  unitLabel?: string;
}

export default function LogGroupHeader({
  meta,
  count,
  unitLabel,
}: LogGroupHeaderProps) {
  const itemLabel = unitLabel
    ? count === 1 ? unitLabel : `${unitLabel}s`
    : count === 1 ? 'record' : 'records';

  const badgeCode = meta.badge ? `${meta.badge} -` : '';

  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-white dark:bg-surface rounded-xl border border-slate-200/80 dark:border-border/80 shadow-2xs transition-all"
      style={{
        borderLeft: '5px solid #7C3AED',
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {badgeCode && (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-black tracking-wide uppercase bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 shrink-0">
            {badgeCode}
          </span>
        )}
        <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white truncate m-0 leading-tight">
          {meta.title}
        </h3>
      </div>

      <div className="shrink-0 ml-3">
        <span className="px-3 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200/60 dark:border-slate-700/60">
          {count} {itemLabel}
        </span>
      </div>
    </div>
  );
}
