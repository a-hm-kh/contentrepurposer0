import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ContentRepurposer — خطة نشر متكاملة من قطعة محتوى واحدة",
    template: "%s — ContentRepurposer",
  },
  description:
    "حوّل قطعة محتوى واحدة إلى خطة نشر متكاملة باسلوبك الخاص مع نتائج جاهزة للتعديل والنشر: لينكدإن، إكس، إنستغرام، فيسبوك، افتتاحيات جذابة، ودعوة للتفاعل. أول 10 توليدات مجانية.",
  applicationName: "ContentRepurposer",
  keywords: [
    "تحويل المحتوى",
    "منشور لينكدإن",
    "سلسلة تويتر",
    "كابشن إنستغرام",
    "خطة نشر",
    "content repurposing",
    "LinkedIn post generator",
    "Twitter thread generator",
    "Instagram caption generator",
    "AI copywriting",
  ],
  authors: [{ name: "Ahmad Khalil" }],
  openGraph: {
    title: "ContentRepurposer — خطة نشر متكاملة من قطعة محتوى واحدة",
    description:
      "من مقال أو سكريبت فيديو واحد إلى حزمة منشورات جاهزة للنشر على كل المنصات، مع مراجعة ذكية وخطة أسبوعية.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentRepurposer — خطة نشر متكاملة من قطعة محتوى واحدة",
    description:
      "من مقال أو سكريبت فيديو واحد إلى حزمة منشورات جاهزة للنشر على كل المنصات.",
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
    <html lang="ar" dir="rtl" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
