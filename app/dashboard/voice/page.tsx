import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VoiceEditor } from "@/components/voice/VoiceEditor";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "Brand voice",
  description: "Teach the engine how you write, so every result sounds like you.",
};

export default async function VoicePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/voice");

  return (
    <DashboardShell
      active="/dashboard/voice"
      title="Brand voice"
      description="Describe how you write once — every future generation follows it. This is what makes the output sound like a person, not a template."
    >
      <VoiceEditor />
    </DashboardShell>
  );
}
