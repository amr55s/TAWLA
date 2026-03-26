"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isRestaurantOrderingUnavailable } from "@/lib/billing/subscription-status";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import type { KdsOrderRow, KdsOrderStatusUpdate } from "@/types/kds";

const KDS_QUEUE_STATUSES = ["in_kitchen", "ready"] as const;

type StaffCookie = {
	role: string;
	restaurant_id: string;
	slug: string;
};

type StaffKdsAuth =
	| { ok: true; staff: StaffCookie }
	| { ok: false; error: string };

async function getVerifiedStaffForKds(
	restaurantId: string,
): Promise<StaffKdsAuth> {
	const cookieStore = await cookies();
	const raw = cookieStore.get("tawla_staff_session")?.value;
	if (!raw) {
		return { ok: false, error: "Unauthorized" };
	}

	let parsed: StaffCookie;
	try {
		parsed = JSON.parse(raw) as StaffCookie;
	} catch {
		return { ok: false, error: "Unauthorized" };
	}

	if (
		!parsed?.restaurant_id ||
		!parsed?.slug ||
		!parsed?.role ||
		parsed.restaurant_id !== restaurantId
	) {
		return { ok: false, error: "Unauthorized" };
	}

	const allowed =
		parsed.role === "owner" ||
		parsed.role === "admin" ||
		parsed.role === "waiter" ||
		parsed.role === "cashier";

	if (!allowed) {
		return { ok: false, error: "Unauthorized" };
	}

	return { ok: true, staff: parsed };
}

function unwrapOne<T>(x: T | T[] | null | undefined): T | null {
	if (x == null) return null;
	return Array.isArray(x) ? (x[0] ?? null) : x;
}

function normalizeKdsOrders(raw: unknown): KdsOrderRow[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((row) => {
		const r = row as Record<string, unknown>;
		const itemsRaw = r.items;
		const lines = Array.isArray(itemsRaw) ? itemsRaw : [];
		const items = lines.map((line) => {
			const li = line as Record<string, unknown>;
			const mi = unwrapOne(li.menu_item as object | object[] | null) as {
				name_en: string;
				name_ar: string;
			} | null;
			return {
				id: String(li.id),
				quantity: Number(li.quantity),
				special_requests: (li.special_requests as string | null) ?? null,
				menu_item: mi
					? {
							name_en: String(mi.name_en ?? ""),
							name_ar: String(mi.name_ar ?? ""),
						}
					: null,
			};
		});
		const tbl = unwrapOne(r.table as object | object[] | null) as {
			table_number: number;
		} | null;
		return {
			id: String(r.id),
			status: String(r.status),
			created_at: String(r.created_at),
			special_requests: (r.special_requests as string | null) ?? null,
			table: tbl ? { table_number: Number(tbl.table_number) } : null,
			items,
		};
	});
}

export async function fetchActiveKdsOrders(restaurantId: string): Promise<{
	data: KdsOrderRow[] | null;
	error: string | null;
}> {
	const auth = await getVerifiedStaffForKds(restaurantId);
	if (!auth.ok) {
		return { data: null, error: auth.error };
	}

	const supabase = await createClient();

	const { data, error: qError } = await supabase
		.from("orders")
		.select(
			`
      id,
      status,
      created_at,
      special_requests,
      table:tables(table_number),
      items:order_items(
        id,
        quantity,
        special_requests,
        menu_item:menu_items(name_en, name_ar)
      )
    `,
		)
		.eq("restaurant_id", restaurantId)
		.in("status", [...KDS_QUEUE_STATUSES])
		.order("created_at", { ascending: true });

	if (qError) {
		return { data: null, error: qError.message };
	}

	return { data: normalizeKdsOrders(data), error: null };
}

export async function updateOrderStatus(
	orderId: string,
	newStatus: KdsOrderStatusUpdate,
): Promise<{ ok: boolean; error: string | null }> {
	const supabase = await createClient();

	const { data: order, error: fetchError } = await supabase
		.from("orders")
		.select("id, restaurant_id, status")
		.eq("id", orderId)
		.maybeSingle();

	if (fetchError || !order) {
		return { ok: false, error: fetchError?.message ?? "Order not found" };
	}

	// ── Auth ──
	const auth = await getVerifiedStaffForKds(order.restaurant_id);
	if (!auth.ok) {
		return { ok: false, error: auth.error };
	}
	const { staff } = auth;

	// ── Subscription / Ordering Freeze check ──
	const admin = createAdminClient();
	const { data: restaurant } = await admin
		.from("restaurants")
		.select("plan, trial_ends_at, subscription_status, is_active")
		.eq("id", order.restaurant_id)
		.maybeSingle();

	if (
		restaurant &&
		isRestaurantOrderingUnavailable({
			plan: restaurant.plan,
			trialEndsAt: restaurant.trial_ends_at,
			subscriptionStatus: restaurant.subscription_status,
			isActive: restaurant.is_active,
		})
	) {
		return {
			ok: false,
			error: "Subscription expired – order updates are disabled",
		};
	}

	const prev = order.status as string;

	let valid = false;
	if (newStatus === "ready") {
		valid = prev === "in_kitchen";
	} else if (newStatus === "in_kitchen") {
		valid = prev === "ready";
	}

	if (!valid) {
		return { ok: false, error: "Invalid status transition" };
	}

	// ── Write using admin client (ensures Realtime fires, bypasses RLS) ──
	const { error: updateError } = await admin
		.from("orders")
		.update({ status: newStatus })
		.eq("id", orderId)
		.eq("restaurant_id", order.restaurant_id);

	if (updateError) {
		return { ok: false, error: updateError.message };
	}

	revalidatePath(`/${staff.slug}/waiter`, "page");
	revalidatePath(`/${staff.slug}/cashier`, "page");
	revalidatePath(`/${staff.slug}/kds`, "page");

	return { ok: true, error: null };
}
