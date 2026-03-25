"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
	getPlanDefinition,
	isPaidPlanId,
	type PaidPlanId,
} from "@/lib/billing/plans";

function parsePlanFromGatewayPayload(payload: any): PaidPlanId | null {
	const candidates = [
		payload?.data?.notes,
		payload?.data?.note,
		payload?.data?.description,
		payload?.data?.order_description,
		payload?.data?.merchant_order_id,
		payload?.data?.reference,
	];

	for (const raw of candidates) {
		if (typeof raw !== "string") continue;
		const match = raw.match(/\b(starter|pro|enterprise)\b/i);
		if (match) {
			const plan = match[1].toLowerCase();
			if (isPaidPlanId(plan)) return plan;
		}
	}

	return null;
}

function resolvePaidPlanFromAmount(amount: number): PaidPlanId | null {
	if (Math.abs(amount - 15) <= 0.01) return "starter";
	if (Math.abs(amount - 50) <= 0.01) return "pro";
	if (Math.abs(amount - 100) <= 0.01) return "enterprise";
	return null;
}

export async function verifySpaceRemitPayment(paymentCode: string, planId: string, restaurantId: string) {
	const SPACEREMIT_API_URL = "https://spaceremit.com/api/v2/payment_info/";
	const SPACEREMIT_SECRET_KEY = process.env.SPACEREMIT_SECRET_KEY || "";
	const SPACEREMIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_SPACEREMIT_PUBLIC_KEY || "";
	const supabase = await createClient();

	if (!isPaidPlanId(planId)) {
		return { error: "Invalid plan selected." };
	}

	if (!SPACEREMIT_SECRET_KEY) {
		return { error: "Missing SpaceRemit secret key." };
	}

	// Verify the user
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "Unauthorized" };
	}

	try {
		const selectedPlan = getPlanDefinition(planId);
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
		const isTestMode = SPACEREMIT_SECRET_KEY.startsWith("test_");
		const validStatus = data?.data?.status_tag === "A" || (isTestMode && data?.data?.status_tag === "T");
		const paidAmount = Number(data?.data?.total_amount ?? 0);
		const paidCurrency = String(data?.data?.currency ?? "").toUpperCase();
		const sellerPublicKey = String(data?.data?.seller_public_key ?? "");
		const paidPlanFromGateway =
			parsePlanFromGatewayPayload(data) ?? resolvePaidPlanFromAmount(paidAmount);
		const resolvedPlanId = paidPlanFromGateway ?? planId;

		if (data?.response_status === "success" && validStatus) {
			const { data: restaurant } = await supabase
				.from("restaurants")
				.select("id, owner_id, slug")
				.eq("id", restaurantId)
				.maybeSingle();

			if (!restaurant || restaurant.owner_id !== user.id) {
				return { error: "Unauthorized" };
			}

			if (paidCurrency !== "USD") {
				return { error: "Unexpected payment currency." };
			}

			if (Math.abs(paidAmount - selectedPlan.monthlyPriceUsd) > 0.01) {
				return { error: "Paid amount does not match the selected plan." };
			}

			if (SPACEREMIT_PUBLIC_KEY && sellerPublicKey && sellerPublicKey !== SPACEREMIT_PUBLIC_KEY) {
				return { error: "Payment key mismatch." };
			}

			if (!isPaidPlanId(resolvedPlanId)) {
				return { error: "Could not determine the paid plan." };
			}

			if (paidPlanFromGateway && paidPlanFromGateway !== planId) {
				console.warn("SpaceRemit plan mismatch resolved from gateway payload", {
					requestedPlan: planId,
					paidPlanFromGateway,
					paymentCode,
				});
			}

			// Update the restaurants table
			const { error: updateError } = await supabase
				.from("restaurants")
				.update({
					plan: resolvedPlanId,
					subscription_plan: resolvedPlanId,
					subscription_status: "active",
					trial_ends_at: null,
					current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
					is_active: true,
				})
				.eq("id", restaurantId);

			if (updateError) {
				console.error("Database Update Error:", updateError);
				return { error: "Payment verified but failed to update subscription." };
			}

			revalidatePath("/", "layout");
			revalidatePath(`/${restaurant.slug}/admin`, "layout");
			revalidatePath(`/${restaurant.slug}/admin/settings/billing`, "page");
			return {
				success: true,
				plan: resolvedPlanId,
				slug: restaurant.slug,
			};
		} else {
			return { error: "Payment was not completed successfully." };
		}
	} catch (error) {
		console.error("SpaceRemit Verification Error:", error);
		return { error: "An unexpected error occurred during verification." };
	}
}
