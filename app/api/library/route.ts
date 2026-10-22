import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The private content library.
 *
 * Saving a piece points a `SavedItem` at the stored `Generation`, so the
 * library never duplicates content — it just marks it as kept. Only the row's
 * owner can read or delete their items, and generation lookups are always
 * scoped to the requesting user.
 */

const LIST_LIMIT = 100;

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  const items = await prisma.savedItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    include: {
      // `SavedItem.generationId` is a plain column (no relation), so we fetch
      // the generations separately below to keep the schema flexible.
    },
  });

  const generationIds = items.map((item) => item.generationId);
  const generations = generationIds.length
    ? await prisma.generation.findMany({
        where: { id: { in: generationIds }, userId },
        select: {
          id: true,
          language: true,
          tone: true,
          inputType: true,
          linkedinPost: true,
          twitterThread: true,
          instagramCaption: true,
          facebookPost: true,
          hooks: true,
          cta: true,
          newsletter: true,
          carousel: true,
          blogArticle: true,
          hashtags: true,
          inputText: true,
          createdAt: true,
        },
      })
    : [];

  const byId = new Map(generations.map((gen) => [gen.id, gen]));

  const library = items
    .map((item) => {
      const gen = byId.get(item.generationId);
      if (!gen) return null;
      return {
        savedId: item.id,
        title: item.title,
        kind: item.kind,
        savedAt: item.createdAt,
        generationId: gen.id,
        language: gen.language,
        tone: gen.tone,
        inputType: gen.inputType,
        createdAt: gen.createdAt,
        preview: gen.linkedinPost?.slice(0, 180) ?? "",
        inputPreview: gen.inputText.slice(0, 180),
        data: {
          linkedin: gen.linkedinPost,
          twitter_thread: gen.twitterThread,
          instagram: gen.instagramCaption,
          facebook: gen.facebookPost,
          hooks: gen.hooks,
          cta: gen.cta,
          newsletter: gen.newsletter,
          carousel: gen.carousel,
          blogArticle: gen.blogArticle,
          hashtags: gen.hashtags,
        },
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return NextResponse.json(
    { ok: true as const, items: library },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Please sign in to save to your library." }, { status: 401 });
  }

  let body: { generationId?: unknown; title?: unknown; kind?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Could not read the request." }, { status: 400 });
  }

  const generationId = typeof body.generationId === "string" ? body.generationId.trim() : "";
  if (!generationId) {
    return NextResponse.json({ ok: false, error: "Missing the item to save." }, { status: 400 });
  }

  // Ownership check — a user can only save their own generations.
  const owned = await prisma.generation.findFirst({
    where: { id: generationId, userId },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ ok: false, error: "That item was not found." }, { status: 404 });
  }

  const title =
    typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 120) : null;
  const kind = typeof body.kind === "string" && body.kind.trim() ? body.kind.trim().slice(0, 24) : "bundle";

  const saved = await prisma.savedItem.upsert({
    where: { userId_generationId: { userId, generationId } },
    create: { userId, generationId, title, kind },
    update: { title },
  });

  return NextResponse.json(
    { ok: true as const, savedId: saved.id },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing the item to remove." }, { status: 400 });
  }

  // Scoped delete: the where clause includes userId so nobody can delete
  // another user's saved item even if they guess the id.
  const result = await prisma.savedItem.deleteMany({ where: { id, userId } });

  if (result.count === 0) {
    return NextResponse.json({ ok: false, error: "That item was not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true as const }, { headers: { "Cache-Control": "no-store" } });
}
