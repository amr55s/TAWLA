"use client";

import { motion } from "framer-motion";
import { AlertCircle, Lock, Mail, Sparkles, LogIn, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { useState, Suspense } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { LogoBrand } from "@/components/ui/LogoBrand";

function LoginInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const plan = searchParams.get("plan");
	const supabase = createClient();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [authError, setAuthError] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setEmailError("");
		setPasswordError("");
		setAuthError("");

		let hasError = false;

		if (!email.trim()) {
			setEmailError("Email is required");
			hasError = true;
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			setEmailError("Please enter a valid email address");
			hasError = true;
		}

		if (!password) {
			setPasswordError("Password is required");
			hasError = true;
		}

		if (hasError) return;

		setLoading(true);

		const { data, error } = await supabase.auth.signInWithPassword({
			email: email.trim(),
			password,
		});

		if (error) {
			if (error.message?.toLowerCase().includes("email not confirmed")) {
				setAuthError(
					"Please check your email to confirm your account before logging in.",
				);
			} else if (error.message?.toLowerCase().includes("invalid login credentials")) {
				setAuthError("Invalid email or password. Please try again.");
			} else {
				setAuthError(error.message || "An error occurred during login.");
			}
			setLoading(false);
			return;
		}

		const user = data.user;
		if (!user) {
			toast.error("Login failed. Please try again.");
			setLoading(false);
			return;
		}

		toast.success("Welcome back!");

		posthog.identify(user.id, {
			email: user.email,
		});
		posthog.capture("admin_signed_in", {
			user_id: user.id,
		});

		const role = user.user_metadata?.role as string | undefined;
		const restaurantId = user.user_metadata?.restaurant_id as
			| string
			| undefined;

		router.refresh();

		if (user.email === "amrkhaled.contact@gmail.com") {
			router.push("/super-admin");
			return;
		}

		if (role === "admin" || !role) {
			const { data: restaurants } = await supabase
				.from("restaurants")
				.select("slug")
				.eq("owner_id", user.id)
				.limit(1);
			const restaurant = restaurants?.[0];

			if (restaurant?.slug) {
				router.push(`/${restaurant.slug}/admin`);
				return;
			}
			if (plan) {
				router.push(`/onboarding?plan=${plan}`);
			} else {
				router.push("/onboarding");
			}
			return;
		}

		if ((role === "cashier" || role === "waiter") && restaurantId) {
			const { data: restaurants } = await supabase
				.from("restaurants")
				.select("slug")
				.eq("id", restaurantId)
				.limit(1);
			const restaurant = restaurants?.[0];

			if (restaurant?.slug) {
				router.push(`/${restaurant.slug}/${role}`);
				return;
			}
		}

		toast.error("No role or restaurant assigned. Contact your admin.");
		setLoading(false);
	};

	return (
		<div className="min-h-screen flex">
			{/* Left — Brand Panel */}
			<div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#0F4C75] via-[#0A3558] to-[#071A2E] flex-col justify-between p-12 overflow-hidden">
				{/* Decorative elements */}
				<div className="absolute top-[15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#3282B8]/10 blur-[100px]" />
				<div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#BBE1FA]/8 blur-[80px]" />

				<div className="relative z-10">
					<LogoBrand variant="footer" className="scale-110 origin-left" />
				</div>

				<div className="relative z-10 space-y-6">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#BBE1FA] text-xs font-semibold tracking-wider uppercase">
						<Sparkles size={12} />
						Partner Portal
					</div>
					<h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight font-display">
						Control your restaurant,
						<br />
						<span className="text-[#BBE1FA]">from anywhere.</span>
					</h2>
					<p className="text-base text-[#BBE1FA]/70 max-w-md leading-relaxed">
						Sign in to access your dashboard, manage your menu, and track
						real-time operations with Tawla's autonomous intelligence.
					</p>
				</div>

				<div className="relative z-10">
					<p className="text-xs text-white/30">
						© 2026 Tawla. All rights reserved.
					</p>
				</div>
			</div>

			{/* Right — Form */}
			<div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F8FAFB]">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-[420px]"
				>
					{/* Mobile logo */}
					<div className="lg:hidden mb-8">
						<LogoBrand variant="primary" className="scale-110 origin-left" />
					</div>

					<h1 className="text-[28px] font-bold text-[#0A1628] tracking-tight mb-2">
						Welcome Back
					</h1>
					<p className="text-sm text-[#7B8BA3] mb-8">
						Sign in to the staff intelligence portal.
					</p>

					{authError && (
						<div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
							<AlertCircle size={16} className="shrink-0" />
							<p>{authError}</p>
						</div>
					)}

					<form onSubmit={handleLogin} className="space-y-5">
						{/* Email */}
						<div>
							<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8BA3]" />
								<input
									type="email"
									autoComplete="email"
									value={email}
									onChange={(e) => {
										setEmail(e.target.value);
										if (emailError) setEmailError("");
									}}
									disabled={loading}
									placeholder="you@restaurant.com"
									className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border ${
										emailError ? "border-red-500" : "border-slate-200"
									} text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8] transition-all disabled:opacity-50`}
								/>
							</div>
							{emailError && (
								<p className="mt-1.5 text-xs text-red-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
									{emailError}
								</p>
							)}
						</div>

						{/* Password */}
						<div>
							<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8BA3]" />
								<input
									type="password"
									autoComplete="current-password"
									value={password}
									onChange={(e) => {
										setPassword(e.target.value);
										if (passwordError) setPasswordError("");
										if (authError) setAuthError("");
									}}
									disabled={loading}
									placeholder="Enter your password"
									className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border ${
										passwordError ? "border-red-500" : "border-slate-200"
									} text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8] transition-all disabled:opacity-50`}
								/>
							</div>
							{passwordError && (
								<p className="mt-1.5 text-xs text-red-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
									{passwordError}
								</p>
							)}
						</div>

						<motion.button
							type="submit"
							whileTap={!loading ? { scale: 0.97 } : undefined}
							disabled={loading}
							className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#0F4C75] text-white font-semibold text-sm
                                 hover:bg-[#0A3558] active:scale-[0.98] transition-all duration-300 disabled:opacity-60
                                 shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
						>
							{loading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<>
									Sign In <ArrowRight size={16} />
								</>
							)}
						</motion.button>
					</form>

					<p className="mt-8 text-center text-sm text-[#7B8BA3]">
						Don't have an account?{" "}
						<Link
							href="/register"
							className="text-[#3282B8] font-semibold hover:underline"
						>
							Register Restaurant
						</Link>
					</p>
				</motion.div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginInner />
		</Suspense>
	);
}

