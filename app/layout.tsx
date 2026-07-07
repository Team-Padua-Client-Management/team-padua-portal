/**
 * layout.tsx
 *
 * Main component module in features path: app/layout.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

import styles from "@/styles/layouts/root/layout.module.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "@/styles/globals/globals.css";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Team Padua",
  description: "A website for Team Padua, a competitive programming team.",
  icons: {
    icon: [
      { url: "/Image/Tp.png", type: "image/png" },
    ],
    apple: "/Image/Tp.png",
  },
};

/**
 * RootLayout
 *
 * Renders the RootLayout interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for RootLayout.
 *
 * @param {
  children,
}: {
  children: React.ReactNode;
}
 * @returns State operations sequence.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)}
      suppressHydrationWarning
    >
      <head />
      <body className={styles.text_0}>
        {children}
      </body>
    </html>
  );
}
