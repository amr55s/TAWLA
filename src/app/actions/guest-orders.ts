"use server";

import { createClient } from "@/lib/supabase/server";
import { isRestaurantOrderingUnavailable } from "@/lib/billing/subscription-status";
import type { Order, OrderStatus } from "@/types/database";

export interface CreateGuestOrderInput {
	restaurant_id: string;
	table_id: string;
	total_amount?: number;
	special_requests?: string;
	qr_code_data?: string;
	guest_id?: string;
	status?: OrderStatus;
	items: {
		menu_item_id: string;
		quantity: number;
		price_at_time?: number;
	}[];
}

export async function createGuestOrder(
	input: CreateGuestOrderInput,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
	const supabase = await createClient();

	if (!input.items.length) {
		return { ok: false, error: "No items in order." };
	}

	const normalizedItems = input.items.map((item) => ({
		menu_item_id: item.menu_item_id,
		quantity: Number(item.quantity),
	}));

	if (
		normalizedItems.some(
			(item) =>
				!item.menu_item_id ||
				!Number.isInteger(item.quantity) ||
				item.quantity <= 0,
		)
	) {
		return { ok: false, error: "Invalid order item payload." };
	}

	const { data: restaurant, error: restaurantError } = await supabase
		.from("restaurants")
		.select("id, plan, trial_ends_at, subscription_status, is_active, max_orders_monthly")
		.eq("id", input.restaurant_id)
		.maybeSingle();

	if (restaurantError || !restaurant) {
		return {
			ok: false,
			error: restaurantError?.message ?? "Restaurant not found.",
		};
	}

	if (
		isRestaurantOrderingUnavailable({
			plan: restaurant.plan,
			trialEndsAt: restaurant.trial_ends_at,
			subscriptionStatus: restaurant.subscription_status,
			isActive: restaurant.is_active,
		})
	) {
		return {
			ok: false,
			error: "Ordering is currently unavailable for this restaurant.",
		};
	}

	if (restaurant.max_orders_monthly != null) {
		const monthStart = new Date();
		monthStart.setDate(1);
		monthStart.setHours(0, 0, 0, 0);

		const { count: monthlyOrderCount, error: monthlyOrderCountError } =
			await supabase
				.from("orders")
				.select("id", { count: "exact", head: true })
				.eq("restaurant_id", input.restaurant_id)
				.gte("created_at", monthStart.toISOString());

		if (monthlyOrderCountError) {
			return {
				ok: false,
				error:
					monthlyOrderCountError.message ??
					"Failed to validate monthly order volume.",
			};
		}

		if ((monthlyOrderCount ?? 0) >= restaurant.max_orders_monthly) {
			return {
				ok: false,
				error: `This restaurant has reached its monthly order limit of ${restaurant.max_orders_monthly}.`,
			};
		}
	}

	const uniqueItemIds = Array.from(
		new Set(normalizedItems.map((item) => item.menu_item_id)),
	);

	const { data: categoriesData, error: categoriesError } = await supabase
		.from("categories")
		.select("id")
		.eq("restaurant_id", input.restaurant_id);

	if (categoriesError || !categoriesData?.length) {
		return {
			ok: false,
			error: categoriesError?.message ?? "Failed to validate menu categories.",
		};
	}

	const categoryIds = categoriesData.map((category) => category.id);

	const { data: menuItemsData, error: menuItemsError } = await supabase
		.from("menu_items")
		.select("id, price, is_available, category_id")
		.in("id", uniqueItemIds)
		.in("category_id", categoryIds);

	if (menuItemsError || !menuItemsData) {
		return {
			ok: false,
			error: menuItemsError?.message ?? "Failed to validate menu items.",
		};
	}

	const menuItemMap = new Map(
		menuItemsData
			.filter((menuItem) => menuItem.is_available !== false)
			.map((menuItem) => [menuItem.id, Number(menuItem.price)]),
	);

	if (uniqueItemIds.some((id) => !menuItemMap.has(id))) {
		return {
			ok: false,
			error: "One or more items are unavailable.",
		};
	}

	const verifiedOrderItems = normalizedItems.map((item) => ({
		menu_item_id: item.menu_item_id,
		quantity: item.quantity,
		price_at_time: menuItemMap.get(item.menu_item_id) as number,
	}));

	const verifiedTotalAmount = verifiedOrderItems.reduce(
		(acc, item) => acc + item.price_at_time * item.quantity,
		0,
	);

	const { data: orderData, error: orderError } = await supabase
		.from("orders")
		.insert({
			restaurant_id: input.restaurant_id,
			table_id: input.table_id,
			total_amount: verifiedTotalAmount,
			special_requests: input.special_requests,
			qr_code_data: input.qr_code_data,
			guest_id: input.guest_id || null,
			status: input.status || "pending",
		})
		.select()
		.single();

	if (orderError || !orderData) {
		return {
			ok: false,
			error: orderError?.message ?? "Failed to create order.",
		};
	}

	const orderItems = verifiedOrderItems.map((item) => ({
		order_id: orderData.id,
		menu_item_id: item.menu_item_id,
		quantity: item.quantity,
		price_at_time: item.price_at_time,
	}));

	const { error: itemsError } = await supabase
		.from("order_items")
		.insert(orderItems);

	if (itemsError) {
		await supabase
			.from("orders")
			.delete()
			.eq("id", orderData.id)
			.eq("restaurant_id", input.restaurant_id);

		return {
			ok: false,
			error: itemsError.message,
		};
	}

	return {
		ok: true,
		order: {
			...(orderData as Order),
			total_amount: verifiedTotalAmount,
		},
	};
}
