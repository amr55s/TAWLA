"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const SUPER_ADMIN_EMAIL = "amrkhaled.contact@gmail.com";

export async function toggleRestaurantActive(
	restaurantId: string,
	isActive: boolean,
) {
	const supabase = await createClient();

	// Verify the caller is the super admin
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user || user.email !== SUPER_ADMIN_EMAIL) {
		return { error: "Unauthorized" };
	}

	const { error } = await supabase
		.from("restaurants")
		.update({ is_active: isActive })
		.eq("id", restaurantId);

	if (error) {
		return { error: error.message };
	}

	revalidatePath("/super-admin");
	revalidatePath("/", "layout");
	return { success: true };
}
