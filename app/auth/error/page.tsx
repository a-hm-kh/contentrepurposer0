import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "خطأ في تسجيل الدخول",
};

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50/50 px-6" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-[0_10px_40px_-20px_rgba(10,10,10,0.25)]">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5">
          <LogoMark className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight text-neutral-950">ContentRepurposer</span>
        </Link>

        <h1 className="mt-8 text-xl font-semibold tracking-tight text-neutral-950">
          تعذّر إتمام تسجيل الدخول
        </h1>
        <p className="mt-3 text-[14px] leading-7 text-neutral-500">
          حدث خطأ أثناء المصادقة عبر Google. تأكد من السماح بالنوافذ المنبثقة، أو حاول مرة أخرى.
        </p>

        <Link
          href="/auth/signin"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          إعادة المحاولة
        </Link>

        <p className="mt-4 text-[13px] text-neutral-500">
          أو{" "}
          <Link href="/dashboard" className="font-medium text-neutral-800 underline">
            تابع بدون حساب
          </Link>
        </p>
      </div>
    </div>
  );
}
