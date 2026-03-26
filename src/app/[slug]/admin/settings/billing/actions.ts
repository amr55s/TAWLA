"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function mockSubscribe(restaurantId: string, planId: string) {
	const supabase = await createClient();

	// Verify the caller owns this restaurant
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Not authenticated" };
	}

	const { data: restaurant } = await supabase
		.from("restaurants")
		.select("owner_id, slug")
		.eq("id", restaurantId)
		.maybeSingle();

	if (!restaurant || restaurant.owner_id !== user.id) {
		return { error: "Unauthorized" };
	}

	// Simulate successful payment — upgrade to Pro
	const currentPeriodEnd = new Date();
	currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

	const { error } = await supabase
		.from("restaurants")
		.update({
			plan: planId,
			subscription_status: "active",
			subscription_plan: planId,
			trial_ends_at: null,
			current_period_end: currentPeriodEnd.toISOString(),
			is_active: true,
		})
		.eq("id", restaurantId);

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/", "layout");
	if (restaurant.slug) {
		revalidatePath(`/${restaurant.slug}/admin`, "layout");
		revalidatePath(`/${restaurant.slug}/admin/settings/billing`, "page");
	}
	return { success: true };
}
