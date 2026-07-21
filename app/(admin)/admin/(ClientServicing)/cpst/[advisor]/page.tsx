// import { redirect } from "next/navigation";
// import { canAccessModule } from "@/app/lib/permissions";
// import CPSTClient from "../CPSTClient";

// export default async function CPSTAdvisorClientsPage({
//     params,
// }: {
//     params: { advisor: string };
// }) {
//     const canView = await canAccessModule("cpst", "view");
//     if (!canView) redirect("/403");

//     const advisorName = decodeURIComponent(params.advisor);

//     const canCreate = await canAccessModule("cpst", "create");
//     const canEdit = await canAccessModule("cpst", "edit");
//     const canDelete = await canAccessModule("cpst", "delete");
//     const canExport = await canAccessModule("cpst", "export");

//     return (
//         <CPSTClient
//             advisorName={advisorName}
//             canCreate={canCreate}
//             canEdit={canEdit}
//             canDelete={canDelete}
//             canExport={canExport}
//         />
//     );
// }