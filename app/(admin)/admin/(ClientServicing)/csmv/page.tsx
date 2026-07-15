import { redirect } from "next/navigation";
import { canAccessModule } from "@/app/lib/permissions";
import CSMVClient from "./CSMVClient";

export default async function CSMVPage() {
  // Use a generic or specific permission identifier if available.
  // Assuming 'csmv' is the correct module ID in the DB.
  const canView = await canAccessModule("csmv", "view");

  if (!canView) {
    redirect("/403");
  }

  const canCreate = await canAccessModule("csmv", "create");
  const canEdit = await canAccessModule("csmv", "edit");
  const canDelete = await canAccessModule("csmv", "delete");

  return (
    <CSMVClient
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
    />
  );
}
