import { NextResponse } from "next/server";

import {
  ANONYMOUS_UID_COOKIE,
  getUid,
  getUsage,
  newUid,
  uidCookieOptions,
} from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the current visitor's free-quota status (and sets an id cookie). */
export async function GET(req: Request) {
  const existing = getUid(req);
  const uid = existing ?? newUid();

  const usage = await getUsage(uid);
  const res = NextResponse.json({ ok: true, usage });

  if (!existing) {
    res.cookies.set(ANONYMOUS_UID_COOKIE, uid, uidCookieOptions(req));
  }

  return res;
}
