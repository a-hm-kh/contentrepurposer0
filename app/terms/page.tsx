import type { Metadata } from "next";
import Link from "next/link";

import { LogoMark } from "@/components/icons";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "شروط استخدام ContentRepurposer والاشتراك في خطة Pro.",
};

const SECTIONS = [
  {
    title: "الخدمة",
    body: [
      "ContentRepurposer يحوّل قطعة محتوى أدخلتها إلى صيغ جاهزة للنشر على منصات التواصل (لينكدإن، إكس، إنستغرام، فيسبوك) مع خطة نشر أسبوعية.",
      "الخدمة أداة تخطيط وكتابة فقط — ولا تنشر أي شيء نيابة عنك، ولا تتصل بحساباتك على أي منصة.",
    ],
  },
  {
    title: "مسؤوليتك عن المحتوى",
    body: [
      "أنت المسؤول الكامل عن المحتوى الذي تلصقه وعن أي استخدام لاحق للمخرجات.",
      "يجب ألا تلصق محتوى مخالفاً للقانون أو منتهكاً لحقوق الآخرين، أو يحتوي على بيانات شخصية حساسة لأطراف ثالثة دون إذن.",
      "راجع المخرجات دائماً قبل النشر — أنت المسؤول النهائي عن دقتها وملاءمتها.",
    ],
  },
  {
    title: "الخطط والأسعار",
    body: [
      "الخطة المجانية تمنحك 10 توليدات مدى الحياة، وهي لمرة واحدة ولا تتجدد ولا تُصفَّر.",
      "خطة Pro بسعر 15 دولاراً شهرياً، وتمنحك 20 توليداً و20 تعديلاً يومياً تتجدد تلقائياً كل 24 ساعة.",
      "تُعالَج المدفوعات عبر Lemon Squeezy، ويمكنك الإلغاء في أي وقت وتستمر الخدمة حتى نهاية الفترة المدفوعة.",
    ],
  },
  {
    title: "الاستخدام العادل",
    body: [
      "يُمنع الاستخدام المفرط أو الآلي (مثل الوصول البرمجي الجماعي) لتجاوز الحدود المفروضة.",
      "نحتفظ بحق تعليق أي حساب يسوء استخدامه بما يضر بالخدمة أو بالمستخدمين الآخرين.",
    ],
  },
  {
    title: "حدود المسؤولية",
    body: [
      "نقدّم الخدمة «كما هي» دون ضمانات مطلقة. نبذل جهداً معقولاً لتوفّرها وجودتها، لكننا لا نضمن خلوّ المخرجات من الأخطاء.",
      "لا نتحمل مسؤولية أي خسارة ناتجة عن الاعتماد على المخرجات دون مراجعة بشرية.",
    ],
  },
];

export default function TermsPage() {
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
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">شروط الاستخدام</h1>
        <p className="mt-3 text-[15px] leading-7 text-neutral-500">
          باستخدامك للمنصة فإنك توافق على الشروط التالية. صيغت بلغة واضحة لتكون مفهومة تماماً.
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

        <div className="mt-8 flex gap-4 text-sm">
          <Link href="/privacy" className="text-neutral-600 underline hover:text-neutral-950">سياسة الخصوصية</Link>
          <Link href="/" className="text-neutral-600 underline hover:text-neutral-950">العودة للرئيسية</Link>
        </div>
      </main>
    </div>
  );
}
