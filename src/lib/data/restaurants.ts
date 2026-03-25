import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
	Category,
	MenuItemWithCategory,
	Restaurant,
} from "@/types/database";

export const getRestaurantBySlug = cache(
	async (slug: string): Promise<Restaurant | null> => {
		const supabase = await createClient();
		const { data, error } = await supabase
			.from("restaurants")
			.select(
				"id, name, slug, logo_url, theme_colors, created_at, plan, trial_ends_at, max_tables, max_orders_monthly, parent_id, is_master, is_active, owner_id, subscription_status, subscription_plan, current_period_end, currency_symbol",
			)
			.eq("slug", slug)
			.maybeSingle();

		if (error) {
			console.error("Error fetching restaurant:", error);
			return null;
		}

		return data;
	},
);

export async function getCategoriesByRestaurant(
	restaurantId: string,
): Promise<Category[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("categories")
		.select("*")
		.eq("restaurant_id", restaurantId)
		.order("sort_order", { ascending: true });

	if (error) {
		console.error("Error fetching categories:", error);
		return [];
	}

	return data || [];
}

export async function getMenuItemsByRestaurant(
	restaurantId: string,
): Promise<MenuItemWithCategory[]> {
	const supabase = await createClient();

	const { data: categories, error: catError } = await supabase
		.from("categories")
		.select("*")
		.eq("restaurant_id", restaurantId);

	if (catError || !categories) {
		console.error("Error fetching categories:", catError);
		return [];
	}

	const categoryIds = categories.map((c) => c.id);

	const { data: items, error: itemsError } = await supabase
		.from("menu_items")
		.select("*")
		.in("category_id", categoryIds)
		.eq("is_available", true);

	if (itemsError || !items) {
		console.error("Error fetching menu items:", itemsError);
		return [];
	}

	return items.map((item) => ({
		...item,
		category: categories.find((c) => c.id === item.category_id)!,
	}));
}
