import type { ReactElement } from "react";

import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons";
import type { RepurposedContent } from "@/lib/types";

export type PlatformId = "linkedin" | "twitter_thread" | "instagram" | "facebook";

export interface PlatformMeta {
  id: PlatformId;
  /** Full platform name, e.g. "LinkedIn Post". */
  label: string;
  /** Short name for tab-like UI, e.g. "LinkedIn". */
  short: string;
  /** Where the copy ends up. */
  destination: string;
  tagline: string;
  description: string;
  /** Tailwind classes for the icon tile. */
  tile: string;
  /** Tailwind class for the icon glyph. */
  glyph: string;
  Icon: (props: { className?: string }) => ReactElement;
}

export const PLATFORMS: Record<PlatformId, PlatformMeta> = {
  linkedin: {
    id: "linkedin",
    label: "LinkedIn Post",
    short: "LinkedIn",
    destination: "Professional feed · 1,300+ words available",
    tagline: "Authority-building post",
    description:
      "A scroll-stopping hook, short scannable paragraphs, and a closing question that invites comments.",
    tile: "bg-[#0A66C2]/10",
    glyph: "text-[#0A66C2]",
    Icon: (props) => <LinkedInIcon {...props} />,
  },
  twitter_thread: {
    id: "twitter_thread",
    label: "X (Twitter) Thread",
    short: "X thread",
    destination: "Numbered, ready to post as a thread",
    tagline: "Numbered thread",
    description:
      "5–9 punchy tweets under 280 characters each, with a hook first and a call-to-action last.",
    tile: "bg-neutral-900/5",
    glyph: "text-neutral-900",
    Icon: (props) => <XIcon {...props} />,
  },
  instagram: {
    id: "instagram",
    label: "Instagram / Facebook Caption",
    short: "Instagram",
    destination: "Captions, Reels & Facebook",
    tagline: "Conversational caption",
    description:
      "A friendly caption with tasteful emojis, line breaks for readability, and niche hashtags at the end.",
    tile: "bg-gradient-to-br bg-linear-to-br from-[#F58529]/15 via-[#DD2A7B]/15 to-[#8134AF]/15",
    glyph: "text-[#DD2A7B]",
    Icon: (props) => <InstagramIcon {...props} />,
  },
  facebook: {
    id: "facebook",
    label: "Facebook Post",
    short: "Facebook",
    destination: "Facebook feed · shareable",
    tagline: "Shareable post",
    description:
      "A warm, conversational post built to spark comments and shares, faithful to your original idea.",
    tile: "bg-[#1877F2]/10",
    glyph: "text-[#1877F2]",
    Icon: (props) => <FacebookIcon {...props} />,
  },
};

/** Render order across the UI. */
export const PLATFORM_ORDER: PlatformId[] = [
  "linkedin",
  "twitter_thread",
  "instagram",
  "facebook",
];

export const PLATFORM_LIST = PLATFORM_ORDER.map((id) => PLATFORMS[id]);
