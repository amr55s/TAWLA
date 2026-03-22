# 🗄 tawla — Database Schema

## Version 1.0 | 2026-03-21

---

# 📌 OVERVIEW

## Database Type
PostgreSQL 17

## ORM
Prisma 6

## Naming Convention
- Tables: `snake_case` (plural)
- Columns: `snake_case`
- Primary Key: `id` (UUID/CUID)
- Timestamps: `created_at`, `updated_at`

---

# 📊 ENTITY RELATIONSHIP DIAGRAM

```
┌──────────┐       ┌──────────────┐
│  users   │──1:N──│   sessions   │
└──────────┘       └──────────────┘
     │
    1:N
     │
┌──────────┐
│  posts   │
└──────────┘
```

<!-- TODO: Update ER Diagram with actual tables -->

---

# 📋 TABLES

## Table: `organizations`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| name | VARCHAR(255) | NOT NULL | Organization name |
| slug | VARCHAR(255) | UNIQUE | URL-friendly name |
| plan | ENUM | DEFAULT 'free' | free, pro, enterprise |
| stripe_customer_id | VARCHAR(255) | | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

## Table: `users`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations.id | |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| name | VARCHAR(255) | NOT NULL | |
| role | ENUM | DEFAULT 'member' | owner, admin, member |
| created_at | TIMESTAMP | DEFAULT NOW() | |

## Table: `subscriptions`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations.id | |
| stripe_subscription_id | VARCHAR(255) | | |
| plan | ENUM | NOT NULL | free, pro, enterprise |
| status | ENUM | DEFAULT 'active' | active, past_due, cancelled |
| current_period_start | TIMESTAMP | | |
| current_period_end | TIMESTAMP | | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

## Table: `invitations`

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| org_id | UUID | FK → organizations.id | |
| email | VARCHAR(255) | NOT NULL | |
| role | ENUM | DEFAULT 'member' | |
| token | VARCHAR(255) | UNIQUE | |
| expires_at | TIMESTAMP | NOT NULL | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

# 🔗 RELATIONS

| From | To | Type | FK Column | On Delete |
|------|----|------|-----------|-----------|
| sessions | users | N:1 | `user_id` | CASCADE |
<!-- TODO: Add more relations -->

---

# 📑 INDEXES

| Table | Columns | Type | Reason |
|-------|---------|------|--------|
| users | `email` | UNIQUE | Login lookup |
| sessions | `token` | UNIQUE | Token validation |
| sessions | `user_id` | BTREE | User sessions query |
<!-- TODO: Add more indexes -->

---

# 🏷 ENUMS

### user_role
| Value | Description |
|-------|-------------|
| `user` | Regular user |
| `admin` | Administrator |

<!-- TODO: Add more enums -->

---

# 🌱 SEED DATA

```sql
-- Default admin user
INSERT INTO users (id, email, name, role)
VALUES ('...', 'admin@example.com', 'Admin', 'admin');
```

<!-- TODO: Add seed data for development -->
