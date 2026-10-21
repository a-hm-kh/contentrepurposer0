import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ContentRepurposer — One article, a full publishing plan",
    template: "%s — ContentRepurposer",
  },
  description:
    "Turn one piece of content into a complete publishing plan in your own voice, with results ready to edit and publish: LinkedIn, X, Instagram, Facebook, scroll-stopping hooks and a call to action. First 10 generations free.",
  applicationName: "ContentRepurposer",
  keywords: [
    "content repurposing",
    "LinkedIn post generator",
    "Twitter thread generator",
    "Instagram caption generator",
    "Facebook post generator",
    "publishing plan",
    "AI copywriting",
    "video script to posts",
  ],
  authors: [{ name: "Ahmad Khalil" }],
  openGraph: {
    title: "ContentRepurposer — One article, a full publishing plan",
    description:
      "From one article or video script to a ready-to-publish bundle for every platform, with a smart review layer and a weekly plan.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentRepurposer — One article, a full publishing plan",
    description:
      "One article or video script in, a ready-to-publish bundle for every platform out.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
