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
		.select("owner_id")
		.eq("id", restaurantId)
		.maybeSingle();

	if (!restaurant || restaurant.owner_id !== user.id) {
		return { error: "Unauthorized" };
	}

	// Simulate successful payment — upgrade to Pro
	const currentPeriodEnd = new Date();
	currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

	const { error } = await supabase
		.from("restaurants")
		.update({
			subscription_status: "active",
			subscription_plan: planId,
			current_period_end: currentPeriodEnd.toISOString(),
			is_active: true,
		})
		.eq("id", restaurantId);

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/", "layout");
	return { success: true };
}
