"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function SuccessInner() {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const slug = params.slug as string;
	const plan = searchParams.get("plan") || "pro";
	const [countdown, setCountdown] = useState(5);

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
		<div className="min-h-screen bg-gradient-to-br from-[#0F4C75] via-[#0A3558] to-[#071A2E] flex items-center justify-center px-6">
			{/* Decorative glow */}
			<div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#3282B8]/15 blur-[120px] pointer-events-none" />

			<div className="relative z-10 text-center max-w-md">
				{/* Success Icon */}
				<div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center mb-8 animate-pulse">
					<CheckCircle2 size={40} className="text-emerald-400" />
				</div>

				{/* Badge */}
				<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#BBE1FA] text-xs font-semibold tracking-wider uppercase mb-6">
					<Sparkles size={12} />
					Payment Confirmed
				</div>

				{/* Main Copy */}
				<h1 className="text-3xl font-bold text-white tracking-tight mb-3">
					You're all set! 🎉
				</h1>
				<p className="text-base text-[#BBE1FA]/70 mb-8 leading-relaxed">
					Your <span className="text-white font-semibold capitalize">{plan}</span> plan is now active.
					All premium features have been unlocked for your restaurant.
				</p>

				{/* Countdown */}
				<div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
					<div className="w-8 h-8 rounded-full bg-[#3282B8] flex items-center justify-center text-white font-bold text-sm">
						{countdown}
					</div>
					<p className="text-sm text-[#BBE1FA]/60">
						Redirecting to your dashboard...
					</p>
				</div>

				{/* Manual link */}
				<p className="mt-6 text-xs text-white/30">
					Not redirecting?{" "}
					<button
						onClick={() => router.push(`/${slug}/admin`)}
						className="text-[#BBE1FA] hover:underline font-medium"
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
