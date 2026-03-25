"use client";

import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";
import {
	Check,
	CreditCard,
	Crown,
	Loader2,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PLAN_CATALOG, type RestaurantPlan } from "@/lib/billing/plans";

interface RestaurantBilling {
	plan: RestaurantPlan | null;
	subscription_status: string | null;
	trial_ends_at: string | null;
	current_period_end: string | null;
	is_active: boolean;
}

export default function BillingPage() {
	const { restaurantId, slug } = useRestaurant();
	const router = useRouter();
	const [billing, setBilling] = useState<RestaurantBilling | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!restaurantId) return;
		const fetchBilling = async () => {
			const supabase = createClient();
			const { data } = await supabase
				.from("restaurants")
				.select(
					"plan, subscription_status, trial_ends_at, current_period_end, is_active",
				)
				.eq("id", restaurantId)
				.maybeSingle();
			setBilling(data as RestaurantBilling | null);
			setLoading(false);
		};
		fetchBilling();
	}, [restaurantId]);

	const handleSubscribe = (planId: string) => {
		router.push(`/${slug || "admin"}/admin/settings/checkout?plan=${planId}`);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-6 h-6 animate-spin text-[#3282B8]" />
			</div>
		);
	}

	const plan = billing?.plan ?? "trial";
	const status =
		billing?.subscription_status ?? (plan === "trial" ? "trialing" : "inactive");
	const isTrialing = status === "trialing";
	const isActive = status === "active";
	const isPro = plan === "pro" || plan === "enterprise";

	const trialDaysLeft = billing?.trial_ends_at
		? Math.max(
				0,
				Math.ceil(
					(new Date(billing.trial_ends_at).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24),
				),
			)
		: null;

	const periodEnd = billing?.current_period_end
		? new Date(billing.current_period_end).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const pricingCards = [
		{
			id: "starter" as const,
			name: PLAN_CATALOG.starter.label,
			desc: "For smaller dining rooms, carts, and cafes that need disciplined service flow.",
			cta: "Choose Starter",
		},
		{
			id: "pro" as const,
			name: PLAN_CATALOG.pro.label,
			desc: "For restaurants that want the full single-branch operating system without clutter.",
			cta: "Upgrade to Pro",
			popular: true,
		},
		{
			id: "enterprise" as const,
			name: PLAN_CATALOG.enterprise.label,
			desc: "For multi-branch operators who need HQ visibility and serious control.",
			cta: "Go Enterprise",
		},
	];

	return (
		<div className="max-w-5xl space-y-8">
			{/* Page Header */}
			<div>
				<h1 className="text-xl font-bold text-[#0A1628] tracking-tight">
					Billing & Subscription
				</h1>
				<p className="text-sm text-[#7B8BA3] mt-1">
					Manage your plan and payment details
				</p>
			</div>

			{/* ── Current Plan Overview ── */}
			<div className="rounded-2xl border border-[#E8ECF1] bg-white p-6">
				<div className="flex items-center gap-2 mb-5">
					<CreditCard size={18} className="text-[#3282B8]" />
					<h2 className="text-sm font-bold text-[#0A1628]">
						Current Plan
					</h2>
				</div>

				<div className="grid sm:grid-cols-3 gap-5">
					{/* Plan */}
					<div className="rounded-xl bg-[#F5F7FA] p-4">
						<p className="text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-widest mb-1.5">
							Plan
						</p>
						<p className="text-lg font-bold text-[#0A1628] capitalize">
							{PLAN_CATALOG[plan].label}
						</p>
					</div>

					{/* Status */}
					<div className="rounded-xl bg-[#F5F7FA] p-4">
						<p className="text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-widest mb-1.5">
							Status
						</p>
						<div className="flex items-center gap-2">
							<div
								className={`w-2 h-2 rounded-full ${
									isActive
										? "bg-emerald-500"
										: isTrialing
											? "bg-amber-500"
											: "bg-red-500"
								}`}
							/>
							<p className="text-lg font-bold text-[#0A1628] capitalize">
								{status.replace(/_/g, " ")}
							</p>
						</div>
					</div>

					{/* Period */}
					<div className="rounded-xl bg-[#F5F7FA] p-4">
						<p className="text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-widest mb-1.5">
							{isTrialing ? "Trial Ends" : "Current Period Ends"}
						</p>
						<p className="text-lg font-bold text-[#0A1628]">
							{isTrialing && trialDaysLeft !== null
								? `${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} left`
								: periodEnd ?? "—"}
						</p>
					</div>
				</div>

				{/* Trial banner */}
				{isTrialing && (
					<div className="mt-5 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
						<Sparkles size={16} className="text-amber-600 shrink-0" />
						<p className="text-xs text-amber-700 font-medium">
							You&apos;re on a free trial with full Pro access. Subscribe before
							your trial ends to keep all features.
						</p>
					</div>
				)}

				{isActive && isPro && (
					<div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
						<Crown size={16} className="text-emerald-600 shrink-0" />
						<p className="text-xs text-emerald-700 font-medium">
							You&apos;re on the {PLAN_CATALOG[plan].label} plan. Your premium operations features are unlocked.
						</p>
					</div>
				)}
			</div>

			{/* ── Available Plans ── */}
			<div>
				<div className="text-center mb-16">
					<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.2em] uppercase block mb-4">
						Pricing
					</span>
					<h2 className="text-[34px] md:text-[44px] font-bold text-tawla-ink tracking-tight">
						Simple, Transparent Pricing
					</h2>
					<p className="mt-4 text-base text-tawla-body-blue max-w-md mx-auto">
						No hidden fees. Start free, upgrade when you&apos;re ready.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-[960px] mx-auto">
					{pricingCards.map((card) => {
						const planDef = PLAN_CATALOG[card.id];
						const isCurrentPlan = plan === card.id;

						return (
							<div
								key={card.id}
								className={`relative rounded-2xl p-8 border transition-all duration-500 flex flex-col h-full ${
									card.popular
										? "bg-white border-tawla-sky/40 shadow-[0_0_48px_rgba(50,130,184,0.1)]"
										: "bg-white border-tawla-deep/5 hover:border-tawla-sky/20 hover:shadow-[0_8px_32px_rgba(15,76,117,0.06)]"
								}`}
							>
								{card.popular && (
									<div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 px-4 py-1 rounded-full bg-tawla-sky text-white text-[10px] font-bold tracking-wider uppercase whitespace-nowrap">
										15-DAY MONEY-BACK GUARANTEE
									</div>
								)}

								<h3 className="text-lg font-bold text-tawla-ink mb-1">{card.name}</h3>

								<div className="flex items-baseline gap-1 mb-3">
									<span className="text-[36px] font-bold text-tawla-ink">
										${planDef.monthlyPriceUsd}
									</span>
									{card.id !== "enterprise" && (
										<span className="text-sm text-tawla-muted">/mo</span>
									)}
								</div>

								<p className="text-sm text-tawla-body-blue mb-6">{card.desc}</p>

								<ul className="space-y-3 mb-8">
									{planDef.features.map((f) => (
										<li
											key={f}
											className="flex items-center gap-2.5 text-sm text-tawla-body-blue"
										>
											<Check className="w-4 h-4 text-tawla-sky shrink-0" />
											{f}
										</li>
									))}
								</ul>

								<div className="mt-auto">
									<button
										type="button"
										onClick={
											isCurrentPlan ? undefined : () => handleSubscribe(card.id)
										}
										className={`block w-full py-3 px-6 rounded-full text-center font-semibold text-sm sm:text-base transition-all duration-200 mt-8 ${
											card.popular
												? "bg-[#1A3D5D] text-white hover:bg-[#122A40] shadow-md"
												: "border-2 border-[#E8ECF1] text-[#0A1628] hover:bg-[#F8FAFC]"
										} ${isCurrentPlan ? "opacity-60 cursor-default" : ""}`}
									>
										{isCurrentPlan ? "Current Plan" : card.cta}
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</div>

		</div>
	);
}
