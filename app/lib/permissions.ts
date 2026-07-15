import { createClient } from "./supabase/server";

export type ClientServicingModule = "cpst" | "acr" | "fst" | "cpc" | "ppu" | "mngt" | "csmv" | "bcr" | "aca" | "sro" | "pdi";
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
};

/**
 * Fetches the current user profile from the database
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
 * Validates if the current user has access to a specific module and action
 */
export async function canAccessModule(
  module: ClientServicingModule,
  action: PermissionAction = "view"
): Promise<boolean> {
  const profile = await getCurrentProfile();
  
  if (!profile) return false;
  
  // Administrators bypass permission checks
  if (profile.role === "Admin") return true;

  const permissions = profile.client_servicing_permissions as ClientServicingPermissions;
  
  if (!permissions || !permissions[module]) return false;
  
  return permissions[module][action] === true;
}
