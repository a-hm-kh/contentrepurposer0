import type { Metadata } from "next";
import Link from "next/link";

import { UserMenu } from "@/components/auth/UserMenu";
import { LogoMark } from "@/components/icons";
import { NewsletterForm } from "@/components/tool/NewsletterForm";
import { RepurposeTool } from "@/components/tool/RepurposeTool";
import { signOutAction } from "@/lib/auth/actions";
import { auth } from "@/lib/auth/config";

export const metadata: Metadata = {
  title: "استوديو التحويل",
  description:
    "حوّل مقالاً أو سكريبت فيديو إلى منشور لينكدإن، سلسلة إكس، كابشن إنستغرام، منشور فيسبوك، وخطة نشر أسبوعية.",
};

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="min-h-dvh bg-neutral-50/50" dir="rtl">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950/20"
          >
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">
              ContentRepurposer
            </span>
          </Link>

          <nav className="mr-auto hidden items-center gap-1 sm:flex">
            <Link
              href="/weekly-plan"
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              خطة النشر الأسبوعية
            </Link>
            <Link
              href="/dashboard/billing"
              className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              الاشتراك
            </Link>
          </nav>

          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              isAdmin={user.role === "ADMIN"}
              signOutAction={signOutAction}
            />
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-950"
            >
              تسجيل الدخول
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            استوديو التحويل
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-7 text-neutral-500">
            الصق محتواك، واختر النبرة واللغة، واحصل على حزمة كاملة جاهزة للتعديل والنشر —
            مع مراجعة ذكية تضمن بقاء الفكرة الأصلية كما هي.
          </p>
        </div>

        <RepurposeTool />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Link
            href="/weekly-plan"
            className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:border-neutral-300"
          >
            <p className="text-sm font-semibold tracking-tight text-neutral-950">
              خطة النشر الأسبوعية
            </p>
            <p className="mt-1 text-[13px] leading-6 text-neutral-500">
              ضع مقالاً أو سكريبت، واحصل على خطة نشر لسبعة أيام: المنصة، نوع المنشور، الموضوع، والوقت
              المقترح — مع تصدير JSON / CSV / Markdown.
            </p>
          </Link>

          <div className="flex flex-col gap-5 rounded-2xl border border-neutral-200 bg-white px-6 py-6">
            <div>
              <p className="text-sm font-semibold tracking-tight text-neutral-950">
                تحديثات المنتج
              </p>
              <p className="mt-0.5 text-[13px] leading-6 text-neutral-500">
                ميزات جديدة وتحسينات وإطلاق الخطط المدفوعة — مباشرةً إلى بريدك.
              </p>
            </div>
            <NewsletterForm className="w-full" />
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10">
        <p className="text-xs text-neutral-400">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium text-neutral-600">Ahmad Khalil</span>. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  );
}
