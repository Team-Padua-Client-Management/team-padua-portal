import { createClient } from "./supabase/server";

export type ClientServicingModule = "cpst" | "acr" | "fst" | "cpc" | "ppu" | "mngt" | "csmv" | "bcr" | "aca" | "sro" | "pdi" | "form" | "fw" | "ada";
export type PermissionAction = "view" | "create" | "edit" | "delete" | "export";

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export type ClientServicingPermissions = Record<ClientServicingModule, ModulePermissions>;

export const defaultModulePermissions: ModulePermissions = {
  view: false,
  create: false,
  edit: false,
  delete: false,
  export: false,
};

export const defaultClientServicingPermissions: ClientServicingPermissions = {
  cpst: { ...defaultModulePermissions },
  acr: { ...defaultModulePermissions },
  fst: { ...defaultModulePermissions },
  cpc: { ...defaultModulePermissions },
  ppu: { ...defaultModulePermissions },
  mngt: { ...defaultModulePermissions },
  csmv: { ...defaultModulePermissions },
  bcr: { ...defaultModulePermissions },
  aca: { ...defaultModulePermissions },
  sro: { ...defaultModulePermissions },
  pdi: { ...defaultModulePermissions },
  form: { ...defaultModulePermissions },
  fw: { ...defaultModulePermissions },
  ada: { ...defaultModulePermissions },
};

/**
 * Maps URL pathnames to their corresponding permission module keys.
 * Used by middleware and page-level guards.
 */
export const routeToModuleKey: Record<string, ClientServicingModule> = {
  "/admin/acr": "acr",
  "/admin/bcr": "bcr",
  "/admin/fund-switching": "fst",
  "/admin/fund-withdrawal": "fw",
  "/admin/aca": "aca",
  "/admin/ada": "ada",
  "/admin/adat": "ada",
  "/admin/reinstatement-sro": "sro",
  "/admin/reinstatement-pdi": "pdi",
  "/admin/cpst": "cpst",
  "/admin/csmv": "csmv",
  "/admin/form": "form",
  "/admin/mngt": "mngt",
  "/admin/cpc": "cpc",
  "/admin/ppu": "ppu",
  "/admin/pptm": "mngt",
  "/admin/cv": "csmv",
  "/admin/fst": "fst",
  "/admin/cgpt": "cpst",
  "/admin/jf-application": "form",
  "/admin/jf-bizdev": "form",
};

/**
 * Checks if a given pathname is a Client Servicing route.
 */
export function isClientServicingRoute(pathname: string): boolean {
  const basePath = pathname.replace(/\/$/, "");
  return basePath in routeToModuleKey;
}

/**
 * Resolves the module key for a given pathname, handling trailing slashes.
 */
export function getModuleKeyForRoute(pathname: string): ClientServicingModule | null {
  const basePath = pathname.replace(/\/$/, "");
  return routeToModuleKey[basePath] ?? null;
}

/**
 * Returns true if the role is automatically granted full Client Servicing access
 * without needing explicit permission assignment.
 */
export function hasAutomaticAccess(role: string | null): boolean {
  return role === "Admin" || role === "Advisor";
}

/**
 * Fetches the current user profile from the database (server-side only).
 */
export async function getCurrentProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
    
  return profile;
}

/**
 * Validates if the current user has access to a specific module and action.
 * Admin and Advisor roles bypass all permission checks.
 */
export async function canAccessModule(
  module: ClientServicingModule,
  action: PermissionAction = "view"
): Promise<boolean> {
  const profile = await getCurrentProfile();
  
  if (!profile) return false;
  
  // Admin and Advisor bypass permission checks
  if (hasAutomaticAccess(profile.role)) return true;

  const permissions = profile.client_servicing_permissions as ClientServicingPermissions;
  
  if (!permissions || !permissions[module]) return false;
  
  return permissions[module][action] === true;
}

/**
 * Checks if a user profile has view access to a specific module.
 * Used by middleware where the profile is already fetched.
 */
export function hasModuleViewAccess(
  role: string | null,
  moduleKey: ClientServicingModule,
  permissions: ClientServicingPermissions | null | undefined
): boolean {
  if (hasAutomaticAccess(role)) return true;
  if (!permissions || !permissions[moduleKey]) return false;
  return permissions[moduleKey].view === true;
}
