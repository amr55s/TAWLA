import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";
import { getRestaurantBySlug } from "@/lib/data/restaurants";
import { TenantThemeSyncClient } from "./TenantThemeSyncClient";

export const metadata: Metadata = {
	title: "Menu",
};

export default async function MenuLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const restaurant = await getRestaurantBySlug(slug);
	if (!restaurant) notFound();

	const primary = restaurant.theme_colors?.primary || "#1A4D3A";
	const secondary = restaurant.theme_colors?.background || "#F5F5F5";

	return (
		<div
			id="tenant-theme-wrapper"
			className="tenant-theme-wrapper min-h-screen"
			style={
				{
					"--tenant-primary": primary,
					"--tenant-secondary": secondary,
				} as React.CSSProperties
			}
		>
			<TenantThemeSyncClient
				restaurantId={restaurant.id}
				initialThemeColors={restaurant.theme_colors}
			/>
			{children}
		</div>
	);
}

