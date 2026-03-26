"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ThemeColors } from "@/types/database";

type Props = {
	restaurantId: string;
	initialThemeColors: ThemeColors;
};

const supabase = createClient();

function applyTenantTheme(theme: ThemeColors) {
	if (typeof document === "undefined") return;
	const el = document.getElementById("tenant-theme-wrapper");
	if (!el) return;

	const primary = theme.primary || "#1A4D3A";
	const background = theme.background || "#FAF8F5";
	el.style.setProperty("--tenant-primary", primary);
	el.style.setProperty("--tenant-secondary", background);
}

export function TenantThemeSyncClient({ restaurantId, initialThemeColors }: Props) {
	useEffect(() => {
		applyTenantTheme(initialThemeColors);

		const channel = supabase
			.channel(`tenant-theme-${restaurantId}`)
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
					if (theme) applyTenantTheme(theme);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [restaurantId, initialThemeColors]);

	return null;
}

