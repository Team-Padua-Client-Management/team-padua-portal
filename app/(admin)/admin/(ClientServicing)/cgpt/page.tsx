import CGPTClient from "@src/features/client-servicing/cgpt/CGPTClient";

export default function CGPTPage() {
  return (
    <CGPTClient
      canCreate={true}
      canEdit={true}
      canDelete={true}
      canExport={true}
    />
  );
}
