"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { RestaurantPlan } from "@/lib/billing/plans";
import { isSuperAdminUser } from "@/lib/auth/super-admin";

async function assertSuperAdmin() {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user || !isSuperAdminUser(user)) {
		throw new Error("Unauthorized");
	}

	return supabase;
}

function revalidateSuperAdminPaths(slug: string | null) {
	revalidatePath("/super-admin");
	revalidatePath("/", "layout");

	if (slug) {
		revalidatePath(`/${slug}`, "page");
		revalidatePath(`/${slug}/menu`, "page");
		revalidatePath(`/${slug}/cart`, "page");
		revalidatePath(`/${slug}/checkout`, "page");
		revalidatePath(`/${slug}/orders`, "page");
		revalidatePath(`/${slug}/admin`, "layout");
		revalidatePath(`/${slug}/admin/settings/billing`, "page");
		revalidatePath(`/${slug}/admin/settings/checkout`, "page");
		revalidatePath(`/${slug}/subscribe`, "page");
	}
}

export async function toggleRestaurantActive(
	restaurantId: string,
	isActive: boolean,
) {
	try {
		const supabase = await assertSuperAdmin();
		const { data: restaurant, error } = await supabase
			.from("restaurants")
			.update({ is_active: isActive })
			.eq("id", restaurantId)
			.select("slug")
			.maybeSingle();

		if (error) {
			return { error: error.message };
		}

		revalidateSuperAdminPaths(restaurant?.slug ?? null);
		return { success: true };
	} catch (error) {
		return {
			error: error instanceof Error ? error.message : "Failed to update restaurant",
		};
	}
}

export async function adminOverrideRestaurantSubscription(input: {
	restaurantId: string;
	plan: RestaurantPlan;
	expiresAt: string;
	isActive: boolean;
}) {
	try {
		const supabase = await assertSuperAdmin();

		const { data, error } = await supabase.rpc("admin_override_subscription", {
			p_restaurant_id: input.restaurantId,
			p_plan: input.plan,
			p_expires_at: input.expiresAt,
			p_is_active: input.isActive,
		});

		if (error) {
			return { error: error.message };
		}

		const slug =
			data && typeof data === "object" && "slug" in data && typeof data.slug === "string"
				? data.slug
				: null;

		revalidateSuperAdminPaths(slug);
		return { success: true };
	} catch (error) {
		return {
			error:
				error instanceof Error
					? error.message
					: "Failed to override subscription",
		};
	}
}
