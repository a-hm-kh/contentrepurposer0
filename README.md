# ContentRepurposer

حوّل قطعة محتوى واحدة إلى خطة نشر متكاملة بأسلوبك الخاص، مع نتائج جاهزة للتعديل والنشر.

A production-ready micro-SaaS that turns one article, blog post, or video script into a complete
publishing package: LinkedIn post, X thread, Instagram caption, Facebook post, curated hooks, a
persuasive CTA, short-form video ideas, a smart content review, and a 7-day publishing plan.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL · Auth.js +
Google · Lemon Squeezy**.

---

## ✨ Features

| Area | What it does |
| --- | --- |
| **Repurposing** | One input → full package: LinkedIn, X thread (ready to post), Instagram caption, Facebook post, 5 hooks, 1 CTA. |
| **Video scripts** | Detects video-script input and adds promotional posts, alternative titles, and short-clip ideas. |
| **Tone & language** | 9 writing tones (formal, casual, marketing, educational, …) and Arabic / English output. |
| **Content review** | A review layer compares output against the original to prevent invented or altered ideas. |
| **Inline edits** | Shorten, make more persuasive, change the hook, simplify, or generate 3 variants — without regenerating the whole package. Counts against quota. |
| **Weekly plan** | A suggested 7-day plan (platform, post type, topic, time, hook) with JSON / CSV / Markdown export. Planning only — never touches client accounts. |
| **Accounts & quotas** | Google sign-in, lifetime free tier (10 generations, never renews), Pro tier (20 generations + 20 edits per rolling 24h). |
| **Payments** | Lemon Squeezy checkout + verified webhooks for the $15/month Pro plan. |
| **Admin dashboard** | Private, email-gated: monthly visits, generation counts, revenue, and a full input/output log. |
| **Abuse prevention** | Per-IP rate limiting, input validation, quota gating before any token spend, and an audit log. |
| **Privacy** | Provider names never surface in the UI; API keys stay server-side; card data never touches this app. |

---

## 🚀 Getting started

### 1. Requirements

- Node.js 20+
- A PostgreSQL database (free tier from [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### 2. Install

```bash
npm install
```

### 3. Configure

```bash
cp .env.example .env.local
```

Fill in `.env.local`. The essentials:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` / `DIRECT_URL` | Postgres connection strings (pooled + direct). |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials. Redirect URI: `https://your-domain.com/api/auth/callback/google`. |
| `ADMIN_EMAILS` | Comma-separated emails promoted to `ADMIN` on sign-in (your private dashboard access). |
| `GROQ_API_KEY` | Primary AI provider (at least one AI key is required). |
| `GEMINI_API_KEY` | Automatic fallback. |
| `OPENAI_API_KEY` | Optional third fallback. |
| `LEMONSQUEEZY_*` | Payments (see below). |

### 4. Create the database schema

```bash
npm run db:push
```

### 5. Run

```bash
npm run dev
# http://localhost:3000
```

---

## 💳 Lemon Squeezy setup

1. Create a **subscription** product in Lemon Squeezy priced at **$15/month**.
2. Copy the **variant ID** → `LEMONSQUEEZY_SUBSCRIPTION_VARIANT_ID`.
3. Copy the API key and store ID → `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`.
4. Add a webhook pointing at `https://your-domain.com/api/webhooks/lemonsqueezy`, subscribe to all
   `subscription_*` events, and copy the signing secret → `LEMONSQUEEZY_WEBHOOK_SECRET`.

Webhooks are verified with a timing-safe HMAC-SHA256 comparison before anything is written.

---

## 🧱 Project structure

```
app/
  api/
    repurpose/        # main generation route (auth + quota + persistence)
    modify/           # inline edits
    weekly-plan/      # 7-day plan generation
    checkout/         # Lemon Squeezy checkout
    webhooks/         # Lemon Squeezy webhooks (signature verified)
    usage/            # quota snapshot
    auth/             # Auth.js handlers + anonymous-usage merge
    subscribe/        # newsletter
    track/visit/      # anonymous analytics beacon
  admin/dashboard/    # private admin dashboard
  dashboard/          # studio + billing
  weekly-plan/        # weekly plan UI
  privacy, terms      # legal pages
components/           # landing, tool, auth, billing, analytics, ui
lib/
  ai/                 # failover engine (providers, prompts, modifications, weekly plan)
  auth/               # Auth.js config + server actions
  db/                 # Prisma client singleton
  utils/quota.ts      # quota engine (free lifetime + Pro rolling 24h)
  analytics/          # daily site analytics
  lemonsqueezy/       # API client
prisma/schema.prisma  # full database schema
```

---

## 🧠 How quotas work

- **Free** — 10 generations, lifetime. Never renews, never resets.
- **Pro** — 20 generations + 20 inline edits per rolling 24-hour window (`lastProResetAt`).
- Quota is tracked in Postgres for **both** signed-in users and anonymous visitors (keyed by the
  `cr_uid` cookie), and anonymous usage is merged onto the account on first sign-in — so you can't
  farm extra free generations by clearing cookies.
- The quota gate runs **before** any AI tokens are spent.

---

## 🔐 Security notes

- Provider names (Groq / Gemini / OpenAI) never appear in any user-facing interface or API response.
- All AI keys are server-side only.
- Every webhook is signature-verified; every payment event is audit-logged.
- Payments and card data are handled entirely by Lemon Squeezy.
- Security headers are applied by `proxy.ts`.

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Generate Prisma client + production build. |
| `npm run start` | Run the production server. |
| `npm run typecheck` | Type-check without emitting. |
| `npm run db:push` | Push the Prisma schema to the database. |
| `npm run db:studio` | Open Prisma Studio. |

---

© 2026 Ahmad Khalil. All rights reserved.
