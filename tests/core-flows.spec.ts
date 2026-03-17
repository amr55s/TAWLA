// tests/core-flows.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Core Flows - Su Sushi', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' }).catch(() => {});
  });

  // TASK 1: Guest Flow (Zero-Friction Ordering)
  test('Guest can place an order with zero-friction flow', async ({ page }) => {
    // 1. Table entry: go to restaurant root, enter table number, confirm
    await page.goto(`${BASE_URL}/susushi`, { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /table number/i })).toBeVisible();

    await page.getByRole('button', { name: '1' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();

    await expect(page).toHaveURL(/\/susushi\/menu/);

    // 2. Add to cart: DishCard uses a plus button with aria-label "Add {name} to cart"
    const addButton = page.getByRole('button', { name: /add .* to cart/i }).first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // 3. Go to checkout (cart is in store; navigate to checkout)
    await page.goto(`${BASE_URL}/susushi/checkout`, { waitUntil: 'networkidle' });

    // Checkout may redirect to cart if store isn't rehydrated yet; wait and go to checkout if on cart
    const onCart = page.url().includes('/cart');
    if (onCart) {
      await expect(page.getByRole('button', { name: /generate qr for order/i })).toBeVisible({ timeout: 10000 });
      await page.getByRole('button', { name: /generate qr for order/i }).click();
      await expect(page).toHaveURL(/\/susushi\/checkout/, { timeout: 10000 });
    }

    // Multiple elements show "KD" (subtotal, total); use first match to assert cart content
    const cartContent = page.getByText(/kd/i).first();
    await expect(cartContent).toBeVisible();

    // 4. Place order: button text is "Confirm & Generate QR" (allow time for rehydration)
    const placeOrderBtn = page.getByRole('button', { name: /confirm & generate qr/i });
    await expect(placeOrderBtn).toBeEnabled({ timeout: 15000 });

    await placeOrderBtn.click();

    await expect(page).toHaveURL(/\/susushi\/qr/, { timeout: 15000 });
  });

  // TASK 2: Admin Flow (Login & Create Menu Item)
  // Requires Supabase Auth: create admin@susushi.com with user_metadata.role = 'admin', then remove .skip
  test.skip('Admin can login and create a new menu item', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    // Login: inputs use placeholder (labels are sibling, not associated)
    await page.getByPlaceholder(/you@restaurant\.com|email/i).fill('admin@susushi.com');
    await page.getByPlaceholder(/enter your password|password/i).fill('password123');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin(\/)?$/, { timeout: 10000 });

    await page.goto(`${BASE_URL}/admin/menu`, { waitUntil: 'networkidle' });

    const addItemBtn = page.getByRole('button', { name: /add item/i });
    await expect(addItemBtn).toBeVisible();
    await addItemBtn.click();

    const modalTitle = page.getByRole('heading', { name: /add item/i });
    await expect(modalTitle).toBeVisible();

    const uniqueName = `Playwright Nigiri ${Date.now()}`;

    await page.getByLabel(/name \(english\) \*/i).fill(uniqueName);
    await page.getByLabel(/price \(kd\) \*/i).fill('1.500');

    // Category: first option is "Select category", second is first real category
    await page.getByRole('combobox').selectOption({ index: 1 });

    await page.getByRole('button', { name: /create item/i }).click();

    await expect(modalTitle).toBeHidden({ timeout: 10000 });

    await expect(page.getByText(uniqueName)).toBeVisible({ timeout: 5000 });
  });

  // TASK 3: Staff Routing (RBAC check)
  // Requires Supabase Auth user: cashier@susushi.com with role + restaurant_id in user_metadata
  test.skip('Cashier login redirects to /[slug]/cashier', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    await page.getByPlaceholder(/you@restaurant\.com|email/i).fill('cashier@susushi.com');
    await page.getByPlaceholder(/enter your password|password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/susushi\/cashier/, { timeout: 10000 });

    const heading = page.getByRole('heading', { name: /hall overview|tables|cashier/i });
    await expect(heading).toBeVisible();
  });
});
