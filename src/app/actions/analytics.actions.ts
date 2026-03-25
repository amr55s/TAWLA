"use server";

import { createClient } from "@/lib/supabase/server";

export async function getAveragePrepTime(restaurantId: string): Promise<{
	averageMinutes: number;
	error: string | null;
}> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("orders")
		.select("created_at, updated_at")
		.eq("restaurant_id", restaurantId)
		.in("status", ["ready", "delivered"])
		.order("created_at", { ascending: false })
		.limit(100); // Sample last 100 orders for performance

	if (error) {
		return { averageMinutes: 0, error: error.message };
	}

	if (!data || data.length === 0) {
		return { averageMinutes: 0, error: null };
	}

	let totalMinutes = 0;
	let count = 0;

	for (const order of data) {
		if (order.created_at && order.updated_at) {
			const start = new Date(order.created_at).getTime();
			const end = new Date(order.updated_at).getTime();
			const diffMs = end - start;
			
			// Only count positive differences (sanity check)
			if (diffMs > 0) {
				totalMinutes += diffMs / (1000 * 60);
				count++;
			}
		}
	}

	const averageMinutes = count > 0 ? Math.round(totalMinutes / count) : 0;

	return { averageMinutes, error: null };
}

export async function getKitchenPerformance(restaurantId: string): Promise<{
	averageMinutes: number;
	morningAverageMinutes: number;
	eveningAverageMinutes: number;
	error: string | null;
}> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("orders")
		.select("created_at, updated_at")
		.eq("restaurant_id", restaurantId)
		.in("status", ["ready", "delivered", "closed"])
		.order("created_at", { ascending: false })
		.limit(200);

	if (error) {
		return {
			averageMinutes: 0,
			morningAverageMinutes: 0,
			eveningAverageMinutes: 0,
			error: error.message,
		};
	}

	if (!data || data.length === 0) {
		return {
			averageMinutes: 0,
			morningAverageMinutes: 0,
			eveningAverageMinutes: 0,
			error: null,
		};
	}

	let totalMinutes = 0;
	let totalCount = 0;

	let morningMinutes = 0;
	let morningCount = 0;

	let eveningMinutes = 0;
	let eveningCount = 0;

	for (const order of data) {
		if (order.created_at && order.updated_at) {
			const start = new Date(order.created_at);
			const end = new Date(order.updated_at);
			const diffMs = end.getTime() - start.getTime();

			if (diffMs > 0) {
				const diffMins = diffMs / (1000 * 60);
				totalMinutes += diffMins;
				totalCount++;

				const hour = start.getHours();
				// Morning: 06:00 - 16:00
				if (hour >= 6 && hour < 16) {
					morningMinutes += diffMins;
					morningCount++;
				} 
				// Evening: 16:00 - 02:00 (next day)
				else if (hour >= 16 || hour < 2) {
					eveningMinutes += diffMins;
					eveningCount++;
				}
			}
		}
	}

	return {
		averageMinutes: totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0,
		morningAverageMinutes:
			morningCount > 0 ? Math.round(morningMinutes / morningCount) : 0,
		eveningAverageMinutes:
			eveningCount > 0 ? Math.round(eveningMinutes / eveningCount) : 0,
		error: null,
	};
}
