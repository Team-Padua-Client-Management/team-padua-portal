"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function MaintenanceOverlay() {
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const read = () => !!localStorage.getItem("site_maintenance");
    setEnabled(read());

    const onChange = () => setEnabled(read());
    window.addEventListener("storage", onChange);
    window.addEventListener("maintenance-mode-change", onChange as EventListener);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener("maintenance-mode-change", onChange as EventListener);
    };
  }, []);

  if (!enabled) return null;

  const disable = () => {
    if (!confirm("Disable maintenance mode?")) return;
    localStorage.removeItem("site_maintenance");
    window.dispatchEvent(new CustomEvent("maintenance-mode-change"));
    setEnabled(false);
  };

  // Allow admins to disable from /admin routes
  const showAdminControls = pathname?.startsWith("/admin") ?? false;

  return (
    <div style={{ zIndex: 99999 }} className="fixed inset-0 flex items-center justify-center bg-white/95 dark:bg-black/95 p-6">
      <div className="max-w-xl text-center">
        <h2 className="text-2xl font-bold mb-2">System Maintenance</h2>
        <p className="mb-4 text-muted-foreground">The system is currently undergoing maintenance. Please try again later.</p>
        {showAdminControls ? (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={disable}
              className="px-4 py-2 bg-[#F4C542] text-black rounded font-semibold"
            >
              Disable Maintenance
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
