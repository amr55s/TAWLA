/**
 * Stress test: simulate many concurrent order inserts (Supabase anon + RLS).
 *
 * Usage:
 *   npx tsx scripts/load-test-guest-orders.ts
 *
 * Required env (from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   LOAD_TEST_RESTAURANT_SLUG
 *
 * Optional:
 *   LOAD_TEST_CONCURRENCY (default 100)
 *   LOAD_TEST_TABLE_NUMBER (default 1) — must exist for restaurant
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const slug = process.env.LOAD_TEST_RESTAURANT_SLUG;
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY ?? "100");
const tableNumber = Number(process.env.LOAD_TEST_TABLE_NUMBER ?? "1");

if (!url || !key || !slug) {
	console.error(
		"Missing env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, LOAD_TEST_RESTAURANT_SLUG",
	);
	process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
	const t0 = performance.now();

	const { data: rest, error: rErr } = await supabase
		.from("restaurants")
		.select("id")
		.eq("slug", slug)
		.maybeSingle();
	if (rErr || !rest) {
		console.error("Restaurant not found:", rErr?.message);
		process.exit(1);
	}

	const { data: table, error: tErr } = await supabase
		.from("tables")
		.select("id")
		.eq("restaurant_id", rest.id)
		.eq("table_number", tableNumber)
		.maybeSingle();
	if (tErr || !table) {
		console.error("Table not found:", tErr?.message);
		process.exit(1);
	}

	const { data: cats } = await supabase
		.from("categories")
		.select("id")
		.eq("restaurant_id", rest.id);
	const catIds = (cats ?? []).map((c) => c.id);
	if (!catIds.length) {
		console.error("No categories");
		process.exit(1);
	}

	const { data: item } = await supabase
		.from("menu_items")
		.select("id, price")
		.in("category_id", catIds)
		.eq("is_available", true)
		.limit(1)
		.maybeSingle();
	if (!item) {
		console.error("No menu item");
		process.exit(1);
	}

	const price = Number(item.price);

	const tasks = Array.from({ length: concurrency }, (_, i) =>
		(async () => {
			const guestId = `load_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`;
			const { data: order, error: oErr } = await supabase
				.from("orders")
				.insert({
					restaurant_id: rest.id,
					table_id: table.id,
					total_amount: price,
					guest_id: guestId,
					status: "pending",
				})
				.select("id")
				.single();
			if (oErr || !order) return { ok: false, err: oErr?.message ?? "no row" };

			const { error: oiErr } = await supabase.from("order_items").insert({
				order_id: order.id,
				menu_item_id: item.id,
				quantity: 1,
				price_at_time: price,
			});
			if (oiErr) {
				await supabase.from("orders").delete().eq("id", order.id);
				return { ok: false, err: oiErr.message };
			}
			return { ok: true as const };
		})(),
	);

	const results = await Promise.all(tasks);
	const ok = results.filter((r) => r.ok).length;
	const fail = results.length - ok;
	const ms = performance.now() - t0;

	console.log(JSON.stringify({
		concurrency,
		restaurantSlug: slug,
		tableNumber,
		success: ok,
		failed: fail,
		durationMs: Math.round(ms),
		ordersPerSecond: Math.round((ok / ms) * 1000),
	}, null, 2));

	if (fail > 0) {
		const first = results.find((r) => !r.ok) as { ok: false; err: string };
		console.error("First failure:", first?.err);
		process.exit(1);
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
