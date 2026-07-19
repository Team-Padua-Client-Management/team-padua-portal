"use client";

import React, { useEffect, useState } from "react";
import UserSidebar from "@/app/components/user/UserSidebar";
import UserHeader from "@/app/components/user/UserHeader";
import styles from "@/styles/layouts/user/layout.module.css";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");

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

    return () => {
      window.removeEventListener("theme-change", handleThemeChange);
    };
  }, []);

  const isDarkTheme = ["dark", "midnight", "forest", "sunset", "slate"].includes(theme);

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

