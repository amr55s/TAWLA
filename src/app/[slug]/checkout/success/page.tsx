"use client";

import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { PLAN_CATALOG, isPaidPlanId } from "@/lib/billing/plans";

function SuccessInner() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const slug = params.slug as string;
	const rawPlan = searchParams.get("plan");
	const paidPlan = isPaidPlanId(rawPlan) ? rawPlan : null;
	const planLabel = paidPlan ? PLAN_CATALOG[paidPlan].label : "Selected";
	const [countdown, setCountdown] = useState(3);

	useEffect(() => {
		const timer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					clearInterval(timer);
					router.push(`/${slug}/admin`);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [router, slug]);

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#F5FAF7_0%,#EEF7F1_100%)] flex items-center justify-center px-6">
			<div className="absolute inset-0 pointer-events-none opacity-90">
				<div className="absolute left-[8%] top-[12%] h-48 w-48 rounded-full bg-emerald-200/30 blur-3xl" />
				<div className="absolute bottom-[10%] right-[10%] h-64 w-64 rounded-full bg-sky-200/25 blur-3xl" />
			</div>

			<div className="relative z-10 w-full max-w-xl rounded-[32px] border border-emerald-100 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(16,24,40,0.08)] backdrop-blur">
				{/* Success Icon */}
				<div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 shadow-[0_12px_30px_rgba(34,197,94,0.14)]">
					<CheckCircle2 size={46} className="text-emerald-600" />
				</div>

				{/* Badge */}
				<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-[11px] font-black tracking-[0.18em] text-emerald-700 uppercase">
					<Sparkles size={12} />
					Payment Successful & Secure
				</div>

				{/* Main Copy */}
				<h1 className="mb-3 text-4xl font-black tracking-[-0.04em] text-[#0A1628]">
					Subscription Activated
				</h1>
				<p className="mb-8 text-base leading-relaxed text-[#5B6472]">
					Your <span className="font-bold text-[#0A1628]">{planLabel}</span> plan is now active.
					Your payment has been securely confirmed, and your restaurant subscription is ready to use.
				</p>

				<div className="mb-6 rounded-[28px] border border-[#E8ECF1] bg-[#F8FAFC] p-5">
					<div className="flex items-center justify-center gap-2 text-sm font-bold text-[#0A1628]">
						<ShieldCheck size={16} className="text-emerald-600" />
						Protected payment, verified subscription, secure activation
					</div>
				</div>

				{/* Countdown */}
				<div className="inline-flex items-center gap-3 rounded-2xl border border-[#DCE8E1] bg-[#F3FBF6] px-6 py-3">
					<div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
						{countdown}
					</div>
					<p className="text-sm font-medium text-[#4B5563]">
						Redirecting to your dashboard...
					</p>
				</div>

				{/* Manual link */}
				<p className="mt-6 text-xs text-[#8B95A7]">
					Not redirecting?{" "}
					<button
						onClick={() => router.push(`/${slug}/admin`)}
						className="font-semibold text-[#0F4C75] hover:underline"
					>
						Go to Dashboard →
					</button>
				</p>
			</div>
		</div>
	);
}

export default function CheckoutSuccessPage() {
	return (
		<Suspense fallback={null}>
			<SuccessInner />
		</Suspense>
	);
}
