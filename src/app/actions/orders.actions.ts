"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

type StaffCookie = {
	role: string;
	restaurant_id: string;
	slug: string;
};

type StaffOrderAuth =
	| { ok: true; staff: StaffCookie }
	| { ok: false; error: string };

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

/**
 * Waiter picks up food from kitchen: `ready` → `delivered`.
 * Table stays in normal active flow until cashier marks paid / completed.
 */
export async function markOrderAsDelivered(
	orderId: string,
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

	const auth = await getVerifiedStaffForOrderActions(order.restaurant_id);
	if (!auth.ok) {
		return { ok: false, error: auth.error };
	}
	const { staff } = auth;

	if (order.status !== "ready") {
		return {
			ok: false,
			error: "Only orders ready for pickup can be marked as delivered",
		};
	}

	const { error: updateError } = await supabase
		.from("orders")
		.update({ status: "delivered" })
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
