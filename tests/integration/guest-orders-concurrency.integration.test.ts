/**
 * Verifies consecutive guest orders with the same guest_id + table_id
 * (appetizers → mains) do not fail due to table lookup or insert semantics.
 *
 * Relies on getTableByNumberClient using `.maybeSingle()` (0 or 1 row) vs `.single()`.
 *
 * Requires .env.local or env:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   INTEGRATION_RESTAURANT_SLUG — slug of a restaurant with ≥1 table and ≥1 menu item
 *
 * Run: npm run test:integration
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createAnonSupabase } from "../helpers/supabase-test-client";

const slug = process.env.INTEGRATION_RESTAURANT_SLUG;

const describeIntegration = slug ? describe : describe.skip;

describeIntegration("Guest multi-order flow (same guest_id)", () => {
	const guestId = `e2e_guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	let restaurantId: string;
	let tableId: string;
	let menuItemIds: string[] = [];

	beforeAll(async () => {
		const supabase = createAnonSupabase();
		const { data: rest, error: rErr } = await supabase
			.from("restaurants")
			.select("id")
			.eq("slug", slug as string)
			.maybeSingle();
		if (rErr || !rest) throw new Error(`Restaurant slug not found: ${slug}`);

		restaurantId = rest.id;

		const { data: tables, error: tErr } = await supabase
			.from("tables")
			.select("id")
			.eq("restaurant_id", restaurantId)
			.limit(1);
		if (tErr || !tables?.length) throw new Error("No tables for restaurant");

		tableId = tables[0].id;

		const { data: cats } = await supabase
			.from("categories")
			.select("id")
			.eq("restaurant_id", restaurantId);
		const catIds = (cats ?? []).map((c) => c.id);
		if (!catIds.length) throw new Error("No categories");

		const { data: items, error: iErr } = await supabase
			.from("menu_items")
			.select("id, price")
			.in("category_id", catIds)
			.eq("is_available", true)
			.limit(2);
		if (iErr || !items?.length) throw new Error("No available menu items");

		menuItemIds = items.map((i) => i.id);
	});

	async function placeOrder(itemId: string, qty: number) {
		const supabase = createAnonSupabase();

		const { data: categoriesData } = await supabase
			.from("categories")
			.select("id")
			.eq("restaurant_id", restaurantId);
		const categoryIds = (categoriesData ?? []).map((c) => c.id);

		const { data: menuRow } = await supabase
			.from("menu_items")
			.select("id, price")
			.eq("id", itemId)
			.in("category_id", categoryIds)
			.maybeSingle();

		if (!menuRow) throw new Error("Menu item not in restaurant");

		const price = Number(menuRow.price);
		const total = price * qty;

		const { data: orderData, error: orderError } = await supabase
			.from("orders")
			.insert({
				restaurant_id: restaurantId,
				table_id: tableId,
				total_amount: total,
				guest_id: guestId,
				status: "pending",
			})
			.select()
			.single();

		if (orderError || !orderData) {
			throw new Error(`Order insert failed: ${orderError?.message}`);
		}

		const { error: oiErr } = await supabase.from("order_items").insert({
			order_id: orderData.id,
			menu_item_id: itemId,
			quantity: qty,
			price_at_time: price,
		});

		if (oiErr) {
			await supabase.from("orders").delete().eq("id", orderData.id);
			throw new Error(`Order items insert failed: ${oiErr.message}`);
		}

		return orderData.id as string;
	}

	it("places two consecutive orders with the same guest_id without failure", async () => {
		const id1 = await placeOrder(menuItemIds[0], 1);
		const id2 = await placeOrder(menuItemIds[menuItemIds.length > 1 ? 1 : 0], 1);

		expect(id1).not.toBe(id2);

		const supabase = createAnonSupabase();
		const { data: rows, error } = await supabase
			.from("orders")
			.select("id")
			.eq("guest_id", guestId)
			.eq("restaurant_id", restaurantId)
			.in("id", [id1, id2]);

		expect(error).toBeNull();
		expect(rows?.length).toBe(2);
	});
});
