# 👤 Tawla — Role-Based Restaurant MVP User Stories

## Version 1.1 | 2026-03-22

> **Objective:** A comprehensive, multi-tenant Restaurant POS MVP mapped directly to real-world workflows (Guest -> Waiter -> Cashier -> Admin), strictly adhering to the "calm, simple, and premium Gulf" UI/UX guidelines defined in `11-UI-UX-DESIGNER.md`.

---

# 📌 PERSONAS
| Persona | Role | Goals | Pain Points |
|---------|------|-------|-------------|
| **Fatima** | Guest | Fast, frictionless dining experience without waiting for physical menus. | Hard-to-read tiny menus, slow service when wanting to pay or order. |
| **Omar** | Waiter | Efficient floor management block-by-block. Needs to know instantly who needs what. | Clunky, slow POS hardware. Losing track of which table called for assistance. |
| **Sarah** | Cashier | Fast transaction processing and a clear birds-eye view of all incoming orders and payments. | Miscommunications with kitchen, no clear way to void mistakes quickly. |
| **Ahmed** | Admin (Owner) | Full control over the digital ecosystem, menus, staff, and live revenue tracking. | Complicated backend systems, blind spots in daily cash flow numbers. |

---

# 📖 USER STORIES

## Epic 1: The Guest Experience (QR Dine-In & Takeaway)
*Goal: Provide a frictionless, beautiful self-service dining journey.*

### Story 1.1 — Browse Digital Menu
> As a **Guest**, I want to **scan a QR code at my table to view the digital menu natively on my phone**, so that **I don't have to wait for a physical menu off a waiter.**

**Acceptance Criteria:**
- [ ] Scanning the QR code immediately loads the menu without requiring app installation or user registration.
- [ ] The menu explicitly displays the Table Number I am seated at.
- [ ] Users can smoothly toggle between English and Arabic layouts seamlessly.
- [ ] Out-of-stock items are visually disabled or greyed out.

### Story 1.2 — Add to Cart & Place Order
> As a **Guest**, I want to **add items to my cart and submit my order**, so that **it goes directly to the kitchen and my waiter.**

**Acceptance Criteria:**
- [ ] Users can specify quantities and see a live total (in local currency).
- [ ] Submitting the order fires an immediate real-time update to the Cashier and Waiter dashboards.
- [ ] Order confirmation UI is calm, premium, and gives a clear "Order Received" state.

### Story 1.3 — Call Waiter & Request Bill
> As a **Guest**, I want to **tap a button to call the waiter or request the bill**, so that **I get fast service without having to flag someone down manually.**

**Acceptance Criteria:**
- [ ] Dedicated buttons exist for "Call Waiter" and "Request Bill".
- [ ] Tapping the button shows a disabled "Calling..." state to prevent spam clicks.
- [ ] The action fires a real-time notification/audio alert to the Waiter Dashboard.

---

## Epic 2: Floor Management (Waiters)
*Goal: Empower waiters with a fast, real-time command center for their assigned tables.*

### Story 2.1 — Fast PIN Login
> As a **Waiter**, I want to **log in using a secure 4-digit PIN**, so that **I can access my dashboard instantly while moving around the restaurant floor.**

**Acceptance Criteria:**
- [ ] Waiter is presented with a fast numeric keypad UI.
- [ ] Successful PIN entry instantly routes to the Waiter Dashboard.
- [ ] Failed attempts show a clear, inline error message.

### Story 2.2 — Live Table Status Map
> As a **Waiter**, I want to **view a real-time grid of all my tables**, so that **I know exactly which tables are empty, occupied, or requesting help.**

**Acceptance Criteria:**
- [ ] Tables are visual cards displaying status (Empty, Active, Calling, Bill Requested).
- [ ] Status changes trigger real-time UI updates (e.g., a table turns yellow when "Calling").
- [ ] Audio alerts chime gently for incoming table requests.

### Story 2.3 — Confirming Guest Orders
> As a **Waiter**, I want to **review and confirm a guest's submitted digital order**, so that **I can prevent mistakes or spam before the kitchen starts cooking.**

**Acceptance Criteria:**
- [ ] Pending orders appear in a dedicated high-visibility queue.
- [ ] Waiter can verify the items, tap "Confirm", which updates the order status to "Confirmed by Waiter" and notifies the Cashier.
- [ ] Waiter can reject/cancel the order if it was a mistake.

### Story 2.4 — Resolving Table Calls
> As a **Waiter**, I want to **mark a table call as "Resolved"**, so that **my dashboard stays clean and I focus on the next task.**

**Acceptance Criteria:**
- [ ] Tapping an active table provides a "Resolve Call" action.
- [ ] Resolving the call securely updates the database and resets the table's visual state back to "Active".

---

## Epic 3: Point of Sale Command Center (Cashiers)
*Goal: Provide a robust, high-speed terminal for processing transactions and managing order flow.*

### Story 3.1 — Cashier PIN Login
> As a **Cashier**, I want to **log in using my 4-digit PIN**, so that **I can securely access the central POS register.**

**Acceptance Criteria:**
- [ ] Fast numeric keypad UI dedicated to the Cashier role.
- [ ] Routes immediately to the Cashier POS Dashboard upon success.

### Story 3.2 — Active Orders Pipeline
> As a **Cashier**, I want to **see a sequential, real-time list of all incoming orders**, so that **I can manage the kitchen queue and prepare bills.**

**Acceptance Criteria:**
- [ ] Orders flow sequentially into a "Kanban-style" or list pipeline (Pending -> Preparing -> Served -> Paid).
- [ ] Clicking an order displays full receipt details (Items, Quantities, Taxes, Totals).

### Story 3.3 — Manual POS Orders (Dine-In/Takeaway)
> As a **Cashier**, I want to **manually punch in orders for walk-in customers or specific tables**, so that **I can accommodate guests not using the QR code.**

**Acceptance Criteria:**
- [ ] Fast, touch-friendly grid of menu categories and items.
- [ ] Ability to assign the order to an empty table or mark it as "Takeaway".
- [ ] Submitting immediately prints/sends the ticket to the kitchen.

### Story 3.4 — Processing Payments
> As a **Cashier**, I want to **mark an order as "Paid" (Cash/Card)**, so that **the transaction is finalized and the table is released.**

**Acceptance Criteria:**
- [ ] Dedicated "Checkout" modal for any completed or served order.
- [ ] Cashier selects payment method (Cash, Card, K-Net).
- [ ] Marking as Paid updates the database, calculates daily revenue, and resets the Table status to "Empty".

### Story 3.5 — Voids and Refunds
> As a **Cashier**, I want to **void a specific item or cancel an entire order**, so that **stock and revenue calculations remain perfectly accurate when mistakes happen.**

**Acceptance Criteria:**
- [ ] Secure "Void" button available on active orders.
- [ ] Voiding requires selecting a reason (e.g., "Out of Stock", "Customer Changed Mind").
- [ ] Order total recalculates dynamically.

---

## Epic 4: Restaurant Admin & Setup
*Goal: Give the Owner ultimate control and analytical visibility over their business.*

### Story 4.1 — Secure Admin Login
> As an **Admin**, I want to **login securely using my email and password**, so that **I can access sensitive management and reporting tools.**

**Acceptance Criteria:**
- [ ] Comprehensive client-side validation (Email format, Password length).
- [ ] Graceful Supabase error handling (Invalid credentials show an inline red banner).
- [ ] Successful login routes to the Master Admin Dashboard.

### Story 4.2 — Digital Menu Management
> As an **Admin**, I want to **add, edit, or disable menu items and categories**, so that **the digital QR menus are always accurate.**

**Acceptance Criteria:**
- [ ] Admin can create Categories (Starters, Mains, Drinks).
- [ ] Admin can add Items (Name English/Arabic, Price, Description, Image Upload).
- [ ] Admin can toggle an item's "Availability" (1-click to mark it Out of Stock across all live guest phones).

### Story 4.3 — Staff Management
> As an **Admin**, I want to **create staff accounts and assign roles and PINs**, so that **my employees can log in to their specific POS screens.**

**Acceptance Criteria:**
- [ ] Admin can add a Staff Member (Name, Role: Waiter/Cashier, 4-digit PIN).
- [ ] Admin can deactivate staff members seamlessly to revoke access.

### Story 4.4 — Table & QR Code Generation
> As an **Admin**, I want to **generate QR codes mapped to my physical tables**, so that **I can print them for guests to scan.**

**Acceptance Criteria:**
- [ ] Admin defines how many tables the restaurant has.
- [ ] System automatically generates unique URLs (`/tenant-slug/table/1`) and downloadable QR codes for each table.

### Story 4.5 — Revenue Analytics
> As an **Admin**, I want to **view live revenue trends and active table metrics**, so that **I can monitor the daily performance of my business.**

**Acceptance Criteria:**
- [ ] Dashboard highlights "Today's Revenue", "Total Orders", and "Active Tables".
- [ ] Interactive Bar Chart showing monthly revenue over the last 6 months.
- [ ] Donut Chart breaking down the status of all current lifecycle orders.
