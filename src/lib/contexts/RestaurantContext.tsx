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

interface RestaurantContextType {
	restaurantId: string | null;
	slug: string | null;
	loading: boolean;
	error: string | null;
	subscriptionStatus: string | null;
	trialEndsAt: string | null;
	isActive: boolean | null;
	currencySymbol: string;
}

const RestaurantContext = createContext<RestaurantContextType>({
	restaurantId: null,
	slug: null,
	loading: true,
	error: null,
	subscriptionStatus: null,
	trialEndsAt: null,
	isActive: null,
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
	const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
	const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
	const [isActive, setIsActive] = useState<boolean | null>(null);
	const [currencySymbol, setCurrencySymbol] = useState<string>("EGP");

	const router = useRouter();

	useEffect(() => {
		let mounted = true;
		const supabase = createClient();
		const fetchRestaurant = async () => {
			let currentSlug: string | null = initialSlug || null;
			try {
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
						.select("id, owner_id, slug, subscription_status, trial_ends_at, is_active, currency_symbol")
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
						setSubscriptionStatus(data.subscription_status ?? null);
						setTrialEndsAt(data.trial_ends_at ?? null);
						setIsActive(data.is_active ?? null);
						setCurrencySymbol((data as any).currency_symbol || "EGP");
					}
				} else {
					// Fallback if no initialSlug provided
					let query = supabase.from("restaurants").select("id, slug, subscription_status, trial_ends_at, is_active");

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
							setSubscriptionStatus(data[0].subscription_status ?? null);
							setTrialEndsAt(data[0].trial_ends_at ?? null);
							setIsActive(data[0].is_active ?? null);
							setCurrencySymbol((data[0] as any).currency_symbol || "EGP");
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

	return (
		<RestaurantContext.Provider value={{ restaurantId, slug, loading, error, subscriptionStatus, trialEndsAt, isActive, currencySymbol }}>
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
