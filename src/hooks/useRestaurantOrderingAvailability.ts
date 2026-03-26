"use client";

import { useEffect, useState } from "react";
import { isRestaurantOrderingUnavailable } from "@/lib/billing/subscription-status";
import { getRestaurantBySlugClient } from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";

type RestaurantOrderingRecord = {
	id: string;
	plan: "trial" | "starter" | "pro" | "enterprise" | null;
	trial_ends_at: string | null;
	subscription_status: string | null;
	is_active: boolean | null;
};

export function useRestaurantOrderingAvailability(
	slug: string,
	initialValue = false,
) {
	const [orderingUnavailable, setOrderingUnavailable] = useState(initialValue);

	useEffect(() => {
		let cancelled = false;
		const supabase = createClient();

		const applyRecord = (restaurant: RestaurantOrderingRecord | null) => {
			if (!restaurant || cancelled) return;

			setOrderingUnavailable(
				isRestaurantOrderingUnavailable({
					plan: restaurant.plan,
					trialEndsAt: restaurant.trial_ends_at,
					subscriptionStatus: restaurant.subscription_status,
					isActive: restaurant.is_active,
				}),
			);
		};

		const hydrate = async () => {
			const restaurant = await getRestaurantBySlugClient(slug);
			if (!restaurant || cancelled) return;

			applyRecord(restaurant as RestaurantOrderingRecord);

			const channel = supabase
				.channel(`guest-ordering-availability-${restaurant.id}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "restaurants",
						filter: `id=eq.${restaurant.id}`,
					},
					(payload) => {
						applyRecord(payload.new as RestaurantOrderingRecord);
					},
				)
				.subscribe();

			return channel;
		};

		const channelPromise = hydrate();

		return () => {
			cancelled = true;
			void Promise.resolve(channelPromise).then((channel) => {
				if (channel) {
					supabase.removeChannel(channel);
				}
			});
		};
	}, [slug]);

	return orderingUnavailable;
}
