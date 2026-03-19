import { notFound } from "next/navigation";
import {
	getCategoriesByRestaurant,
	getMenuItemsByRestaurant,
	getRestaurantBySlug,
} from "@/lib/data/restaurants";
import { MenuContentClient } from "./MenuContentClient";

export default async function MenuPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const restaurant = await getRestaurantBySlug(slug);

	if (!restaurant) {
		notFound();
	}

	const [categories, menuItems] = await Promise.all([
		getCategoriesByRestaurant(restaurant.id),
		getMenuItemsByRestaurant(restaurant.id),
	]);

	return (
		<MenuContentClient
			restaurant={restaurant}
			categories={categories}
			menuItems={menuItems}
			slug={slug}
		/>
	);
}
