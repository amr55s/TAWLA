# Tawla SaaS - Core Testing Workflows

Our application is a Next.js (App Router) Restaurant Management SaaS. We need to run end-to-end tests on our local environment (http://localhost:3000) for three critical user journeys.

## 1. Guest Ordering Flow (Zero-Friction)
- **Starting Point:** Navigate to `http://localhost:3000/susushi/menu?table=1`
- **Action:** 1. Find any menu item and click the "Add to Cart" button.
  2. Navigate to the Checkout/Cart page (`/susushi/checkout` or `/susushi/cart`).
  3. Click the "Checkout" or "Place Order" button.
- **Expected Result:** The order is submitted successfully, and the user is redirected to an order history or QR page without needing to log in.

## 2. Admin Menu Management Flow
- **Starting Point:** Navigate to `http://localhost:3000/login`
- **Credentials:** Use email `admin@susushi.com` and password `password123`.
- **Action:** 1. Log in. The system should redirect to `/admin`.
  2. Navigate to `/admin/menu`.
  3. Click "Add Item".
  4. Fill in the required fields (Name, Price, Category) and submit the form.
- **Expected Result:** The new menu item is successfully created and appears in the menu list.

## 3. Staff RBAC (Role-Based Access Control) Flow
- **Starting Point:** Navigate to `http://localhost:3000/login`
- **Credentials:** Use email `cashier@susushi.com` and password `password123`.
- **Action:** 1. Log in.
- **Expected Result:** The system should automatically recognize the cashier role and redirect them directly to their specific dashboard (`/susushi/cashier`).