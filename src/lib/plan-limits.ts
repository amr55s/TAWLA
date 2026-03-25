import { PLAN_CATALOG, type RestaurantPlan, isRestaurantPlan } from "@/lib/billing/plans";

export const PLAN_LIMITS = {
	trial: {
		tables: PLAN_CATALOG.trial.maxTables,
		menuItems: Infinity,
		staff: PLAN_CATALOG.trial.maxStaff ?? Infinity,
		label: PLAN_CATALOG.trial.label,
	},
	starter: {
		tables: PLAN_CATALOG.starter.maxTables,
		menuItems: 30,
		staff: PLAN_CATALOG.starter.maxStaff ?? Infinity,
		label: PLAN_CATALOG.starter.label,
	},
	pro: {
		tables: PLAN_CATALOG.pro.maxTables,
		menuItems: Infinity,
		staff: PLAN_CATALOG.pro.maxStaff ?? Infinity,
		label: PLAN_CATALOG.pro.label,
	},
	enterprise: {
		tables: PLAN_CATALOG.enterprise.maxTables,
		menuItems: Infinity,
		staff: PLAN_CATALOG.enterprise.maxStaff ?? Infinity,
		label: PLAN_CATALOG.enterprise.label,
	},
} as const;

export type PlanId = keyof typeof PLAN_LIMITS;

export function getPlanLimits(planId: string | null | undefined) {
	const id: RestaurantPlan = isRestaurantPlan(planId) ? planId : "trial";
	return PLAN_LIMITS[id];
}
