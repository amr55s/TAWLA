"use client";

import { createClient } from "@/lib/supabase/client";
import type {
	MenuItem,
	MenuItemWithCategory,
	Order,
	OrderStatus,
	Restaurant,
	Table,
} from "@/types/database";

const supabase = createClient();

export async function getRestaurantBySlugClient(
	slug: string,
): Promise<Restaurant | null> {
	const { data, error } = await supabase
		.from("restaurants")
		.select(
			"id, name, slug, logo_url, theme_colors, created_at, plan, trial_ends_at, max_tables, max_orders_monthly, parent_id, is_master, is_active, owner_id, subscription_status, subscription_plan, current_period_end, currency_symbol",
		)
		.eq("slug", slug)
		.maybeSingle();

	if (error) {
		console.error(
			"Error fetching restaurant:",
			JSON.stringify(error, null, 2),
			error,
		);
		return null;
	}

	return data as Restaurant;
}

export async function getMenuItemsByRestaurantClient(
	restaurantId: string,
): Promise<MenuItemWithCategory[]> {
	const { data: categoriesData, error: catError } = await supabase
		.from("categories")
		.select("id, name_en, name_ar, restaurant_id, sort_order, created_at")
		.eq("restaurant_id", restaurantId);

	if (catError || !categoriesData) {
		console.error(
			"Error fetching categories:",
			JSON.stringify(catError, null, 2),
			catError,
		);
		return [];
	}

	const categories = categoriesData as {
		id: string;
		name_en: string;
		name_ar: string;
		restaurant_id: string;
		sort_order: number;
	}[];
	const categoryIds = categories.map((c) => c.id);

	const { data: itemsData, error: itemsError } = await supabase
		.from("menu_items")
		.select("id, name_en, name_ar, description_en, description_ar, price, category_id, is_available, image_url, created_at, cross_sell_items")
		.in("category_id", categoryIds)
		.eq("is_available", true);

	if (itemsError || !itemsData) {
		console.error(
			"Error fetching menu items:",
			JSON.stringify(itemsError, null, 2),
			itemsError,
		);
		return [];
	}

	const items = itemsData as MenuItem[];

	return items.map((item) => ({
		...item,
		category: categories.find((c) => c.id === item.category_id)!,
	}));
}

export async function getTablesByRestaurantClient(
	restaurantId: string,
): Promise<Table[]> {
	const { data, error } = await supabase
		.from("tables")
		.select("id, restaurant_id, table_number, qr_code_url")
		.eq("restaurant_id", restaurantId)
		.order("table_number", { ascending: true });

	if (error) {
		console.error(
			"Error fetching tables:",
			JSON.stringify(error, null, 2),
			error,
		);
		return [];
	}

	return (data as Table[]) || [];
}

export interface CreateOrderClientInput {
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

export async function createOrderWithItemsClient(
	input: CreateOrderClientInput,
): Promise<Order | null> {
	if (!input.items.length) {
		console.error("Error creating order: no items in payload");
		return null;
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
		console.error("Error creating order: invalid item payload");
		return null;
	}

	const uniqueItemIds = Array.from(
		new Set(normalizedItems.map((item) => item.menu_item_id)),
	);

	const { data: categoriesData, error: categoriesError } = await supabase
		.from("categories")
		.select("id")
		.eq("restaurant_id", input.restaurant_id);

	if (categoriesError || !categoriesData?.length) {
		console.error(
			"Error fetching categories for secure pricing:",
			JSON.stringify(categoriesError, null, 2),
			categoriesError,
		);
		return null;
	}

	const categoryIds = categoriesData.map((category) => category.id);

	const { data: menuItemsData, error: menuItemsError } = await supabase
		.from("menu_items")
		.select("id, price, is_available, category_id")
		.in("id", uniqueItemIds)
		.in("category_id", categoryIds);

	if (menuItemsError || !menuItemsData) {
		console.error(
			"Error fetching menu items for secure pricing:",
			JSON.stringify(menuItemsError, null, 2),
			menuItemsError,
		);
		return null;
	}

	const menuItemMap = new Map(
		menuItemsData
			.filter((menuItem) => menuItem.is_available !== false)
			.map((menuItem) => [menuItem.id, Number(menuItem.price)]),
	);

	if (uniqueItemIds.some((id) => !menuItemMap.has(id))) {
		console.error(
			"Error creating order: one or more items missing or unavailable",
		);
		return null;
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
			// Guest orders must begin as pending and be confirmed by waiter later.
			status: input.status || "pending",
		})
		.select()
		.single();

	if (orderError || !orderData) {
		console.error(
			"Error creating order:",
			JSON.stringify(orderError, null, 2),
			orderError,
		);
		return null;
	}

	const order = orderData as Order;

	const orderItems = verifiedOrderItems.map((item) => ({
		order_id: order.id,
		menu_item_id: item.menu_item_id,
		quantity: item.quantity,
		price_at_time: item.price_at_time,
	}));

	const { error: itemsError } = await supabase
		.from("order_items")
		.insert(orderItems);

	if (itemsError) {
		console.error(
			"Error creating order items:",
			JSON.stringify(itemsError, null, 2),
			itemsError,
		);
		const { error: rollbackError } = await supabase
			.from("orders")
			.delete()
			.eq("id", order.id)
			.eq("restaurant_id", input.restaurant_id);
		if (rollbackError) {
			console.error(
				"Error rolling back order after items failure:",
				JSON.stringify(rollbackError, null, 2),
				rollbackError,
			);
		}
		return null;
	}

	return { ...order, total_amount: verifiedTotalAmount };
}

export async function getTableByNumberClient(
	restaurantId: string,
	tableNumber: number,
): Promise<Table | null> {
	const { data, error } = await supabase
		.from("tables")
		.select("id, restaurant_id, table_number, qr_code_url")
		.eq("restaurant_id", restaurantId)
		.eq("table_number", tableNumber)
		.maybeSingle();

	if (error) {
		console.error(
			"Error fetching table:",
			JSON.stringify(error, null, 2),
			error,
		);
		return null;
	}

	return data as Table;
}
