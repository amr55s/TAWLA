"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isRestaurantOrderingUnavailable } from "@/lib/billing/subscription-status";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// ─── Shared types ─────────────────────────────────────────────────────────────

type StaffCookie = {
	role: string;
	restaurant_id: string;
	slug: string;
};

type StaffOrderAuth =
	| { ok: true; staff: StaffCookie }
	| { ok: false; error: string };

type ActionResult = { ok: boolean; error: string | null };

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function getVerifiedStaffForOrderActions(
	restaurantId: string,
): Promise<StaffOrderAuth> {
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

/** Fetch restaurant and check subscription is still active. */
async function checkSubscription(restaurantId: string): Promise<ActionResult> {
	const admin = createAdminClient();
	const { data: restaurant, error } = await admin
		.from("restaurants")
		.select("plan, trial_ends_at, subscription_status, is_active")
		.eq("id", restaurantId)
		.maybeSingle();

	if (error || !restaurant) {
		return { ok: false, error: "Restaurant not found" };
	}

	const unavailable = isRestaurantOrderingUnavailable({
		plan: restaurant.plan,
		trialEndsAt: restaurant.trial_ends_at,
		subscriptionStatus: restaurant.subscription_status,
		isActive: restaurant.is_active,
	});

	if (unavailable) {
		return {
			ok: false,
			error: "Subscription expired – order updates are disabled",
		};
	}

	return { ok: true, error: null };
}

// ─── Public Server Actions ────────────────────────────────────────────────────

/**
 * Universal gatekeeper for order status transitions.
 *
 * Security checks (in order):
 *   1. Valid `tawla_staff_session` cookie belonging to this restaurant.
 *   2. Restaurant subscription is active / trialing (Ordering Freeze).
 *   3. The orderId actually belongs to restaurantId (Tenant Isolation).
 */
export async function updateOrderStatusServerSide(
	orderId: string,
	newStatus: string,
	restaurantId: string,
): Promise<ActionResult> {
	// ── Check 1: Auth ──
	const auth = await getVerifiedStaffForOrderActions(restaurantId);
	if (!auth.ok) return { ok: false, error: auth.error };

	// ── Check 2: Subscription ──
	const sub = await checkSubscription(restaurantId);
	if (!sub.ok) return { ok: false, error: sub.error };

	const admin = createAdminClient();

	// ── Check 3: Tenant Safety — verify order belongs to this restaurant ──
	const { data: order, error: fetchError } = await admin
		.from("orders")
		.select("id, restaurant_id, status")
		.eq("id", orderId)
		.eq("restaurant_id", restaurantId)
		.maybeSingle();

	if (fetchError || !order) {
		return { ok: false, error: "Order not found for this restaurant" };
	}

	// ── DB Write (admin client — bypasses RLS, triggers Realtime) ──
	const { error: updateError } = await admin
		.from("orders")
		.update({ status: newStatus })
		.eq("id", orderId)
		.eq("restaurant_id", restaurantId);

	if (updateError) {
		return { ok: false, error: updateError.message };
	}

	const { staff } = auth;
	revalidatePath(`/${staff.slug}/waiter`, "page");
	revalidatePath(`/${staff.slug}/cashier`, "page");
	revalidatePath(`/${staff.slug}/kds`, "page");

	return { ok: true, error: null };
}

/**
 * Clears a table: cancels all active orders + resolves all active waiter calls.
 * Tenant-safe: all writes are scoped to both tableUuid AND restaurantId.
 */
export async function clearTableServerSide(
	tableUuid: string,
	restaurantId: string,
): Promise<ActionResult> {
	// ── Check 1: Auth ──
	const auth = await getVerifiedStaffForOrderActions(restaurantId);
	if (!auth.ok) return { ok: false, error: auth.error };

	// ── Check 2: Subscription ──
	const sub = await checkSubscription(restaurantId);
	if (!sub.ok) return { ok: false, error: sub.error };

	const admin = createAdminClient();

	// Cancel all active orders for this table
	const { error: cancelError } = await admin
		.from("orders")
		.update({ status: "cancelled" })
		.eq("table_id", tableUuid)
		.eq("restaurant_id", restaurantId)
		.in("status", ["pending", "in_kitchen", "ready", "delivered"]);

	if (cancelError) {
		return { ok: false, error: cancelError.message };
	}

	// Resolve all active waiter calls for this table
	const { error: callsError } = await admin
		.from("waiter_calls")
		.update({ status: "resolved" })
		.eq("table_id", tableUuid)
		.eq("restaurant_id", restaurantId)
		.eq("status", "active");

	if (callsError) {
		return { ok: false, error: callsError.message };
	}

	const { staff } = auth;
	revalidatePath(`/${staff.slug}/waiter`, "page");
	revalidatePath(`/${staff.slug}/cashier`, "page");

	return { ok: true, error: null };
}

/**
 * Resolves all active waiter calls for a given table.
 * Tenant-safe: scoped to tableUuid AND restaurantId.
 */
export async function resolveWaiterCallServerSide(
	tableUuid: string,
	restaurantId: string,
): Promise<ActionResult> {
	// ── Check 1: Auth ──
	const auth = await getVerifiedStaffForOrderActions(restaurantId);
	if (!auth.ok) return { ok: false, error: auth.error };

	const admin = createAdminClient();

	const { error } = await admin
		.from("waiter_calls")
		.update({ status: "resolved" })
		.eq("table_id", tableUuid)
		.eq("restaurant_id", restaurantId)
		.eq("status", "active");

	if (error) {
		return { ok: false, error: error.message };
	}

	const { staff } = auth;
	revalidatePath(`/${staff.slug}/waiter`, "page");

	return { ok: true, error: null };
}

/**
 * Waiter picks up food from kitchen: `ready` → `delivered`.
 * Kept for backward-compat; now uses the unified gatekeeper.
 */
export async function markOrderAsDelivered(
	orderId: string,
): Promise<ActionResult> {
	const supabase = await createClient();

	// We need the restaurant_id first to run auth check
	const { data: order, error: fetchError } = await supabase
		.from("orders")
		.select("id, restaurant_id, status")
		.eq("id", orderId)
		.maybeSingle();

	if (fetchError || !order) {
		return { ok: false, error: fetchError?.message ?? "Order not found" };
	}

	if (order.status !== "ready") {
		return {
			ok: false,
			error: "Only orders ready for pickup can be marked as delivered",
		};
	}

	return updateOrderStatusServerSide(orderId, "delivered", order.restaurant_id);
}
