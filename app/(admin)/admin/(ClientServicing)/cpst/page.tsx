import { redirect } from "next/navigation";
import { canAccessModule } from "@src/lib/permissions";
import CPSTClient from "@src/features/client-servicing/cpst/CPSTClient";

export default async function CPSTPage() {
  const canView = await canAccessModule("cpst", "view");

  if (!canView) {
    redirect("/403");
  }

  const canCreate = await canAccessModule("cpst", "create");
  const canEdit = await canAccessModule("cpst", "edit");
  const canDelete = await canAccessModule("cpst", "delete");
  const canExport = await canAccessModule("cpst", "export");

  return (
    <CPSTClient
      canCreate={canCreate}
      canEdit={canEdit}
      canDelete={canDelete}
      canExport={canExport}
    />
  );
}



