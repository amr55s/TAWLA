"use server";

import { createClient } from "@/lib/supabase/server";
import { getPlanDefinition, isPaidPlanId } from "@/lib/billing/plans";

export async function checkSubscriptionStatus(restaurantId: string) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return {
			ok: false,
			error: "Unauthorized",
			requiresPayment: false,
		};
	}

	const { data: restaurant, error } = await supabase
		.from("restaurants")
		.select(
			"id, owner_id, slug, plan, trial_ends_at, is_active, max_tables, max_orders_monthly",
		)
		.eq("id", restaurantId)
		.maybeSingle();

	if (error || !restaurant) {
		return {
			ok: false,
			error: error?.message ?? "Restaurant not found",
			requiresPayment: false,
		};
	}

	if (restaurant.owner_id !== user.id) {
		return {
			ok: false,
			error: "Unauthorized",
			requiresPayment: false,
		};
	}

	const isTrial = restaurant.plan === "trial";
	const isExpired =
		isTrial &&
		Boolean(restaurant.trial_ends_at) &&
		new Date(restaurant.trial_ends_at).getTime() < Date.now();

	return {
		ok: true,
		error: null,
		requiresPayment: Boolean(isExpired),
		slug: restaurant.slug,
		plan: restaurant.plan,
		trialEndsAt: restaurant.trial_ends_at,
		isActive: restaurant.is_active,
		maxTables: restaurant.max_tables,
		maxOrdersMonthly: restaurant.max_orders_monthly,
	};
}

export async function getCheckoutPlanSummary(planId: string) {
	if (!isPaidPlanId(planId)) {
		return { ok: false, error: "Invalid plan" };
	}

	return {
		ok: true,
		error: null,
		plan: getPlanDefinition(planId),
	};
}
