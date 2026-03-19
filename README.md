# Tawla - Restaurant Intelligence Platform

**Tawla** is a fluid, multi-tenant restaurant management ecosystem built natively for modern operations. Tawla empowers restaurant owners with a centralized system, bridging the physical and digital gap through QR code menus, automated real-time dashboards, and agentic workflows.

## 🚀 Key Features

- **Multi-Tenant B2B SaaS**: Completely scalable architecture. Every restaurant operates in a highly isolated environment mapped directly to its owner.
- **Agentic / Autonomous Optimization**: Built out as a forward-thinking application utilizing autonomous processes.
- **GSAP-Powered Interactive UI**: Stunning Landing Page featuring advanced micro-interactions, floating elements, and premium Glassmorphism design aesthetics.
- **Bilingual Support**: Full localized compatibility in English & Arabic natively utilizing the Inter and IBM Plex Sans Arabic font families.
- **Complete Admin Dashboard**: A comprehensive management suite providing complete operational control over staff, menu categories, physical tables, active orders, and live analytics.

## 🛠️ Tech Stack

Tawla is constructed using an elite, modern Typescript stack focusing on performance and data synchronicity.

- **Frontend**: Next.js 16 (App Router), React 18, Tailwind CSS v4, Framer Motion, GSAP.
- **Backend & Auth**: Supabase (PostgreSQL, Supabase Auth, Storage, Real-time Subscriptions).
- **State Management**: React Context (`RestaurantContext`) for strict frontend tenant isolation and Zustand for isolated guest carts.
- **Database Deployment**: Supabase CLI (Migration-driven).

## 🏢 Multi-Tenant Architecture

Tawla operates entirely on a strictly enforced multi-tenant architecture pattern. 
Every data cluster is explicitly bound to a tenant (the restaurant owner). 

### The Tenant Record & Security
- **The Core Constraint**: Every restaurant is tied to a user entity via an `owner_id` (linking to `auth.users`).
- **Data Isolation**: Subordinate tables (`restaurant_staff`, `tables`, `orders`, `menu_items`) extend downwards originating strictly from a `restaurant_id`.
- **Row Level Security (RLS)**: **Absolute data isolation.** PostgreSQL RLS policies guarantee that a user cannot query or mutate records unless the operations map explicitly back to their `owner_id` or an assigned active `restaurant_staff` scope. 

*(For a deep dive into the Database Schema, Context bindings, and advanced Realtime streams, see [ARCHITECTURE.md](./ARCHITECTURE.md))*

## 💻 The Development Workflow (CRITICAL)

To maintain schema synchronicity and operational integrity, all database iterations MUST strictly flow through the **Supabase CLI**. We adhere strictly to a **Zero Mock Data policy** in the frontend components.

1. **NO UI-First Mocks**: Every list, interaction, or metric displayed in the frontend MUST be dynamically mapped to a live Supabase query.
2. **Schema CLI Migrations**: Do NOT use the Supabase Dashboard UI to make raw structure changes.
   - Run: `npx supabase migration new <name_of_migration>`
   - Write standard SQL changes inside the generated `supabase/migrations/` file.
   - Run: `npx supabase db push` to push the schema up safely.

## ⚙️ Local Setup Instructions

### 1. Repository & Installation
Clone the repository and install all node modules.
```bash
git clone <repository_url>
cd Tawla
npm install
```

### 2. Connect Supabase
Launch the Supabase CLI linking wizard to bind your local instance to your remote Supabase project.
```bash
npx supabase link --project-ref your-project-ref
```
*You will need your Database password.*

### 3. Sync Database State
Push any pending migrations to ensure your local database matches the tracked schema files.
```bash
npx supabase db push
```

### 4. Environment Variables
Duplicate the example ENV file or create a `.env.local` containing the Supabase keys acquired from the remote project settings.

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
```

### 5. Start Development Server
Boot up the Next.js local server to run the full application.
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the application.
