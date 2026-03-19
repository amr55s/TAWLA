"use client";

import { motion } from "framer-motion";
import { Delete, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import React, { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { getRestaurantBySlugClient } from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";

export default function UnifiedStaffLogin({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const router = useRouter();
	const { slug } = use(params);
	const supabase = createClient();

	const [restaurantId, setRestaurantId] = useState<string | null>(null);
	const [restaurantName, setRestaurantName] = useState<string>("");
	const [pin, setPin] = useState("");
	const [loading, setLoading] = useState(false);
	const [initializing, setInitializing] = useState(true);
	const [errorShake, setErrorShake] = useState(false);

	useEffect(() => {
		getRestaurantBySlugClient(slug).then((res) => {
			if (res) {
				setRestaurantId(res.id);
				setRestaurantName(res.name ?? "");
			} else {
				toast.error("Restaurant not found");
				router.push("/");
			}
			setInitializing(false);
		});
	}, [slug, router]);

	const handleInput = (digit: string) => {
		if (loading || pin.length >= 4) return;
		const newPin = pin + digit;
		setPin(newPin);
		if (newPin.length === 4) {
			verifyPin(newPin);
		}
	};

	const handleDelete = () => {
		if (loading || pin.length === 0) return;
		setPin(pin.slice(0, -1));
	};

	// ── STAFF LOGIN: Only queries public.restaurant_staff — no Supabase Auth ──
	const verifyPin = async (currentPin: string) => {
		if (!restaurantId) return;
		setLoading(true);

		try {
			const { data: staff, error } = await supabase
				.from("restaurant_staff")
				.select("id, name, role, restaurant_id")
				.eq("restaurant_id", restaurantId)
				.eq("pin_code", currentPin)
				.single();

			if (error || !staff) {
				triggerError();
				return;
			}

			// Mark as active
			await supabase
				.from("restaurant_staff")
				.update({ is_active: true })
				.eq("id", staff.id)
				.eq("restaurant_id", restaurantId);

			// Persist session locally — role-scoped per restaurant
			localStorage.setItem(
				`tawla_staff_${restaurantId}_${staff.role}`,
				staff.id,
			);

			posthog.identify(`staff_${staff.id}`, {
				staff_name: staff.name,
				role: staff.role,
				restaurant_id: staff.restaurant_id,
			});
			posthog.capture("staff_pin_login", {
				role: staff.role,
				restaurant_slug: slug,
			});

			toast.success(`Welcome, ${staff.name}!`);

			if (staff.role === "waiter") {
				router.push(`/${slug}/waiter`);
			} else if (staff.role === "cashier") {
				router.push(`/${slug}/cashier`);
			} else {
				router.push(`/${slug}`);
			}
		} catch (err) {
			console.error("Staff PIN verification error:", err);
			posthog.captureException(err);
			triggerError();
		} finally {
			setLoading(false);
		}
	};

	function triggerError() {
		toast.error("Invalid PIN code");
		setErrorShake(true);
		setTimeout(() => {
			setErrorShake(false);
			setPin("");
		}, 500);
	}

	// ── Always render the same outer HTML structure (prevents hydration mismatch) ──
	return (
		<div className="min-h-screen flex" suppressHydrationWarning>
			{/* Left — Brand Panel (hidden on mobile, shown on lg+) */}
			<div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#0F4C75] via-[#0A3558] to-[#071A2E] flex-col justify-between p-12 overflow-hidden">
				{/* Decorative blurs */}
				<div className="absolute top-[15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#3282B8]/10 blur-[100px]" />
				<div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#BBE1FA]/8 blur-[80px]" />

				<div className="relative z-10">
					<Link
						href="/"
						className="text-2xl font-bold text-white tracking-tight"
					>
						Tawla
					</Link>
				</div>

				<div className="relative z-10 space-y-6">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#BBE1FA] text-xs font-semibold tracking-wider uppercase">
						<Sparkles size={12} />
						Staff Portal
					</div>
					<h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight">
						Your restaurant,
						<br />
						<span className="text-[#BBE1FA]">reimagined.</span>
					</h2>
					<p className="text-base text-[#BBE1FA]/70 max-w-md leading-relaxed">
						Access your intelligent dashboard. Real-time operations and
						autonomous tracking — all in one place.
					</p>
				</div>

				<div className="relative z-10">
					<p className="text-xs text-white/30">
						© 2026 Tawla. All rights reserved.
					</p>
				</div>
			</div>

			{/* Right — PIN Form */}
			<div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8FAFB]">
				<div className="w-full max-w-sm mx-auto flex flex-col items-center">
					{/* Mobile logo */}
					<Link
						href="/"
						className="lg:hidden text-2xl font-bold text-[#0F4C75] tracking-tight block mb-8"
					>
						Tawla
					</Link>

					<div className="text-center mb-10 w-full">
						<div className="w-16 h-16 bg-[#0F4C75]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<Lock className="w-8 h-8 text-[#0F4C75]" />
						</div>
						<h1 className="text-2xl font-bold text-[#0A1628] mb-1">
							Staff Login
						</h1>
						{restaurantName && (
							<p className="text-sm font-semibold text-[#0F4C75]">
								{restaurantName}
							</p>
						)}
						<p className="text-sm text-[#5A6B82] mt-1">
							Enter your 4-digit PIN to access your dashboard
						</p>
					</div>

					{/* Show spinner while loading restaurant, or the pin pad once ready */}
					{initializing ? (
						<div className="flex items-center justify-center py-16">
							<div className="w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
						</div>
					) : (
						<>
							{/* PIN dots */}
							<motion.div
								animate={errorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
								transition={{ duration: 0.4 }}
								className="flex justify-center gap-4 mb-10"
							>
								{[0, 1, 2, 3].map((index) => (
									<div
										key={index}
										className={`w-4 h-4 rounded-full transition-all duration-300 ${
											index < pin.length
												? "bg-[#0F4C75] scale-110 shadow-[0_2px_8px_rgba(15,76,117,0.4)]"
												: "bg-[#E8ECF1] scale-100"
										}`}
									/>
								))}
							</motion.div>

							{/* Numeric keypad */}
							<div className="grid grid-cols-3 gap-4 w-full">
								{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
									<motion.button
										key={num}
										whileTap={{ scale: 0.95 }}
										onClick={() => handleInput(num.toString())}
										disabled={loading}
										className="h-[68px] rounded-2xl bg-white border border-[#E8ECF1] text-[28px] font-semibold text-[#0A1628] shadow-sm hover:bg-[#F8FAFC] hover:border-[#BBE1FA] hover:text-[#0F4C75] transition-all focus:outline-none"
									>
										{num}
									</motion.button>
								))}
								<div /> {/* bottom-left spacer */}
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={() => handleInput("0")}
									disabled={loading}
									className="h-[68px] rounded-2xl bg-white border border-[#E8ECF1] text-[28px] font-semibold text-[#0A1628] shadow-sm hover:bg-[#F8FAFC] hover:border-[#BBE1FA] hover:text-[#0F4C75] transition-all focus:outline-none"
								>
									0
								</motion.button>
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={handleDelete}
									disabled={loading || pin.length === 0}
									className="h-[68px] rounded-2xl bg-white border border-[#E8ECF1] flex items-center justify-center text-[#5A6B82] shadow-sm hover:bg-[#F8FAFC] hover:border-red-200 hover:text-red-500 transition-all focus:outline-none"
								>
									<Delete strokeWidth={2.5} size={28} />
								</motion.button>
							</div>

							<div className="mt-10 h-8 flex items-center justify-center">
								{loading && (
									<div className="flex items-center gap-2 text-sm text-[#0F4C75] font-semibold">
										<div className="w-4 h-4 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
										Verifying PIN...
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
