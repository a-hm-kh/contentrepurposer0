import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LibraryList } from "@/components/library/LibraryList";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "My library",
  description: "Every bundle you saved, ready to reopen, edit and copy again.",
};

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/library");

  return (
    <DashboardShell
      active="/dashboard/library"
      title="My library"
      description="Everything you saved stays here — reopen a bundle, copy a piece again, or remove what you no longer need."
    >
      <LibraryList />
    </DashboardShell>
  );
}
