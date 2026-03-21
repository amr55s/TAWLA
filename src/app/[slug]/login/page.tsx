"use client";

import { motion } from "framer-motion";
import { Delete, Lock, Sparkles, User, ChevronRight } from "lucide-react";
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
	const [name, setName] = useState("");
	const [role, setRole] = useState<"waiter" | "cashier">("waiter");
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
	};

	const handleDelete = () => {
		if (loading || pin.length === 0) return;
		setPin(pin.slice(0, -1));
	};

	const handleLogin = async () => {
		if (!restaurantId || !name.trim() || pin.length < 4) {
			toast.error("Please fill in all fields (Name and 4-digit PIN)");
			return;
		}
		setLoading(true);

		try {
			// Query precisely for Name, Role, and PIN
			const { data: staff, error: staffError } = await supabase
				.from("restaurant_staff")
				.select("id, name, role, pin_code, restaurant_id")
				.eq("restaurant_id", restaurantId)
				.eq("name", name.trim())
				.eq("role", role)
				.eq("pin_code", pin)
				.maybeSingle();

			if (staffError || !staff) {
				toast.error("Invalid credentials. Please check your Name, Role, and PIN.");
				triggerError();
				return;
			}

			// Success - Mark as active
			await supabase
				.from("restaurant_staff")
				.update({ is_active: true })
				.eq("id", staff.id)
				.eq("restaurant_id", restaurantId);

			// Persist session
			localStorage.setItem(`tawla_staff_${restaurantId}_${staff.role}`, staff.id);

			posthog.identify(`staff_${staff.id}`, {
				staff_name: staff.name,
				role: staff.role,
				restaurant_id: staff.restaurant_id,
			});
			posthog.capture("staff_login_v2", {
				role: staff.role,
				restaurant_slug: slug,
			});

			toast.success(`Welcome back, ${staff.name}!`);

			if (staff.role === "waiter") {
				router.push(`/${slug}/waiter`);
			} else if (staff.role === "cashier") {
				router.push(`/${slug}/cashier`);
			} else {
				router.push(`/${slug}`);
			}
		} catch (err) {
			console.error("Staff login error:", err);
			posthog.captureException(err);
			triggerError();
		} finally {
			setLoading(false);
		}
	};

	function triggerError() {
		setErrorShake(true);
		setTimeout(() => {
			setErrorShake(false);
			setPin("");
		}, 500);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" suppressHydrationWarning>
			{/* Main Login Card */}
			<div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 md:p-10 flex flex-col gap-8">
				
				{/* Header Section */}
				<div className="flex flex-col items-center text-center gap-4">
					<div className="w-16 h-16 bg-[#0F4C75] rounded-2xl flex items-center justify-center shadow-md">
						<Lock className="w-8 h-8 text-white" />
					</div>
					<div>
						<h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
							Staff Login
						</h1>
						{restaurantName && (
							<div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200">
								<span className="w-2 h-2 rounded-full bg-[#0F4C75]" />
								<p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">
									{restaurantName}
								</p>
							</div>
						)}
					</div>
				</div>

				{initializing ? (
					<div className="flex flex-col items-center justify-center py-12 gap-4">
						<div className="w-8 h-8 border-3 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
						<p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
							Loading...
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-6">
						{/* Name Input */}
						<div className="flex flex-col gap-2">
							<label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
								<User size={14} />
								Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter your full name"
								className="w-full h-14 bg-gray-50 border border-gray-200 rounded-xl px-5 text-gray-900 font-semibold text-base
                                           focus:bg-white focus:border-[#0F4C75] focus:ring-2 focus:ring-[#0F4C75]/20 transition-all outline-none placeholder:text-gray-400"
							/>
						</div>

						{/* Role Toggle */}
						<div className="flex flex-col gap-2">
							<label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">
								Role
							</label>
							<div className="relative flex p-1 bg-gray-100 rounded-xl border border-gray-200">
								{(["waiter", "cashier"] as const).map((r) => (
									<button
										key={r}
										onClick={() => setRole(r)}
										className={`relative flex-1 h-12 rounded-lg text-sm font-bold capitalize transition-all z-10 ${
											role === r ? "text-gray-900" : "text-gray-500 hover:text-gray-700"
										}`}
									>
										{r}
									</button>
								))}
								<motion.div
									className="absolute top-1 left-1 bottom-1 bg-white rounded-lg shadow-sm"
									initial={false}
									animate={{
										x: role === "waiter" ? "0%" : "100%",
										width: "calc(50% - 4px)",
									}}
									transition={{ type: "spring", stiffness: 300, damping: 30 }}
								/>
							</div>
						</div>

						{/* PIN Section */}
						<div className="flex flex-col gap-6">
							<label className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mt-2">
								Enter 4-Digit PIN
							</label>

							<motion.div
								animate={errorShake ? { x: [-10, 10, -10, 10, 0] } : {}}
								transition={{ duration: 0.4 }}
								className="flex justify-center gap-4"
							>
								{[0, 1, 2, 3].map((index) => (
									<div
										key={index}
										className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
											index < pin.length
												? "bg-[#0F4C75] scale-110 shadow-sm"
												: "bg-gray-200 scale-100"
										}`}
									/>
								))}
							</motion.div>

							{/* Keypad */}
							<div className="grid grid-cols-3 gap-3 mx-auto w-full max-w-[280px]">
								{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
									<motion.button
										key={num}
										whileTap={{ scale: 0.95 }}
										onClick={() => handleInput(num.toString())}
										disabled={loading}
										className="aspect-square rounded-2xl bg-white border border-gray-200 text-2xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none shadow-sm flex items-center justify-center"
									>
										{num}
									</motion.button>
								))}
								<div />
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={() => handleInput("0")}
									disabled={loading}
									className="aspect-square rounded-2xl bg-white border border-gray-200 text-2xl font-semibold text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors focus:outline-none shadow-sm flex items-center justify-center"
								>
									0
								</motion.button>
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={handleDelete}
									disabled={loading || pin.length === 0}
									className="aspect-square rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-500 active:bg-rose-100 transition-colors focus:outline-none shadow-sm disabled:opacity-50 disabled:hover:bg-white"
								>
									<Delete size={24} />
								</motion.button>
							</div>
						</div>

						{/* Submit Button */}
						<motion.button
							whileHover={{ scale: 1.01 }}
							whileTap={{ scale: 0.98 }}
							onClick={handleLogin}
							disabled={loading || !name.trim() || pin.length < 4}
							className="w-full h-14 bg-[#0F4C75] text-white rounded-xl font-bold text-base shadow-md mt-4 
                                       disabled:opacity-50 transition-all flex items-center justify-center gap-3 group"
						>
							{loading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<>
									Login
									<ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
								</>
							)}
						</motion.button>
					</div>
				)}
				
				<p className="mt-4 text-center text-[10px] text-gray-400 font-semibold uppercase tracking-widest">
					Powered by Tawla
				</p>
			</div>
		</div>
	);
}
