import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ContentRepurposer — One article, three platforms",
    template: "%s — ContentRepurposer",
  },
  description:
    "Paste an article, blog post, or long text and instantly get a LinkedIn post, an X (Twitter) thread, and an Instagram caption. Your first 10 generations are free — no signup required.",
  applicationName: "ContentRepurposer",
  keywords: [
    "content repurposing",
    "LinkedIn post generator",
    "Twitter thread generator",
    "Instagram caption generator",
    "AI copywriting",
    "micro saas",
  ],
  authors: [{ name: "ContentRepurposer" }],
  openGraph: {
    title: "ContentRepurposer — One article, three platforms",
    description:
      "Turn one long-form piece into a LinkedIn post, an X thread, and an Instagram caption in seconds.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentRepurposer — One article, three platforms",
    description:
      "Turn one long-form piece into a LinkedIn post, an X thread, and an Instagram caption in seconds.",
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
