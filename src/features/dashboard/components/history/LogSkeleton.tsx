import React from 'react';

export default function LogSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-surface rounded-2xl border border-border/70 p-5 shadow-xs flex flex-col gap-4"
        >
          {/* Header skeleton */}
          <div className="flex items-center justify-between pb-3.5 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-6 bg-surface-2 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <div className="w-40 h-4 bg-surface-2 rounded-md" />
                <div className="w-24 h-3 bg-surface-2 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-6 bg-surface-2 rounded-full" />
              <div className="w-14 h-6 bg-surface-2 rounded-full" />
            </div>
          </div>

          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex flex-col gap-1.5">
                <div className="w-16 h-2.5 bg-surface-2 rounded-sm" />
                <div className="w-28 h-4 bg-surface-2 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
