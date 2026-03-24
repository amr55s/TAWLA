"use client";

import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";
import {
	Check,
	CreditCard,
	Crown,
	Loader2,
	Sparkles,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { mockSubscribe } from "./actions";

interface RestaurantBilling {
	subscription_plan: string | null;
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
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!restaurantId) return;
		const fetchBilling = async () => {
			const supabase = createClient();
			const { data } = await supabase
				.from("restaurants")
				.select(
					"subscription_plan, subscription_status, trial_ends_at, current_period_end, is_active",
				)
				.eq("id", restaurantId)
				.maybeSingle();
			setBilling(data as RestaurantBilling | null);
			setLoading(false);
		};
		fetchBilling();
	}, [restaurantId]);

	const handleMockSubscribe = (planId: string) => {
		if (!restaurantId) return;
		startTransition(async () => {
			const result = await mockSubscribe(restaurantId, planId);
			if (result?.error) {
				toast.error(result.error);
			} else {
				toast.success(`🎉 Successfully subscribed to the ${planId} plan!`);
				router.refresh();
				// Re-fetch billing data
				const supabase = createClient();
				const { data } = await supabase
					.from("restaurants")
					.select(
						"subscription_plan, subscription_status, trial_ends_at, current_period_end, is_active",
					)
					.eq("id", restaurantId)
					.maybeSingle();
				setBilling(data as RestaurantBilling | null);
			}
		});
	};

	const handleSubscribe = (planId: string) => {
		if (planId === "starter") {
			handleMockSubscribe(planId);
		} else {
			router.push(`/${slug || "admin"}/admin/settings/checkout?plan=${planId}`);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-6 h-6 animate-spin text-[#3282B8]" />
			</div>
		);
	}

	const plan = billing?.subscription_plan ?? "starter";
	const status = billing?.subscription_status ?? "inactive";
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

	return (
		<div className="max-w-4xl space-y-8">
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
							{plan === "free" || plan === "starter" ? "Starter" : plan}
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
							You&apos;re on the Pro plan. All premium features are unlocked.
						</p>
					</div>
				)}
			</div>

			{/* ── Available Plans ── */}
			<div>
				<h2 className="text-sm font-bold text-[#0A1628] mb-4">
					Available Plans
				</h2>

				<div className="grid sm:grid-cols-3 gap-5">
					{[
						{
							id: "starter",
							name: "Starter",
							desc: "Always Free. For new restaurants getting started",
							price: 0,
							features: [
								"Digital menu (up to 30 items)",
								"Up to 5 tables",
								"1 Staff account",
								"Basic order management",
							],
						},
						{
							id: "pro",
							name: "Professional",
							desc: "15-Day Money-Back Guarantee. For growing restaurants",
							price: 49,
							popular: true,
							features: [
								"Unlimited menu items",
								"Up to 25 tables",
								"Up to 5 Staff accounts",
								"Waiter & Cashier Hub",
								"Custom branding (No watermark)",
							],
						},
						{
							id: "enterprise",
							name: "Enterprise",
							desc: "Full autonomous intelligence for ultimate efficiency",
							price: 99,
							features: [
								"Unlimited tables & staff",
								"Autonomous AI features",
								"Kitchen Display System (KDS)",
								"Advanced predictive analytics",
								"Priority 24/7 support",
							],
						},
					].map((p) => {
						const isCurrentPlan =
							(plan === "free" && p.id === "starter") || plan === p.id || (plan === "starter" && p.id === "starter");
						return (
							<div
								key={p.id}
								className={`rounded-2xl border bg-white p-6 relative overflow-hidden flex flex-col ${
									p.popular ? "border-2 border-[#0F4C75]" : "border-[#E8ECF1]"
								}`}
							>
								{p.popular && (
									<div className="absolute top-4 right-4">
										<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0F4C75] text-white text-[10px] font-bold uppercase tracking-wider">
											<Zap size={10} /> Popular
										</span>
									</div>
								)}

								<div className="mb-5">
									<h3 className="text-base font-bold text-[#0A1628]">
										{p.name}
									</h3>
									<p className="text-xs text-[#7B8BA3] mt-1">{p.desc}</p>
								</div>

								<div className="flex items-baseline gap-1 mb-5">
									<span className="text-3xl font-bold text-[#0A1628]">
										${p.price}
									</span>
									<span className="text-sm text-[#7B8BA3]">/month</span>
								</div>

								<ul className="space-y-2.5 mb-6 flex-1">
									{p.features.map((feature) => (
										<li
											key={feature}
											className="flex items-start gap-2.5 text-xs text-[#5A6B82]"
										>
											<Check
												size={14}
												className={`${p.popular ? "text-[#0F4C75]" : "text-[#B0B8C4]"} shrink-0 mt-0.5`}
											/>
											<span>{feature}</span>
										</li>
									))}
								</ul>

								{isCurrentPlan ? (
									<div className="py-2.5 text-center rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-700">
										✓ Current Plan
									</div>
								) : (
									<button
										onClick={() => handleSubscribe(p.id)}
										disabled={isPending}
										className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
											p.popular
												? "bg-[#0F4C75] text-white hover:bg-[#0A3558]"
												: "bg-[#F5F7FA] text-[#0A1628] hover:bg-[#E8ECF1]"
										}`}
									>
										{isPending ? (
											<>
												<Loader2 size={14} className="animate-spin" />
												Processing…
											</>
										) : p.id === "starter" ? (
											"Downgrade"
										) : p.id === "enterprise" ? (
											<>
												<Zap size={14} />
												Upgrade to Enterprise
											</>
										) : (
											<>
												<Zap size={14} />
												Subscribe to Pro
											</>
										)}
									</button>
								)}
							</div>
						);
					})}
				</div>
			</div>

		</div>
	);
}
