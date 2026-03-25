"use client";

import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { verifySpaceRemitPayment } from "@/app/actions/payment";
import { PLAN_CATALOG, isPaidPlanId } from "@/lib/billing/plans";

declare global {
	interface Window {
		SP_PUBLIC_KEY: string | undefined;
		SP_FORM_ID: string;
		SP_SELECT_RADIO_NAME: string;
		LOCAL_METHODS_BOX_STATUS: boolean;
		LOCAL_METHODS_PARENT_ID: string;
		CARD_BOX_STATUS: boolean;
		CARD_BOX_PARENT_ID: string;
		SP_FORM_AUTO_SUBMIT_WHEN_GET_CODE: boolean;
		SP_SUCCESSFUL_PAYMENT: (code: string) => void;
		SP_FAILD_PAYMENT: () => void;
		SP_RECIVED_MESSAGE: (msg: string) => void;
	}
}

export default function CheckoutPage() {
	const { restaurantId, slug } = useRestaurant();
	const searchParams = useSearchParams();
	const router = useRouter();

	const rawPlanId = searchParams.get("plan") || "pro";
	const planId = isPaidPlanId(rawPlanId) ? rawPlanId : "pro";
	const [loading, setLoading] = useState(false);
	const [scriptLoaded, setScriptLoaded] = useState(false);

	const plan = PLAN_CATALOG[planId];

	useEffect(() => {
		// Set global variables required by SpaceRemit script
		window.SP_PUBLIC_KEY = process.env.NEXT_PUBLIC_SPACEREMIT_PUBLIC_KEY;
		window.SP_FORM_ID = "#spaceremit-form";
		window.SP_SELECT_RADIO_NAME = "sp-pay-type-radio";
		window.LOCAL_METHODS_BOX_STATUS = true;
		window.LOCAL_METHODS_PARENT_ID = "#spaceremit-local-methods-pay";
		window.CARD_BOX_STATUS = true;
		window.CARD_BOX_PARENT_ID = "#spaceremit-card-pay";
		window.SP_FORM_AUTO_SUBMIT_WHEN_GET_CODE = true;

		window.SP_SUCCESSFUL_PAYMENT = async function (code: string) {
			window.dispatchEvent(
				new CustomEvent("spaceremit_success", { detail: code }),
			);
		};
		window.SP_FAILD_PAYMENT = function () {
			toast.error("Payment failed. Please try again.");
		};
		window.SP_RECIVED_MESSAGE = function (msg: string) {
			toast.info(msg);
		};
	}, []);

	useEffect(() => {
		const handleSuccess = async (e: Event) => {
			const customEvent = e as CustomEvent<string>;
			const code = customEvent.detail;

			if (!restaurantId || !slug) {
				toast.error("Restaurant details are missing");
				return;
			}

			setLoading(true);
			const result = await verifySpaceRemitPayment(
				code,
				planId,
				restaurantId,
			);

			if (result.error) {
				toast.error(result.error);
				setLoading(false);
			} else {
				toast.success("Payment successful! Subscription upgraded.");
				const resolvedPlan =
					"plan" in result && typeof result.plan === "string"
						? result.plan
						: planId;
				const resolvedSlug =
					"slug" in result && typeof result.slug === "string"
						? result.slug
						: slug;
				router.push(`/${resolvedSlug}/checkout/success?plan=${resolvedPlan}`);
			}
		};

		window.addEventListener("spaceremit_success", handleSuccess);
		return () => {
			window.removeEventListener("spaceremit_success", handleSuccess);
		};
	}, [planId, restaurantId, slug, router]);

	if (!plan) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px]">
				<p className="text-[#0A1628] font-bold">Invalid plan selected.</p>
				<button
					onClick={() => router.back()}
					className="mt-4 text-[#3282B8] hover:underline"
				>
					Go back
				</button>
			</div>
		);
	}

	// Used in the hidden form details
	const userFullName = "Restaurant Admin"; 
	const userEmail = "admin@restaurant.com";
	const paymentNotes = restaurantId ? `tawla|restaurant:${restaurantId}|plan:${plan.id}` : `tawla|plan:${plan.id}`;

	return (
		<div className="max-w-3xl mx-auto space-y-8">
			{/* Script */}
			<Script 
				src="https://spaceremit.com/api/v2/js_script/spaceremit.js" 
				strategy="afterInteractive"
				onLoad={() => setScriptLoaded(true)}
			/>

			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-[#0A1628] tracking-tight">
					Secure Checkout
				</h1>
				<p className="text-sm text-[#7B8BA3] mt-1 flex items-center gap-2">
					<ShieldCheck size={16} className="text-emerald-500" />
					Safe & encrypted payments processed by SpaceRemit
				</p>
			</div>

			<div className="grid md:grid-cols-[1fr_1.2fr] gap-6">
				{/* Left: Summary */}
				<div className="rounded-2xl border border-[#E8ECF1] bg-white p-6 h-fit space-y-6">
					<div>
						<h2 className="text-lg font-bold text-[#0A1628] mb-4">
							Order Summary
						</h2>
						<div className="flex items-center justify-between py-4 border-b border-[#E8ECF1]">
							<div>
								<p className="font-semibold text-[#0A1628]">
									Tawla {plan.label} Plan
								</p>
								<p className="text-sm text-[#7B8BA3]">Monthly subscription</p>
							</div>
							<p className="font-bold text-[#0A1628]">${plan.monthlyPriceUsd}.00</p>
						</div>
					</div>

					<div className="space-y-4">
						<div className="flex justify-between text-[#0A1628] font-bold text-lg">
							<span>Total Due</span>
							<span>${plan.monthlyPriceUsd}.00</span>
						</div>
					</div>
					
					<p className="text-center text-xs text-[#B0B8C4] flex items-center justify-center gap-1.5 break-words">
						15-Day Money-Back Guarantee
					</p>
				</div>

				{/* Right: Payment Form Component */}
				<div className="relative">
					{loading && (
						<div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
							<div className="flex flex-col items-center gap-3">
								<Loader2 size={32} className="animate-spin text-[#0F4C75]" />
								<p className="text-sm font-semibold text-[#0F4C75]">Verifying Payment...</p>
							</div>
						</div>
					)}
					
					{/* SpaceRemit Required Form HTML */}
					<form 
						id="spaceremit-form" 
						className="w-full mx-auto p-6 bg-white rounded-2xl shadow-sm border border-[#E8ECF1]"
					>
						<h3 className="text-sm font-bold text-[#0A1628] mb-5 uppercase tracking-wider">Payment Details</h3>
						
						<input type="hidden" name="amount" value={plan.monthlyPriceUsd} />
						<input type="hidden" name="currency" value="USD" />
						<input type="hidden" name="fullname" value={userFullName} />
						<input type="hidden" name="email" value={userEmail} />
						<input type="hidden" name="notes" value={paymentNotes} />

						<div className="sp-one-type-select mb-4 hidden">
							<input type="radio" name="sp-pay-type-radio" value="local-methods-pay" id="sp_local_methods_radio" defaultChecked />
							<label htmlFor="sp_local_methods_radio">Local payment methods</label>
						</div>
						
						{/* Container injected by SpaceRemit */}
						<div id="spaceremit-local-methods-pay" className="mb-4"></div>

						<div className="sp-one-type-select mb-4 hidden">
							<input type="radio" name="sp-pay-type-radio" value="card-pay" id="sp_card_radio" />
							<label htmlFor="sp_card_radio">Card payment</label>
						</div>
						
						{/* Container injected by SpaceRemit */}
						<div id="spaceremit-card-pay" className="mb-6"></div>

						<button 
							type="submit" 
							className="w-full py-3.5 bg-[#0F4C75] hover:bg-[#0A3558] transition-colors text-white rounded-xl font-bold"
						>
							Pay Now (${plan.monthlyPriceUsd}.00)
						</button>
						
						{!scriptLoaded && (
							<div className="mt-4 flex items-center gap-2 justify-center text-xs text-[#7B8BA3]">
								<Loader2 size={12} className="animate-spin" /> Loading payment gateway...
							</div>
						)}
					</form>
				</div>
			</div>
		</div>
	);
}
