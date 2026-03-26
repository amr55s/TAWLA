"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RestaurantPlan } from "@/lib/billing/plans";
import { isRestaurantExpired } from "@/lib/billing/subscription-status";

type RestaurantRecord = {
	id: string;
	slug: string;
	plan: RestaurantPlan | null;
	subscription_status: string | null;
	trial_ends_at: string | null;
	is_active: boolean | null;
	currency_symbol?: string | null;
	is_master?: boolean | null;
	parent_id?: string | null;
	max_tables?: number | null;
	max_orders_monthly?: number | null;
};

interface RestaurantContextType {
	restaurantId: string | null;
	slug: string | null;
	loading: boolean;
	error: string | null;
	plan: RestaurantPlan | null;
	subscriptionStatus: string | null;
	trialEndsAt: string | null;
	isExpired: boolean;
	isActive: boolean | null;
	isMaster: boolean;
	parentId: string | null;
	maxTables: number | null;
	maxOrdersMonthly: number | null;
	currencySymbol: string;
}

const RestaurantContext = createContext<RestaurantContextType>({
	restaurantId: null,
	slug: null,
	loading: true,
	error: null,
	plan: null,
	subscriptionStatus: null,
	trialEndsAt: null,
	isExpired: false,
	isActive: null,
	isMaster: false,
	parentId: null,
	maxTables: null,
	maxOrdersMonthly: null,
	currencySymbol: "EGP",
});

export function RestaurantProvider({
	children,
	initialSlug,
	requireAdmin = false,
}: {
	children: ReactNode;
	initialSlug?: string;
	requireAdmin?: boolean;
}) {
	const [restaurantId, setRestaurantId] = useState<string | null>(null);
	const [slug, setSlug] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [plan, setPlan] = useState<RestaurantPlan | null>(null);
	const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
	const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
	const [isActive, setIsActive] = useState<boolean | null>(null);
	const [isMaster, setIsMaster] = useState(false);
	const [parentId, setParentId] = useState<string | null>(null);
	const [maxTables, setMaxTables] = useState<number | null>(null);
	const [maxOrdersMonthly, setMaxOrdersMonthly] = useState<number | null>(null);
	const [currencySymbol, setCurrencySymbol] = useState<string>("EGP");

	const router = useRouter();
	const isExpired = isRestaurantExpired({
		plan,
		trialEndsAt,
		subscriptionStatus,
	});

	const applyRestaurantRecord = (record: RestaurantRecord) => {
		setPlan(record.plan ?? null);
		setSubscriptionStatus(
			record.subscription_status ??
				(record.plan === "trial" ? "trialing" : record.plan ? "active" : null),
		);
		setTrialEndsAt(record.trial_ends_at ?? null);
		setIsActive(record.is_active ?? null);
		setIsMaster(Boolean(record.is_master));
		setParentId((record.parent_id as string | null) ?? null);
		setMaxTables((record.max_tables as number | null) ?? null);
		setMaxOrdersMonthly((record.max_orders_monthly as number | null) ?? null);
		setCurrencySymbol(record.currency_symbol || "EGP");
	};

	useEffect(() => {
		let mounted = true;
		const supabase = createClient();
		const fetchRestaurant = async () => {
			let currentSlug: string | null = initialSlug || null;
			try {
				if (mounted) {
					setLoading(true);
					setError(null);
				}

				const {
					data: { user },
					error: authError,
				} = await supabase.auth.getUser();

				if (authError) throw authError;
				if (!user) throw new Error("Not authenticated");

				let currentRestId = user.user_metadata?.restaurant_id as
					| string
					| undefined;

				if (initialSlug) {
					const { data, error: dbError } = await supabase
						.from("restaurants")
						.select("id, owner_id, slug, plan, subscription_status, trial_ends_at, is_active, currency_symbol, is_master, parent_id, max_tables, max_orders_monthly")
						.eq("slug", initialSlug)
						.maybeSingle();

					if (dbError) throw dbError;
					if (!data) throw new Error("Restaurant not found");

					const isOwner = data.owner_id === user.id;
					const isStaff = currentRestId === data.id;

					if (!isOwner && !isStaff) {
						throw new Error("Unauthorized for this restaurant");
					}

					if (requireAdmin) {
						const role = user.user_metadata?.role;
						if (role === 'waiter' || role === 'cashier') {
							window.location.href = `/${data.slug}/${role}`;
							return;
						}
					}

					currentRestId = data.id;
					currentSlug = data.slug;
					if (mounted) {
						applyRestaurantRecord(data as RestaurantRecord);
					}
				} else {
					// Fallback if no initialSlug provided
					let query = supabase
						.from("restaurants")
						.select("id, slug, plan, subscription_status, trial_ends_at, is_active, currency_symbol, is_master, parent_id, max_tables, max_orders_monthly");

					if (currentRestId) {
						query = query.or(`owner_id.eq.${user.id},id.eq.${currentRestId}`);
					} else {
						query = query.eq("owner_id", user.id);
					}

					const { data, error: dbError } = await query.limit(1);

					if (dbError) throw dbError;
					if (data && data.length > 0) {
						currentRestId = data[0].id;
						currentSlug = data[0].slug;
						if (mounted) {
							applyRestaurantRecord(data[0] as RestaurantRecord);
						}
						if (requireAdmin) {
							const role = user.user_metadata?.role;
							if (role === 'waiter' || role === 'cashier') {
								window.location.href = `/${currentSlug}/${role}`;
								return;
							}
						}
					} else {
						throw new Error("No restaurant found for this user");
					}
				}

				if (mounted) {
					setRestaurantId(currentRestId || null);
					setSlug(currentSlug);
				}
			} catch (err: any) {
				const msg = err.message || "";
				if (msg.includes("Auth session missing") || msg.includes("JWT")) {
					if (mounted) {
						setRestaurantId(null);
						setSlug(null);
					}
					if (requireAdmin) {
						router.push("/" + (initialSlug || currentSlug) + "/login");
					}
				} else {
					console.error("Restaurant fetch error:", msg || err);
					if (mounted) setError(msg || "Failed to initialize context");
				}
			} finally {
				if (mounted) setLoading(false);
			}
		};

		fetchRestaurant();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === "SIGNED_OUT") {
				if (mounted) {
					setRestaurantId(null);
					setSlug(null);
				}
				router.push("/" + (initialSlug || slug) + "/login");
			} else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
				if (mounted) {
					fetchRestaurant();
				}
			}
		});

		return () => {
			mounted = false;
			subscription.unsubscribe();
		};
	}, [initialSlug, requireAdmin, router]);

	useEffect(() => {
		if (!restaurantId) return;

		const supabase = createClient();
		const channel = supabase
			.channel(`restaurant-context-${restaurantId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "restaurants",
					filter: `id=eq.${restaurantId}`,
				},
				(payload) => {
					applyRestaurantRecord(payload.new as unknown as RestaurantRecord);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [restaurantId]);

	return (
		<RestaurantContext.Provider
			value={{
				restaurantId,
				slug,
				loading,
				error,
				plan,
				subscriptionStatus,
				trialEndsAt,
				isExpired,
				isActive,
				isMaster,
				parentId,
				maxTables,
				maxOrdersMonthly,
				currencySymbol,
			}}
		>
			{children}
		</RestaurantContext.Provider>
	);
}

export function useRestaurant() {
	const context = useContext(RestaurantContext);
	if (context === undefined) {
		throw new Error("useRestaurant must be used within a RestaurantProvider");
	}
	return context;
}
