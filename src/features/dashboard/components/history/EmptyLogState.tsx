import React from 'react';
import { SearchX, RotateCcw, FolderSearch } from 'lucide-react';

interface EmptyLogStateProps {
  hasFilters: boolean;
  onResetFilters: () => void;
  tabLabel: string;
}

export default function EmptyLogState({
  hasFilters,
  onResetFilters,
  tabLabel,
}: EmptyLogStateProps) {
  return (
    <div className="bg-surface rounded-2xl border border-border/80 p-12 text-center flex flex-col items-center justify-center gap-3.5 shadow-xs transition-all">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 flex items-center justify-center mb-1">
        {hasFilters ? <SearchX size={28} strokeWidth={2} /> : <FolderSearch size={28} strokeWidth={2} />}
      </div>

      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-base font-bold text-text m-0">
          {hasFilters ? 'No matching logs found' : `No ${tabLabel.toLowerCase()} logged yet`}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed m-0">
          {hasFilters
            ? 'We couldn’t find any records matching your search or filter criteria. Try adjusting your search term or clearing the active filters.'
            : `There are currently no records available in ${tabLabel.toLowerCase()}. New logs will appear here automatically.`}
        </p>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 hover:bg-amber-100 hover:border-amber-400 dark:hover:bg-amber-900/50 transition-all cursor-pointer shadow-2xs"
        >
          <RotateCcw size={13} strokeWidth={2.2} />
          <span>Reset All Filters</span>
        </button>
      )}
    </div>
  );
}
