import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

const supabase = createClient();

interface Subscriptions {
	onOrderChange?: (payload: any) => void;
	onCallChange?: (payload: any) => void;
	onRestaurantChange?: (payload: any) => void;
}

/**
 * Encapsulates Supabase realtime channel management.
 * Guarantees zero memory leaks via perfect cleanup sweeps.
 */
export function useRestaurantRealtime(
	restaurantId: string | undefined,
	handlers: Subscriptions
) {
	// Destructure handlers so they can be securely added to dependencies
	const { onOrderChange, onCallChange, onRestaurantChange } = handlers;

	useEffect(() => {
		if (!restaurantId) return;

		const channels: ReturnType<typeof supabase.channel>[] = [];

		if (onOrderChange) {
			const ordChannel = supabase
				.channel(`realtime-orders-${restaurantId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "orders",
						filter: `restaurant_id=eq.${restaurantId}`,
					},
					onOrderChange
				)
				.subscribe((status, err) => {
					if (err) logger.error("Realtime orders subscription error", err);
				});
			channels.push(ordChannel);
		}

		if (onCallChange) {
			const callsChannel = supabase
				.channel(`realtime-calls-${restaurantId}`)
				.on(
					"postgres_changes",
					{
						event: "*",
						schema: "public",
						table: "waiter_calls",
						filter: `restaurant_id=eq.${restaurantId}`,
					},
					onCallChange
				)
				.subscribe((status, err) => {
					if (err) logger.error("Realtime calls subscription error", err);
				});
			channels.push(callsChannel);
		}

		if (onRestaurantChange) {
			const restChannel = supabase
				.channel(`realtime-restaurant-${restaurantId}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "restaurants",
						filter: `id=eq.${restaurantId}`,
					},
					onRestaurantChange
				)
				.subscribe((status, err) => {
					if (err) logger.error("Realtime restaurant subscription error", err);
				});
			channels.push(restChannel);
		}

		// Absolute memory cleanup
		return () => {
			channels.forEach((channel) => {
				supabase.removeChannel(channel);
			});
		};
	}, [restaurantId, onOrderChange, onCallChange, onRestaurantChange]);
}
