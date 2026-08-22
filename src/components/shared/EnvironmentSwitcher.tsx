'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Server, Globe } from 'lucide-react';
import { getProductionUrl, getLocalUrl, isLocalEnvironment } from '@src/lib/getSiteUrl';

interface EnvironmentSwitcherProps {
  compact?: boolean;
}

export default function EnvironmentSwitcher({ compact = false }: EnvironmentSwitcherProps) {
  const [mounted, setMounted] = useState(false);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLocal(isLocalEnvironment());
  }, []);

  if (!mounted) return null;

  const targetUrl = isLocal ? getProductionUrl() : getLocalUrl();
  const targetLabel = isLocal ? 'Production' : 'Local Dev';

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] font-semibold">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
            isLocal
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/20'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/20'
          }`}
          title={isLocal ? 'Running in Local Development Environment' : 'Running in Production Environment'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLocal ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
          {isLocal ? 'Local' : 'Prod'}
        </span>

        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/60 bg-surface/80 hover:bg-surface text-text-secondary hover:text-text transition-all"
          title={`Launch ${targetLabel} Portal in new tab`}
        >
          <span>{targetLabel}</span>
          <ExternalLink size={10} strokeWidth={2} />
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/70 bg-surface/60 backdrop-blur-sm text-xs font-semibold">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isLocal ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
        <span className="text-text-secondary">
          Env: <strong className="text-text">{isLocal ? 'Local Dev (localhost:3000)' : 'Production'}</strong>
        </span>
      </div>

      <div className="w-[1px] h-3.5 bg-border/60 mx-0.5" />

      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold shadow-sm transition-all scale-[1.01] hover:scale-[1.03]"
        title={`Access ${targetLabel} environment directly`}
      >
        {isLocal ? <Globe size={12} strokeWidth={2.2} /> : <Server size={12} strokeWidth={2.2} />}
        <span>Access {targetLabel}</span>
        <ExternalLink size={11} strokeWidth={2.2} />
      </a>
    </div>
  );
}
