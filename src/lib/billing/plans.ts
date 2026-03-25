export type RestaurantPlan = "trial" | "starter" | "pro" | "enterprise";
export type PaidPlanId = Exclude<RestaurantPlan, "trial">;

export type PlanDefinition = {
	id: RestaurantPlan;
	label: string;
	monthlyPriceUsd: number;
	monthlyPriceEgp: number;
	maxTables: number;
	maxOrdersMonthly: number | null;
	maxStaff: number | null;
	multiBranch: boolean;
	features: string[];
};

export const PLAN_CATALOG: Record<RestaurantPlan, PlanDefinition> = {
	trial: {
		id: "trial",
		label: "Trial",
		monthlyPriceUsd: 0,
		monthlyPriceEgp: 0,
		maxTables: 30,
		maxOrdersMonthly: 300,
		maxStaff: 5,
		multiBranch: false,
		features: [
			"14-day Pro trial",
			"Waiter + KDS included",
			"Single branch",
			"Up to 30 tables",
		],
	},
	starter: {
		id: "starter",
		label: "Starter",
		monthlyPriceUsd: 15,
		monthlyPriceEgp: 750,
		maxTables: 15,
		maxOrdersMonthly: null,
		maxStaff: 3,
		multiBranch: false,
		features: [
			"15 Tables",
			"QR Menu",
			"Basic KDS",
			"Waiter calling",
			"1 Branch",
			"3 Staff accounts",
			"Basic Analytics",
			"Standard Email Support",
		],
	},
	pro: {
		id: "pro",
		label: "Pro",
		monthlyPriceUsd: 50,
		monthlyPriceEgp: 2500,
		maxTables: 30,
		maxOrdersMonthly: 300,
		maxStaff: 8,
		multiBranch: false,
		features: [
			"Everything in Starter, plus:",
			"30 Tables",
			"300 Orders/mo",
			"Full Kitchen Display System (Audio & Undo)",
			"Advanced Waiter Tablet Flow",
			"8 Staff Accounts",
			"Priority WhatsApp Support",
		],
	},
	enterprise: {
		id: "enterprise",
		label: "Enterprise",
		monthlyPriceUsd: 100,
		monthlyPriceEgp: 5000,
		maxTables: 999,
		maxOrdersMonthly: 9999,
		maxStaff: null,
		multiBranch: true,
		features: [
			"Everything in Pro, plus:",
			"Unlimited Tables & Orders",
			"Multi-branch HQ Dashboard",
			"Cross-branch Analytics",
			"Unlimited Staff",
			"Custom Integrations",
			"Dedicated Account Manager",
		],
	},
};

export function isRestaurantPlan(value: string | null | undefined): value is RestaurantPlan {
	return value === "trial" || value === "starter" || value === "pro" || value === "enterprise";
}

export function isPaidPlanId(value: string | null | undefined): value is PaidPlanId {
	return value === "starter" || value === "pro" || value === "enterprise";
}

export function getPlanDefinition(plan: string | null | undefined): PlanDefinition {
	if (isRestaurantPlan(plan)) return PLAN_CATALOG[plan];
	return PLAN_CATALOG.trial;
}

export function getRecommendedUpgrade(plan: RestaurantPlan): PaidPlanId {
	if (plan === "starter" || plan === "trial") return "pro";
	return "enterprise";
}
