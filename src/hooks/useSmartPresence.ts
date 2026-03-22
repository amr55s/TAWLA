import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";

export function useSmartPresence(staffId: string | null, restaurantId: string | null) {
	const lastUpdateRef = useRef<number>(0);

	useEffect(() => {
		if (!staffId || !restaurantId) return;

		const supabase = createClient();
		
		const updatePresence = async () => {
			const now = Date.now();
			// Throttle to max once every 2 minutes (120,000 ms)
			if (now - lastUpdateRef.current < 120000) return;
			
			lastUpdateRef.current = now;
			
			try {
				const { error } = await supabase
					.from("restaurant_staff")
					.update({ last_active_at: new Date().toISOString() })
					.eq("id", staffId)
					.eq("restaurant_id", restaurantId);
				if (error) throw error;
			} catch (e) {
				logger.error("Presence update failed", e);
			}
		};

		// Initial heartbeat
		updatePresence();

		// Activity listeners
		const events = ["click", "touchstart", "keydown", "scroll"];
		events.forEach(event => {
			window.addEventListener(event, updatePresence, { passive: true });
		});

		return () => {
			events.forEach(event => {
				window.removeEventListener(event, updatePresence);
			});
		};
	}, [staffId, restaurantId]);
}
