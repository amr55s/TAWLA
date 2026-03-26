import { createClient } from "@/lib/supabase/server";
import { isRestaurantPlan } from "@/lib/billing/plans";
import { SuperAdminDashboard } from "./SuperAdminDashboard";
import type { SuperAdminRestaurant } from "./types";

export default async function SuperAdminPage() {
	const supabase = await createClient();

	const { data: restaurants, error } = await supabase
		.from("restaurants")
		.select(
			"id, name, slug, plan, subscription_status, trial_ends_at, current_period_end, is_active, created_at",
		)
		.order("created_at", { ascending: false });

	const allRestaurants: SuperAdminRestaurant[] = (restaurants ?? []).map(
		(restaurant) => ({
			id: restaurant.id,
			name: restaurant.name,
			slug: restaurant.slug,
			plan: isRestaurantPlan(restaurant.plan) ? restaurant.plan : null,
			subscriptionStatus: restaurant.subscription_status ?? null,
			trialEndsAt: restaurant.trial_ends_at ?? null,
			currentPeriodEnd: restaurant.current_period_end ?? null,
			isActive: restaurant.is_active ?? true,
			createdAt: restaurant.created_at ?? null,
		}),
	);

	return (
		<SuperAdminDashboard
			restaurants={allRestaurants}
			error={error?.message ?? null}
		/>
	);
}
