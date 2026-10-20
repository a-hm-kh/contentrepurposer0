import { NextResponse } from "next/server";

import { ANONYMOUS_UID_COOKIE, getUid, newUid, uidCookieOptions } from "@/lib/store";
import { resolveQuota } from "@/lib/utils/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function upgradeUrl(): string | null {
  return process.env.NEXT_PUBLIC_PRO_URL?.trim() || "/dashboard/billing";
}

/** Returns the current visitor's quota status (and sets an id cookie). */
export async function GET(req: Request) {
  const existing = getUid(req);
  const uid = existing ?? newUid();

  const quota = await resolveQuota(uid);

  const res = NextResponse.json({
    ok: true,
    usage: quota
      ? {
          used: quota.used,
          limit: quota.limit,
          remaining: quota.remaining,
          exhausted: quota.exhausted,
          plan: quota.plan,
          scope: quota.scope,
          canGenerate: quota.canGenerate,
          canModify: quota.canModify,
          modificationsUsed: quota.modificationsUsed,
          modificationsLimit: quota.modificationsLimit,
          modificationsRemaining: quota.modificationsRemaining,
          resetsAt: quota.resetsAt,
          upgradeUrl: upgradeUrl(),
        }
      : null,
  });

  if (!existing) {
    res.cookies.set(ANONYMOUS_UID_COOKIE, uid, uidCookieOptions(req));
  }

  return res;
}
