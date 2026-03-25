"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);
}

export async function createBranchRestaurant(
	parentRestaurantId: string,
	branchName: string,
) {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { ok: false, error: "Unauthorized" };
	}

	const cleanBranchName = branchName.trim();
	if (cleanBranchName.length < 2) {
		return { ok: false, error: "Branch name is too short" };
	}

	const { data: parent, error: parentError } = await supabase
		.from("restaurants")
		.select(
			"id, owner_id, name, slug, theme_colors, cuisine_type, currency_symbol, plan",
		)
		.eq("id", parentRestaurantId)
		.maybeSingle();

	if (parentError || !parent) {
		return { ok: false, error: parentError?.message ?? "Parent restaurant not found" };
	}

	if (parent.owner_id !== user.id) {
		return { ok: false, error: "Unauthorized" };
	}

	if (parent.plan !== "enterprise") {
		return { ok: false, error: "Only Enterprise accounts can create branches" };
	}

	const { count: existingBranchCount } = await supabase
		.from("restaurants")
		.select("id", { count: "exact", head: true })
		.eq("parent_id", parentRestaurantId);

	const nextBranchNumber = (existingBranchCount ?? 0) + 2;
	const baseSlug = slugify(parent.slug || parent.name || "branch");
	const generatedSlug = `${baseSlug}-branch-${nextBranchNumber}`;

	const { data: created, error: createError } = await supabase
		.from("restaurants")
		.insert({
			name: cleanBranchName,
			slug: generatedSlug,
			owner_id: user.id,
			parent_id: parentRestaurantId,
			plan: "enterprise",
			is_master: false,
			theme_colors: parent.theme_colors,
			cuisine_type: parent.cuisine_type,
			currency_symbol: parent.currency_symbol,
		})
		.select("id, name, slug, parent_id, is_master")
		.single();

	if (createError || !created) {
		return { ok: false, error: createError?.message ?? "Could not create branch" };
	}

	await supabase
		.from("restaurants")
		.update({ is_master: true })
		.eq("id", parentRestaurantId)
		.eq("owner_id", user.id);

	revalidatePath(`/${parent.slug}/admin`, "layout");
	revalidatePath(`/${parent.slug}/admin/settings`, "page");

	return {
		ok: true,
		error: null,
		branch: created,
	};
}
