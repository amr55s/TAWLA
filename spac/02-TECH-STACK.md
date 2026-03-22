# 🛠 tawla — Tech Stack

## Version 1.0 | 2026-03-21

> **Suggested stack:** Next.js + Node.js + PostgreSQL + Stripe Billing + Redis

---

# 🎨 FRONTEND

| Item | Technology | Why |
|------|-----------|-----|
| Framework | Next.js 16 (App Router) | Full-stack React, SSR/SSG, Server Components |
| Language | TypeScript 5.9 | Type safety, better DX |
| Styling | Tailwind CSS 4.2 | Utility-first, rapid prototyping |
| UI Components | Shadcn/UI 4 (Radix UI) | Accessible, customizable, copy-paste |
| State Management | Zustand 5 | Lightweight, simple API |
| Data Fetching | TanStack Query 5 | Caching, auto-refetch, optimistic updates |
| Forms | React Hook Form 7 + Zod 4 | Performant forms + schema validation |
| i18n | next-intl 4 | Multi-language support |

<!-- TODO: Adjust based on your actual stack -->

---

# ⚙️ BACKEND

| Item | Technology | Why |
|------|-----------|-----|
| Runtime | Node.js 22+ | LTS, stable |
| Framework | NestJS 11 | Modular, scalable, enterprise-ready |
| API Style | REST | Standard, easy to consume |
| Auth | JWT + OAuth (Google) | Stateless auth + social login |
| Validation | Class Validator + Zod | DTO validation |
| Email | Resend 6 | Developer-friendly email API |

<!-- TODO: Adjust based on your actual stack -->

---

# 🗄 DATABASE

| Item | Technology | Why |
|------|-----------|-----|
| Primary DB | PostgreSQL 17 | Reliable, feature-rich, extensions |
| ORM | Prisma 7 | Type-safe queries, migrations, studio |
| Cache | Redis 7 | Fast caching, session, queue |
| File Storage | Cloudflare R2 (S3-compatible) | Affordable, no egress fees |

---

# 🏗 INFRASTRUCTURE & HOSTING

| Item | Technology | Why |
|------|-----------|-----|
| Hosting | Vercel (Frontend) + Railway/AWS (Backend) | <!-- TODO --> |
| CI/CD | GitHub Actions | <!-- TODO --> |
| Containerization | Docker Compose | PostgreSQL + Redis local dev |
| Monitoring | Sentry | Error tracking, performance |
| Analytics | <!-- TODO: e.g. PostHog, Mixpanel --> | |

---

# 🔧 DEVELOPMENT TOOLS

| Item | Technology |
|------|-----------|
| Package Manager | pnpm 10+ |
| Monorepo | Turborepo 2 |
| Linter | ESLint 10 |
| Formatter | Prettier 3 |
| Testing | Vitest 4 + Playwright 1 |
| UI Dev | Shadcn CLI (`npx shadcn@latest add <component>`) |

---

# 📦 ARCHITECTURE DIAGRAM (Monorepo)

```
project-root/ (Turborepo)
├── apps/
│   ├── web/          ← Next.js (Dashboard)   :3000
│   ├── landing/      ← Next.js (Marketing)   :3002
│   └── api/          ← NestJS (Backend API)  :3001
├── packages/
│   ├── database/     ← Prisma schema + client
│   ├── ui/           ← Shared UI components
│   └── config/       ← Shared ESLint, TS configs
└── turbo.json

┌───────────┐           ┌──────────────┐           ┌──────────────┐
│ Dashboard │──────────▶│   NestJS     │──────────▶│ PostgreSQL   │
│ (apps/web)│           │  (apps/api)  │           │ + Redis      │
└───────────┘           └──────┬───────┘           └──────────────┘
┌───────────┐                  │
│  Landing  │                  │       ┌──────────────┐
│(apps/     │                  └──────▶│    Stripe     │
│ landing)  │                          │  (Billing)    │
└───────────┘                          └──────────────┘
```
