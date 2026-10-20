import { NextResponse } from "next/server";
import { trackVisit } from "@/lib/analytics/tracker";

export async function POST() {
  try {
    await trackVisit();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
