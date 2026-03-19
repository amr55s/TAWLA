"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface RestaurantContextType {
	restaurantId: string | null;
	slug: string | null;
	loading: boolean;
	error: string | null;
}

const RestaurantContext = createContext<RestaurantContextType>({
	restaurantId: null,
	slug: null,
	loading: true,
	error: null,
});

export function RestaurantProvider({
	children,
	initialSlug,
}: {
	children: ReactNode;
	initialSlug?: string;
}) {
	const [restaurantId, setRestaurantId] = useState<string | null>(null);
	const [slug, setSlug] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		const fetchRestaurant = async () => {
			try {
				const supabase = createClient();
				const {
					data: { user },
					error: authError,
				} = await supabase.auth.getUser();

				if (authError) throw authError;
				if (!user) throw new Error("Not authenticated");

				let currentRestId = user.user_metadata?.restaurant_id as
					| string
					| undefined;
				let currentSlug: string | null = null;

				if (initialSlug) {
					const { data, error: dbError } = await supabase
						.from("restaurants")
						.select("id, owner_id, slug")
						.eq("slug", initialSlug)
						.maybeSingle();

					if (dbError) throw dbError;
					if (!data) throw new Error("Restaurant not found");

					const isOwner = data.owner_id === user.id;
					const isStaff = currentRestId === data.id;

					if (!isOwner && !isStaff) {
						throw new Error("Unauthorized for this restaurant");
					}

					currentRestId = data.id;
					currentSlug = data.slug;
				} else {
					// Fallback if no initialSlug provided
					let query = supabase.from("restaurants").select("id, slug");

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
					} else {
						throw new Error("No restaurant found for this user");
					}
				}

				if (mounted) {
					setRestaurantId(currentRestId || null);
					setSlug(currentSlug);
				}
			} catch (err: any) {
				console.error("Restaurant fetch error:", err.message || err);
				if (mounted) setError(err.message || "Failed to initialize context");
			} finally {
				if (mounted) setLoading(false);
			}
		};

		fetchRestaurant();

		return () => {
			mounted = false;
		};
	}, [initialSlug]);

	return (
		<RestaurantContext.Provider value={{ restaurantId, slug, loading, error }}>
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
