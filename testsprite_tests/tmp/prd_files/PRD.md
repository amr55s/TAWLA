# Product Requirements Document (PRD)

## Project Overview
A multi-tenant SaaS application for restaurants. It replaces traditional PDF/Paper menus with an interactive, beautifully designed digital menu to enhance user experience and increase sales. 

## Target Audience (User Roles)
1. **Guest (الزبون):** Scans a QR code on the table, browses the menu, adds items to the cart, sees cross-sell suggestions, and requests the waiter.
2. **Waiter (الويتر):** Scans the table's QR or uses a dashboard to see pending orders, confirms them, and receives "Call Waiter" notifications.
3. **Cashier/Kitchen (الكاشير):** Receives confirmed orders in real-time on a web dashboard and manages order status.

## Key Features
- **Multi-tenancy Customization:** Each restaurant has its own brand colors, logo, and typography.
- **QR Code Ordering:** Frictionless entry (No app download required for guests).
- **Real-Time Synchronization:** Orders and waiter calls sync instantly using Supabase Realtime/WebSockets.
- **Cross-Selling Engine:** Suggests add-ons or complementary items when an item is added to the cart.
- **Call Waiter Feature:** A simple floating button for guests to request assistance or the bill.
- **Analytics Dashboard:** Insights for restaurant owners on top-selling items and cart abandonment.
- **Bilingual System:** Full support for Arabic (RTL) and English (LTR).