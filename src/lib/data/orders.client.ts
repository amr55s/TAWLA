"use client";

import { createGuestOrder, type CreateGuestOrderInput } from "@/app/actions/guest-orders";
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

export interface CreateOrderClientInput extends CreateGuestOrderInput {}

export async function createOrderWithItemsClient(
	input: CreateOrderClientInput,
): Promise<Order | null> {
	const result = await createGuestOrder(input);
	if (!result.ok) {
		console.error("Error creating order:", result.error);
		return null;
	}

	return result.order;
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
