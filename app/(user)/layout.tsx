"use client";

import React, { useEffect, useState } from "react";
import UserSidebar from "@/app/components/user/UserSidebar";
import UserHeader from "@/app/components/user/UserHeader";
import styles from "@/styles/layouts/user/layout.module.css";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ theme?: string }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      }
    };

    window.addEventListener("theme-change", handleThemeChange);

    // Maintenance Check
    const checkMaintenance = () => {
      setIsMaintenance(localStorage.getItem("site_maintenance") === "1");
    };
    checkMaintenance();
    window.addEventListener("maintenance-mode-change", checkMaintenance);

    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
      window.removeEventListener("maintenance-mode-change", checkMaintenance);
    };
  }, []);

  const isDarkTheme = ["dark", "midnight", "forest", "sunset", "slate"].includes(theme);

  if (isMaintenance) {
    return (
      <div className={isDarkTheme ? "dark" : ""} data-theme={theme}>
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">System Maintenance</h1>
          <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
            We are currently performing scheduled maintenance to improve our systems. 
            Certain features, including access to the user portal, are temporarily unavailable.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
          >
            Check Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkTheme ? "dark" : ""} data-theme={theme}>
      <div className={styles.pageShell}>
        <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={styles.contentShell}>
          <UserHeader onMenuClick={() => setSidebarOpen(true)} isSidebarOpen={sidebarOpen} />
          <main className={styles.contentMain}>{children}</main>
        </div>
      </div>
    </div>
  );
}
