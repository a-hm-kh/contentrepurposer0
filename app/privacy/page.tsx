import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "كيف يجمع ContentRepurposer بياناتك ويستخدمها ويحميها.",
};

const SECTIONS = [
  {
    title: "ما الذي نجمعه؟",
    body: [
      "المحتوى الذي تلصقه لتحويله (نص المقال أو سكريبت الفيديو)، ومخرجاته المولّدة.",
      "بيانات حسابك الأساسية عند تسجيل الدخول عبر Google: الاسم، البريد الإلكتروني، وصورة الملف الشخصي.",
      "بيانات الاستخدام التقنية: عدد التوليدات، نوع الإدخال، النبرة واللغة، الطابع الزمني، وعنوان IP لأغراض منع إساءة الاستخدام.",
      "لا نجمع بيانات بطاقتك الائتمانية إطلاقاً — تُدار المدفوعات بالكامل عبر Lemon Squeezy.",
    ],
  },
  {
    title: "لماذا نخزّن النصوص؟",
    body: [
      "نحتفظ بنسخة من الإدخال والمخرج في قاعدة بيانات محمية للتشخيص وتحسين الجودة ومكافحة إساءة الاستخدام.",
      "هذا السجل متاح لمالك المنصة (الأدمن) فقط، ولا يُعرض لأي مستخدم آخر ولا يُشارك مع أي طرف ثالث.",
      "يمكنك طلب حذف سجلّك الكامل في أي وقت عبر التواصل معنا، وسنستجيب خلال مدة معقولة.",
    ],
  },
  {
    title: "من يرى محتواك؟",
    body: [
      "أنت فقط. الحزمة التي تولّدها لا تظهر لأي مستخدم آخر على المنصة.",
      "نُرسل نصّك إلى مزوّد ذكاء اصطناعي واحد من عدة مزوّدين موثوقين لإتمام التوليد فوراً، دون استخدامه لتدريب نماذجنا.",
      "مفاتيح الذكاء الاصطناعي تبقى على السيرفر فقط ولا تُرسل إلى متصفحك أبداً.",
    ],
  },
  {
    title: "الأمان",
    body: [
      "نتّبع ممارسات أمنية معيارية: التحقق من توقيع كل عملية دفع، تشفير الاتصال عبر HTTPS، وفحص المدخلات.",
      "نحتفظ بسجل تدقيق إداري للعمليات الحساسة (تسجيل الدخول، الدفع، التوليد) لأغراض المراقبة والحماية.",
      "لا نبيع بياناتك ولا نشاركها مع مُعلنين أو وسطاء بيانات.",
    ],
  },
  {
    title: "الاحتفاظ والحذف",
    body: [
      "نحتفظ بالسجلات التقنية لمدة محدودة لأغراض الأمان وقياس الأداء.",
      "بعد حذف حسابك، تُحذف بياناتك المرتبطة بالحساب من قواعد بياناتنا.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-neutral-50/50" dir="rtl">
      <header className="border-b border-neutral-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-7 w-7" />
            <span className="text-[15px] font-semibold tracking-tight text-neutral-950">ContentRepurposer</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">سياسة الخصوصية</h1>
        <p className="mt-3 text-[15px] leading-7 text-neutral-500">
          خصوصيتك أساس المنتج. هذه الصفحة تشرح — بوضوح وبدون تعقيد — ما نجمعه، ولماذا، ومن يستطيع رؤيته.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold tracking-tight text-neutral-950">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.body.map((line) => (
                  <li key={line} className="flex gap-2.5 text-[14.5px] leading-7 text-neutral-600">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-neutral-200 bg-white p-6 text-[14px] leading-7 text-neutral-600">
          <p className="font-semibold text-neutral-900">أسئلة أو طلب حذف البيانات؟</p>
          <p className="mt-1">تواصل معنا وسنعالج طلبك في أقرب وقت.</p>
        </div>

        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/terms" className="text-neutral-600 underline hover:text-neutral-950">شروط الاستخدام</Link>
          <Link href="/" className="text-neutral-600 underline hover:text-neutral-950">العودة للرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
