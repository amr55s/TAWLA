import type { RestaurantPlan } from "@/lib/billing/plans";

export type SuperAdminRestaurant = {
	id: string;
	name: string;
	slug: string;
	plan: RestaurantPlan | null;
	subscriptionStatus: string | null;
	trialEndsAt: string | null;
	currentPeriodEnd: string | null;
	isActive: boolean;
	createdAt: string | null;
};
