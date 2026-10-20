import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { getUid } from "@/lib/store";
import { mergeAnonymousUsage, resolveQuota } from "@/lib/utils/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Called once from the dashboard after sign-in.
 *
 * Merges the visitor's anonymous free usage onto their account so that signing
 * in cannot be used to farm a second set of free generations. Idempotent.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const anonymousId = getUid(req);
  if (anonymousId) {
    try {
      await mergeAnonymousUsage(session.user.id, anonymousId);
    } catch (err) {
      console.error("[api/auth/merge] failed to merge anonymous usage:", err);
    }
  }

  return NextResponse.json({ ok: true, quota: await resolveQuota(anonymousId) });
}
