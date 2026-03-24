"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function verifySpaceRemitPayment(paymentCode: string, planId: string, restaurantId: string) {
	const SPACEREMIT_API_URL = "https://spaceremit.com/api/v2/payment_info/";
	const SPACEREMIT_SECRET_KEY = process.env.SPACEREMIT_SECRET_KEY || "test_secret_key";
	const supabase = await createClient();

	// Verify the user
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Unauthorized" };
	}

	try {
		const payload = {
			private_key: SPACEREMIT_SECRET_KEY,
			payment_id: paymentCode,
		};

		const response = await fetch(SPACEREMIT_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		const data = await response.json();

		if (
			data.response_status === "success" &&
			(data.data.status_tag === "A" || data.data.status_tag === "T")
		) {
			// Update the restaurants table
			const { error: updateError } = await supabase
				.from("restaurants")
				.update({
					subscription_plan: planId,
					subscription_status: "active",
					current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
					is_active: true,
				})
				.eq("id", restaurantId);

			if (updateError) {
				console.error("Database Update Error:", updateError);
				return { error: "Payment verified but failed to update subscription." };
			}

			revalidatePath("/", "layout");
			return { success: true };
		} else {
			return { error: "Payment was not completed successfully." };
		}
	} catch (error) {
		console.error("SpaceRemit Verification Error:", error);
		return { error: "An unexpected error occurred during verification." };
	}
}
