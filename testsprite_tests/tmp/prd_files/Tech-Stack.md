# Technology Stack

## Frontend (Guest, Waiter, Cashier Interfaces)
- **Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript (Strict mode enabled).
- **Styling:** Tailwind CSS (with `tailwindcss-rtl` plugin if needed, or logical properties).
- **UI Components:** Radix UI (Headless components) or Shadcn/ui (customized for our design system).
- **Animations:** Framer Motion.
- **State Management:** Zustand (for Guest Cart and local UI state).

## Backend & Database
- **BaaS (Backend as a Service):** Supabase.
- **Database:** PostgreSQL (managed by Supabase).
- **Real-time:** Supabase Realtime (WebSockets) for order syncing and waiter calls.
- **Authentication:** Supabase Auth (for Waiters, Cashiers, and Restaurant Admins).
- **Storage:** Supabase Storage for high-quality food images (integrated with Next.js Image Optimization).

## Deployment
- **Hosting:** Vercel.