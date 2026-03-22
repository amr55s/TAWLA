import { notFound } from "next/navigation";
import { getRestaurantBySlug } from "@/lib/data/restaurants";
import { RestaurantThemeSyncClient } from "./RestaurantThemeSyncClient";

interface RestaurantLayoutProps {
	children: React.ReactNode;
	params: Promise<{ slug: string }>;
}

export default async function RestaurantLayout({
	children,
	params,
}: RestaurantLayoutProps) {
	const { slug } = await params;
	const restaurant = await getRestaurantBySlug(slug);

	if (!restaurant) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-background" suppressHydrationWarning>
			<RestaurantThemeSyncClient
				restaurantId={restaurant.id}
				initialThemeColors={restaurant.theme_colors}
			/>
			{children}
		</div>
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const restaurant = await getRestaurantBySlug(slug);

	if (!restaurant) {
		return {
			title: "Restaurant Not Found",
		};
	}

	return {
		title: `${restaurant.name} - Digital Menu`,
		description: `Browse the menu at ${restaurant.name}. Order delicious food with ease.`,
	};
}