"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThemeColors } from "@/types/database";

type Props = {
	restaurantId: string;
	initialThemeColors: ThemeColors;
};

const supabase = createClient();

function applyTheme(theme: ThemeColors) {
	if (typeof document === "undefined") return;

	const root = document.documentElement;
	const primary = theme.primary || "#0F4C75";
	const background = theme.background || "#FAF8F5";

	root.style.setProperty("--primary", primary);
	root.style.setProperty("--background", background);
	root.style.setProperty("--primary-light", `${primary}1a`);
	root.style.setProperty("--primary-medium", `${primary}33`);
	root.style.setProperty("--primary-shadow", `${primary}33`);

	const fontFamily = theme.fontFamily?.trim();
	if (fontFamily) {
		root.style.setProperty(
			"--font-sans",
			`${fontFamily}, var(--font-plus-jakarta-sans), system-ui, sans-serif`,
		);
		root.style.setProperty(
			"--font-arabic",
			`${fontFamily}, var(--font-tajawal), system-ui, sans-serif`,
		);
	}
}

export function RestaurantThemeSyncClient({
	restaurantId,
	initialThemeColors,
}: Props) {
	useEffect(() => {
		applyTheme(initialThemeColors);

		const channel = supabase
			.channel(`restaurant-theme-${restaurantId}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "restaurants",
					filter: `id=eq.${restaurantId}`,
				},
				(payload) => {
					const theme = (payload.new as { theme_colors?: ThemeColors | null })
						?.theme_colors;
					if (theme) applyTheme(theme);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [restaurantId, initialThemeColors]);

	return null;
}
