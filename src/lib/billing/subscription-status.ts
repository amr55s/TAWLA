import type { RestaurantPlan } from "@/lib/billing/plans";

type SubscriptionStatusInput = {
	plan: RestaurantPlan | null | undefined;
	trialEndsAt: string | null | undefined;
	subscriptionStatus: string | null | undefined;
	isActive?: boolean | null | undefined;
};

export function isRestaurantExpired({
	plan,
	trialEndsAt,
	subscriptionStatus,
}: SubscriptionStatusInput): boolean {
	const isTrialExpired =
		plan === "trial" &&
		Boolean(trialEndsAt) &&
		new Date(trialEndsAt as string).getTime() < Date.now();

	const isPaidPlanExpired =
		Boolean(plan && plan !== "trial") && subscriptionStatus !== "active";

	return Boolean(isTrialExpired || isPaidPlanExpired);
}

export function isRestaurantOrderingUnavailable({
	plan,
	trialEndsAt,
	subscriptionStatus,
	isActive,
}: SubscriptionStatusInput): boolean {
	return isActive === false
		? true
		: isRestaurantExpired({ plan, trialEndsAt, subscriptionStatus });
}
