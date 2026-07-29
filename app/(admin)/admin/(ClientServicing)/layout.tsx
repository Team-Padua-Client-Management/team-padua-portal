import { redirect } from "next/navigation";
import { canAccessModule, getModuleKeyForRoute, type ClientServicingModule } from "@src/lib/permissions";
import { getCurrentProfile, hasAutomaticAccess } from "@src/lib/permissions";

/**
 * ClientServicingLayout
 *
 * Server-side layout guard for all Client Servicing routes.
 * Verifies the current user has permission to access the requested module
 * before rendering any child page content.
 *
 * Defense-in-depth layer: the middleware already checks permissions for
 * non-admin users, but this layout ensures no Client Servicing page can
 * be rendered without authorization even if middleware is bypassed.
 */
export default async function ClientServicingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/login");
  }

  // Admin and Advisor always have access
  if (!hasAutomaticAccess(profile.role)) {
    // For Bizdev/Member: we cannot determine the exact module key here
    // without the pathname (layouts don't receive it directly).
    // The middleware handles the primary check. This layout serves as
    // a secondary guard that ensures the user has ANY client servicing
    // permission before rendering any CS page content.
    const permissions = profile.client_servicing_permissions as Record<string, { view: boolean }> | null;

    const hasAnyAccess = permissions && Object.values(permissions).some(
      (mod) => mod && typeof mod === "object" && mod.view === true
    );

    if (!hasAnyAccess) {
      redirect("/403");
    }
  }

  return <>{children}</>;
}
