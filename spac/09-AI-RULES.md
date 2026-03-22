# 🛑 CRITICAL AI RULES & CONSTRAINTS
**Read this file BEFORE executing any code changes in this project.**

## 1. UI & Frontend (shadcn/ui & Tailwind)
- **Shadcn ONLY:** You must use `shadcn/ui` components for all interfaces. Do not invent custom UI components or raw HTML/Tailwind structures if a `shadcn` equivalent exists.
- **Styling:** Maintain a calm, simplicity, and Gulf style in design.
- **Typography:** The official font is **Geist**. DO NOT change, replace, or override this font family under any circumstances.
- **Dark Mode:** Ensure any new UI element fully supports the existing Dark Mode toggle without breaking it.

## 2. React Hooks Order (STRICT)
- **DO NOT CHANGE HOOK ORDER:** You are strictly forbidden from altering the order of existing React Hooks (`useState`, `useEffect`, `useContext`, `useCallback`, etc.) in existing components (e.g., `AdminStaffPage`).
- Breaking the rules of hooks causes fatal render errors. If you must add state, add it safely without disrupting the existing top-level hook execution order.
- Never place hooks inside loops, conditions, or nested functions.

## 3. Database & Backend Stability
- **No Schema Alteration:** Do NOT modify the existing database schema, table structures, or existing API endpoints unless explicitly instructed.
- **Data Integrity:** Always validate payloads before saving to the database. Ensure required foreign keys (like `restaurant_id` in `menu_items`) are always present to avoid `NOT NULL constraint` errors.

## 4. Scope & Regression
- **Don't break what works:** Do not refactor or modify working code outside the exact scope of the user's prompt. 
- Focus only on the requested feature. Do not "clean up" unrelated files.
