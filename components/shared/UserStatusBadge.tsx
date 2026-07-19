import React from 'react';

interface UserStatusBadgeProps {
  status: "online" | "busy" | "offline";
}

export default function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const normalizedStatus = (status || "offline").toLowerCase() as "online" | "busy" | "offline";

  const config = {
    online: {
      color: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      label: "Online",
    },
    busy: {
      color: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      label: "Busy",
    },
    offline: {
      color: "bg-slate-500",
      text: "text-slate-700 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
      label: "Offline",
    },
  };

  const current = config[normalizedStatus] || config.offline;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border tracking-wide ${current.text}`}>
      <span className={`w-2 h-2 rounded-full ${current.color}`} />
      {current.label}
    </span>
  );
}
