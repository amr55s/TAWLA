# 🗺 tawla — Sitemap

## Version 1.0 | 2026-03-21

> **Suggested pages:** Landing, Pricing, Login, Dashboard, Team Settings, Billing, Admin

---

# 📌 OVERVIEW

## Total Pages
<!-- TODO: Define total page count -->

## Navigation Style
<!-- TODO: e.g. Top navbar + sidebar -->

---

# 🏠 SITEMAP TREE

```
/                          → Home / Landing
├── /login                 → Login
├── /register              → Register
├── /dashboard             → Dashboard (auth required)
│   ├── /dashboard/profile → User Profile
│   └── /dashboard/settings → Settings
├── /admin                 → Admin Panel (admin only)
│   ├── /admin/users       → User Management
│   └── /admin/settings    → System Settings
└── /404                   → Not Found
```

<!-- TODO: Update with actual pages -->

---

# 📋 PAGE DETAILS

## Page: /

| Field | Value |
|-------|-------|
| **Title** | Home |
| **URL** | `/` |
| **Access** | Public |
| **Components** | Hero, Features, CTA |
| **Data Loaded** | None (static) |

## Page: /dashboard

| Field | Value |
|-------|-------|
| **Title** | Dashboard |
| **URL** | `/dashboard` |
| **Access** | Authenticated users |
| **Components** | Header, Sidebar, Stats Cards, Charts |
| **Data Loaded** | User stats, recent activity |
| **Key Actions** | View metrics, navigate to features |

<!-- TODO: Add details for each page -->

---

# 🧭 NAVIGATION

## Primary Navigation (Top Bar)
| Label | URL | Visible To |
|-------|-----|------------|
| Home | `/` | All |
| Dashboard | `/dashboard` | Authenticated |
| Admin | `/admin` | Admin only |
| Login | `/login` | Guest only |

## Secondary Navigation (Sidebar)
| Label | URL | Visible To |
|-------|-----|------------|
| Profile | `/dashboard/profile` | Authenticated |
| Settings | `/dashboard/settings` | Authenticated |

<!-- TODO: Update navigation items -->

---

# 🔒 ACCESS CONTROL

| Role | Accessible Pages | Restrictions |
|------|-----------------|--------------|
| Guest | Home, Login, Register | Cannot access dashboard |
| User | Dashboard, Profile, Settings | Cannot access admin |
| Admin | All pages | Full access |

<!-- TODO: Update roles and permissions -->
