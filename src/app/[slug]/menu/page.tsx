import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/lib/data/restaurants";
import MenuList from "@/components/menu/MenuList";

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

	return (
		<MenuList
			restaurantId={restaurant.id}
			slug={slug}
		/>
	);
}
