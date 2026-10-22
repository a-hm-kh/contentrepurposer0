import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { getBrandVoice, saveBrandVoice, VOICE_FIELD_MAX } from "@/lib/utils/brand-voice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the signed-in user's saved brand voice, or nulls when unset. */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  const voice = await getBrandVoice(userId);
  return NextResponse.json(
    {
      ok: true as const,
      voice: voice ?? {
        about: null,
        audience: null,
        likedWords: null,
        bannedWords: null,
        samples: null,
        updatedAt: null,
      },
      maxLength: VOICE_FIELD_MAX,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Creates or updates the signed-in user's brand voice. */
export async function PUT(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the request." }, { status: 400 });
  }

  try {
    const voice = await saveBrandVoice(userId, {
      about: body.about,
      audience: body.audience,
      likedWords: body.likedWords,
      bannedWords: body.bannedWords,
      samples: body.samples,
    });

    return NextResponse.json({ ok: true as const, voice }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[api/brand-voice] failed to save:", err);
    return NextResponse.json(
      { ok: false, error: "Could not save your voice settings. Please try again." },
      { status: 500 },
    );
  }
}
