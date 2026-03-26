import { notFound } from "next/navigation";
import { isRestaurantOrderingUnavailable } from "@/lib/billing/subscription-status";
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
			isOrderingDisabled={isRestaurantOrderingUnavailable({
				plan: restaurant.plan,
				trialEndsAt: restaurant.trial_ends_at,
				subscriptionStatus: restaurant.subscription_status,
				isActive: restaurant.is_active,
			})}
		/>
	);
}
