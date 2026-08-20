"use client";

import React, { useEffect, useState } from "react";
import { UserSidebar } from "@src/components/layout";
import { UserHeader } from "@src/components/layout";
import styles from "@/styles/layouts/user/layout.module.css";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.pageShell}>
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.contentShell}>
        <UserHeader onMenuClick={() => setSidebarOpen(true)} isSidebarOpen={sidebarOpen} />
        <main className={styles.contentMain}>{children}</main>
      </div>
    </div>
  );
}


