# 00: SCOPE OF WORK (SOW) - Tawla POS SaaS

## 1. Document Hierarchy
This document serves as the ultimate contractual blueprint and high-level boundaries for the Tawla POS SaaS project.
* **Source of Truth for Features:** For detailed, role-by-role execution flows, refer strictly to `06-USER-STORIES.md`.
* **Source of Truth for Design/Aesthetics:** For all UI/UX implementation rules, refer to `11-UI-UX-DESIGNER.md`.

## 2. Product Overview
**Tawla** is a premium, multi-tenant Restaurant SaaS providing integrated QR Dine-In/Takeaway ordering and a complete Point of Sale (POS) system. It is designed to modernize the hospitality experience in the Gulf region through speed, beautiful aesthetics, and frictionless operations.

### Strictly OUT OF SCOPE for MVP:
* Native iOS/Android Mobile Apps (Tawla is a responsive web app/SaaS).
* Advanced back-of-house Inventory/ERP management (e.g., tracking individual ingredient grams).
* Multi-branch aggregations (MVP is focused on single-branch operations per tenant).
* Driver/Delivery fleet tracking.

## 3. Core Personas
The system operates based on four strictly partitioned roles:
1. **The Guest:** Scans QR codes or visits the restaurant link to view the menu and place orders.
2. **The Waiter:** Manages dine-in floor operations, confirms orders, and resolves guest calls via a fast, mobile-friendly dashboard.
3. **The Cashier:** Operates the primary POS Command Center terminal, takes manual orders, manages the active ticket queue, and closes out payments.
4. **The Admin:** The restaurant manager/owner who manages the menu, staff PINs, QR codes, and views high-level revenue analytics.

## 4. MVP Definition (Phase 1)
To ensure rapid and stable deployment, the MVP boundaries are strictly defined.

### IN SCOPE (Phase 1):
* **Guest Flow:** Digital QR Menu browsing, Cart management, placing Dine-In/Takeaway orders, and calling the waiter.
* **Waiter Flow:** Fast PIN Login, live Table Status Map (Free/Busy), confirming pending guest orders, and resolving operational table calls.
* **Cashier Flow (POS):** Fast PIN login, massive 3-column POS Command Center layout, creating manual tickets, tracking active orders in real-time, and resolving cash/manual card payments.
* **Admin Hub:** Multi-tenant dashboard for Menu management (Categories/Items), Staff PIN generation, basic revenue overview charts, and QR code generation/printing.

### PUSHED TO PHASE 2 (Explicitly Out of Scope for Phase 1):
* Direct raw network hardware integration (e.g., automated ESC/POS thermal receipt network printing from the browser).
* Payment Service Provider (PSP) / K-Net / Stripe gateway integrations for online guest checkout.
* Complex partial refunds, item-level bill splitting, or multi-tender mixed payments.
* Advanced predictive analytics or deeply granular exportable financial reports.

## 5. Technical & Security Invariants
* **Architecture:** Next.js (App Router), Tailwind CSS, shadcn/ui.
* **Multi-Tenant Data Isolation:** The application strictly enforces multi-tenancy. **Supabase Row Level Security (RLS)** is a legally binding architectural invariant. Restaurant A's data (menus, orders, staff) must be fundamentally, cryptographically isolated from Restaurant B at the Postgres database level.
* **Real-Time Engine:** Supabase Realtime channels must be utilized to maintain zero-latency sync. Cashier and Waiter dashboards must immediately reflect guest actions without manual refreshing.

## 6. Design & UX Requirements
All frontend interfaces must strictly adhere to the "calm, simple, and premium Gulf" design aesthetic defined in `11-UI-UX-DESIGNER.md`. This includes fast micro-interactions, flawless typography utilizing Geist fonts, and highly deliberate, generous whitespace.

### Bilingual Support (Mandatory Front-Facing Requirement)
The Guest Menus and all public-facing interactive elements must support **Bilingual (Arabic RTL / English LTR)** modes. The system must gracefully handle custom Arabic font rendering, right-to-left layout flipping where linguistically appropriate, and enforce dual-language data entry in the Admin Hub (e.g., requiring both `name_en` and `name_ar` for menu items).
