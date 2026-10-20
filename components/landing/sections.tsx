import Link from "next/link";

import {
  ArrowRightIcon,
  BoltIcon,
  CheckIcon,
  ShieldIcon,
} from "@/components/icons";
import { PLATFORM_LIST } from "@/components/platforms";

const STEPS = [
  {
    title: "الصق محتواك",
    body: "مقال، منشور مدونة، نشرة بريدية، سكريبت فيديو، أو حتى نص محادثة. حتى 20,000 حرف، بدون أي تنسيق مطلوب.",
  },
  {
    title: "اختر الأسلوب واللغة",
    body: "حدّد نوع المحتوى، نبرة الكتابة (رسمي / عفوي / تسويقي / تعليمي…)، ولغة الإخراج — والمحرك يتكيّف مع كل اختيار.",
  },
  {
    title: "انسخ وانشر",
    body: "تستلم الحزمة كاملة: لينكدإن، سلسلة إكس مرقّمة، كابشن إنستغرام، منشور فيسبوك، افتتاحيات، ودعوة للتفاعل — جاهزة للنسخ.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            كيف يعمل
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            من محتوى طويل إلى خطة نشر كاملة في ثلاث خطوات
          </h2>
        </header>

        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-neutral-950 font-mono text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold tracking-tight text-neutral-950">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-[14.5px] leading-7 text-neutral-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Formats() {
  return (
    <section id="formats" className="scroll-mt-24 border-b border-neutral-200/70 bg-neutral-50/50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <header className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">
            حزمة النتائج
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            كل منصة بأسلوبها الخاص — ليست نسخة مكرّرة
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-neutral-500">
            نفس المادة الأصلية، لكن بصياغة مخصّصة لكل منصة، مع الحفاظ التام على أفكارك.
          </p>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PLATFORM_LIST.map((platform) => (
            <article
              key={platform.id}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(10,10,10,0.04)] transition-shadow hover:shadow-[0_10px_40px_-20px_rgba(10,10,10,0.25)]"
            >
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${platform.tile}`}>
                <platform.Icon className={`h-5 w-5 ${platform.glyph}`} />
              </span>
              <h3 className="mt-5 text-base font-semibold tracking-tight text-neutral-950">
                {platform.label}
              </h3>
              <p className="mt-1 text-xs text-neutral-400">{platform.tagline}</p>
              <p className="mt-3 text-[14.5px] leading-7 text-neutral-500">
                {platform.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const RELIABILITY_POINTS = [
  "محرك أساسي سريع ينجز معظم الطلبات في ثوانٍ.",
  "إذا تعطّل أو تأخّر أو وصل لحدّ الاستخدام، تُعاد نفس المهمة تلقائياً على محرك بديل.",
  "محرك ثالث اختياري يوفّر شبكة أمان إضافية.",
  "مراجعة ذكية تقارن الناتج بالنص الأصلي وتضمن عدم اختراع أفكار جديدة.",
];

export function FailoverBand() {
  return (
    <section id="reliability" className="scroll-mt-24 border-b border-neutral-200/70">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 rounded-3xl border border-neutral-200 bg-white p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200/70">
              <BoltIcon className="h-3.5 w-3.5" />
              موثوقية عالية
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950">
              توليد لا يتوقّف ولا يفقد فكرتك
            </h2>
            <p className="mt-4 text-[15px] leading-7 text-neutral-500">
              محرك واحد يعني نقطة فشل واحدة. لهذا يعمل ContentRepurposer بسلسلة محركات مع طبقة
              مراجعة، فحدّ الاستخدام في محرك لا يراه عميلك — وفكرتك تبقى كما هي.
            </p>

            <Link
              href="/dashboard"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              جرّبه على محتواك
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <ul className="space-y-4">
            {RELIABILITY_POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-50 ring-1 ring-emerald-200">
                  <CheckIcon className="h-3 w-3 text-emerald-600" />
                </span>
                <p className="text-[14.5px] leading-7 text-neutral-600">{point}</p>
              </li>
            ))}
            <li className="flex gap-3 pt-2">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" />
              <p className="text-[13px] leading-6 text-neutral-400">
                مفاتيح الذكاء الاصطناعي تبقى على السيرفر فقط. لا يُشارك نصّك مع أي طرف ثالث، وسجلّ
                المراجعة متاح للإدارة فقط لحماية الجودة.
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 border-b border-neutral-200/70 bg-neutral-50/50">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <header className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-400">الأسعار</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            ابدأ مجاناً، وارتقِ عندما تحتاج
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-neutral-500">
            أول 10 توليدات مجانية مدى الحياة — بدون تجديد. بعدها خطة Pro بسيطة وواضحة.
          </p>
        </header>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-8">
            <h3 className="text-lg font-semibold tracking-tight text-neutral-950">المجانية</h3>
            <p className="mt-2 text-3xl font-semibold text-neutral-950">0<span className="text-base font-normal text-neutral-500">$</span></p>
            <p className="mt-1 text-[13px] text-neutral-500">لمرة واحدة — لا تتجدد أبداً</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-neutral-600">
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> 10 توليدات مجانية مدى الحياة</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> جميع صيغ المنشورات</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> اختيار النبرة واللغة</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> نسخ بضغطة واحدة</li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              ابدأ مجاناً
            </Link>
          </div>

          <div className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 p-8 text-white">
            <span className="absolute left-6 top-6 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-white/80">
              الأكثر اختياراً
            </span>
            <h3 className="text-lg font-semibold tracking-tight">Pro</h3>
            <p className="mt-2 text-3xl font-semibold">
              $15<span className="text-base font-normal text-white/60">/شهر</span>
            </p>
            <p className="mt-1 text-[13px] text-white/60">يُجدّد شهرياً — يمكنك الإلغاء في أي وقت</p>
            <ul className="mt-6 flex-1 space-y-2.5 text-[14px] text-white/85">
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> 20 توليد يومياً (تتجدد كل يوم)</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> 20 تعديلاً يومياً</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> خطة النشر الأسبوعية + تصدير</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> دعم سكريبت الفيديو والعناوين</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> مراجعة ذكية لكل نتيجة</li>
              <li className="flex gap-2"><CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-400" /> دعم بأولوية</li>
            </ul>
            <Link
              href="/dashboard/billing"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-white/90"
            >
              الاشتراك في Pro
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="border-b border-neutral-200/70">
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
          حوّل قطعة محتوى واحدة إلى خطة نشر متكاملة
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-7 text-neutral-500">
          بدون تسجيل للبدء، وبدون بطاقة ائتمانية. أول 10 توليدات مجانية.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
        >
          جرّب الآن مجاناً
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
