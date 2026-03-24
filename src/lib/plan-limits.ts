export const PLAN_LIMITS = {
	starter: {
		tables: 5,
		menuItems: 30,
		staff: 1,
		label: "Starter",
	},
	pro: {
		tables: 25,
		menuItems: Infinity,
		staff: 5,
		label: "Professional",
	},
	enterprise: {
		tables: Infinity,
		menuItems: Infinity,
		staff: Infinity,
		label: "Enterprise",
	},
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

export function getPlanLimits(planId: string | null | undefined) {
	const id = (planId || "starter") as PlanId;
	return PLAN_LIMITS[id] || PLAN_LIMITS.starter;
}
