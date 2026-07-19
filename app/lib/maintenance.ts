/**
 * maintenance.ts
 *
 * Server-side utility functions for the Global Maintenance Management System.
 * Used by the proxy (middleware) layer to check maintenance status.
 *
 * Responsibilities:
 * - Fetches maintenance settings from Supabase
 * - Determines if full system or specific modules are under maintenance
 * - Maps URL paths to module keys
 */

import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export interface MaintenanceSetting {
  module_key: string;
  enabled: boolean;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Client Servicing sub-module keys (covered by the 'client_servicing' group)
// ─────────────────────────────────────────────────────────────────────────────
const CLIENT_SERVICING_MODULES = new Set([
  "acr", "bcr", "aca", "fund_switching", "fund_withdrawal",
  "reinstatement", "sro", "pdi", "cpst",
  // Additional CS routes that exist in the codebase
  "cpc", "fst", "mngt", "ppu", "csmv", "cv", "adat", "cgpt", "pptm",
  "jf_application", "jf_bizdev",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Path segment → module key mapping
// ─────────────────────────────────────────────────────────────────────────────
const PATH_TO_MODULE: Record<string, string> = {
  // Platform modules
  "dashboard": "dashboard",
  "calendar": "calendar",
  "attendance": "attendance",
  "messages": "messages",
  "faq": "faq",
  "teams": "teams",
  "members": "members",
  "users": "members",
  "profile": "profile",

  // Client Servicing modules
  "acr": "acr",
  "bcr": "bcr",
  "aca": "aca",
  "fund-switching": "fund_switching",
  "fund-withdrawal": "fund_withdrawal",
  "reinstatement-sro": "sro",
  "reinstatement-pdi": "pdi",
  "cpst": "cpst",
  "cpc": "cpc",
  "fst": "fst",
  "mngt": "mngt",
  "ppu": "ppu",
  "csmv": "csmv",
  "cv": "cv",
  "adat": "adat",
  "cgpt": "cgpt",
  "pptm": "pptm",
  "jf-application": "jf_application",
  "jf-bizdev": "jf_bizdev",
};

/**
 * Fetches all maintenance settings from Supabase.
 * Creates a one-off server client using the request cookies.
 */
export async function getMaintenanceSettings(
  request: NextRequest
): Promise<MaintenanceSetting[]> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op — we only read, never write cookies here
          },
        },
      }
    );

    const { data, error } = await supabase
      .from("maintenance_settings")
      .select("module_key, enabled, updated_at");

    if (error) {
      console.error("Failed to fetch maintenance settings:", error);
      return [];
    }

    return (data ?? []) as MaintenanceSetting[];
  } catch (err) {
    console.error("Maintenance settings fetch error:", err);
    return [];
  }
}

/**
 * Returns true if full-system maintenance is enabled.
 */
export function isFullMaintenance(settings: MaintenanceSetting[]): boolean {
  const full = settings.find((s) => s.module_key === "full_system");
  return full?.enabled === true;
}

/**
 * Returns true if a specific module is under maintenance.
 * Also checks the parent 'client_servicing' group for CS sub-modules.
 */
export function isModuleMaintenance(
  settings: MaintenanceSetting[],
  moduleKey: string
): boolean {
  // Direct module check
  const mod = settings.find((s) => s.module_key === moduleKey);
  if (mod?.enabled === true) return true;

  // If this is a Client Servicing sub-module, also check the group toggle
  if (CLIENT_SERVICING_MODULES.has(moduleKey)) {
    const group = settings.find((s) => s.module_key === "client_servicing");
    if (group?.enabled === true) return true;
  }

  return false;
}

/**
 * Extracts the module key from a URL pathname.
 * Returns null if the path doesn't map to any module.
 *
 * Handles both admin and user routes:
 *   /admin/calendar → "calendar"
 *   /calendar       → "calendar"
 *   /admin/acr      → "acr"
 */
export function getModuleKeyFromPath(pathname: string): string | null {
  // Normalize: strip leading slash, split into segments
  const segments = pathname.replace(/^\//, "").split("/");

  // For admin routes: /admin/[module]/...
  if (segments[0] === "admin" && segments.length >= 2) {
    const moduleSegment = segments[1];
    return PATH_TO_MODULE[moduleSegment] ?? null;
  }

  // For user routes: /[module]/...
  if (segments.length >= 1) {
    const moduleSegment = segments[0];
    return PATH_TO_MODULE[moduleSegment] ?? null;
  }

  return null;
}

/**
 * Paths that should NEVER be blocked by maintenance, even during full-system mode.
 */
export function isExemptPath(pathname: string): boolean {
  const exemptions = [
    "/admin/settings",
    "/auth",
    "/maintenance",
    "/api",
    "/_next",
    "/favicon",
  ];

  return exemptions.some((exempt) => pathname.startsWith(exempt));
}

/**
 * Returns a human-readable label for a module key (used in maintenance pages).
 */
export const MODULE_LABELS: Record<string, string> = {
  full_system: "Full System",
  dashboard: "Dashboard",
  calendar: "Calendar",
  attendance: "Attendance",
  messages: "Messages",
  faq: "FAQ",
  teams: "Teams",
  members: "Members",
  profile: "Profile",
  client_servicing: "Client Servicing",
  acr: "ACR",
  bcr: "BCR",
  aca: "ACA",
  fund_switching: "Fund Switching",
  fund_withdrawal: "Fund Withdrawal",
  reinstatement: "Reinstatement",
  sro: "SRO",
  pdi: "PDI",
  cpst: "CPST",
  cpc: "CPC",
  fst: "FST",
  mngt: "MNGT",
  ppu: "PPU",
  csmv: "CSMV",
  cv: "CV",
  adat: "ADAT",
  cgpt: "CGPT",
  pptm: "PPTM",
  jf_application: "JF Application",
  jf_bizdev: "JF BizDev",
};
