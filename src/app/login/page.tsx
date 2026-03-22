"use client";

import { motion } from "framer-motion";
import { AlertCircle, Lock, LogIn, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
	const router = useRouter();
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

		// Force Next.js server components to re-run and discover the new auth cookie
		router.refresh();

		if (role === "admin" || !role) {
			// Fetch the restaurant slug for this admin/owner
			const { data: restaurant } = await supabase
				.from("restaurants")
				.select("slug")
				.eq("owner_id", user.id)
				.maybeSingle();

			if (restaurant?.slug) {
				router.push(`/${restaurant.slug}/admin`);
				return;
			}
			// No restaurant yet — send to onboarding
			router.push("/onboarding");
			return;
		}

		if ((role === "cashier" || role === "waiter") && restaurantId) {
			const { data: restaurant } = await supabase
				.from("restaurants")
				.select("slug")
				.eq("id", restaurantId)
				.maybeSingle();

			if (restaurant?.slug) {
				router.push(`/${restaurant.slug}/${role}`);
				return;
			}
		}

		toast.error("No role or restaurant assigned. Contact your admin.");
		setLoading(false);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background px-5">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="w-full max-w-sm"
			>
				{/* Logo area */}
				<div className="text-center mb-8">
					<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
						<LogIn size={28} className="text-primary" />
					</div>
					<h1 className="text-2xl font-bold text-text-heading">Staff Login</h1>
					<p className="text-sm text-text-muted mt-1">
						Sign in to manage your restaurant
					</p>
				</div>

				{/* Login card */}
				<div
					className="rounded-2xl p-6 border border-white/40 shadow-card"
					style={{
						background: "rgba(255, 255, 255, 0.75)",
						backdropFilter: "blur(20px)",
						WebkitBackdropFilter: "blur(20px)",
					}}
				>
					{authError && (
						<div className="mb-4 bg-red-50 text-red-600 border border-red-200 p-3 rounded-md text-sm flex items-center gap-2">
							<AlertCircle size={16} className="shrink-0" />
							<p>{authError}</p>
						</div>
					)}

					<form onSubmit={handleLogin} className="space-y-4">
						{/* Email */}
						<div>
							<label className="text-xs font-semibold text-text-secondary mb-1.5 block">
								Email
							</label>
							<div className="relative">
								<Mail
									size={16}
									className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted"
								/>
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
									className={`w-full py-3 ps-10 pe-3 bg-background border ${
										emailError
											? "border-red-500 focus:border-red-500"
											: "border-border-light focus:border-primary"
									} rounded-xl text-sm text-text-body placeholder:text-text-muted focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
								/>
							</div>
							{emailError && (
								<p className="mt-1.5 text-xs text-red-500 font-medium">
									{emailError}
								</p>
							)}
						</div>

						{/* Password */}
						<div>
							<label className="text-xs font-semibold text-text-secondary mb-1.5 block">
								Password
							</label>
							<div className="relative">
								<Lock
									size={16}
									className="absolute start-3 top-1/2 -translate-y-1/2 text-text-muted"
								/>
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
									className={`w-full py-3 ps-10 pe-3 bg-background border ${
										passwordError
											? "border-red-500 focus:border-red-500"
											: "border-border-light focus:border-primary"
									} rounded-xl text-sm text-text-body placeholder:text-text-muted focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
								/>
							</div>
							{passwordError && (
								<p className="mt-1.5 text-xs text-red-500 font-medium">
									{passwordError}
								</p>
							)}
						</div>

						{/* Submit */}
						<motion.button
							type="submit"
							whileTap={!loading ? { scale: 0.97 } : undefined}
							disabled={loading}
							className="w-full py-3 mt-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
						>
							{loading ? (
								<>
									<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
									Signing in...
								</>
							) : (
								"Sign In"
							)}
						</motion.button>
					</form>
				</div>

				<p className="text-center text-xs text-text-muted mt-6">
					Guest? No login needed — just scan the QR code.
				</p>
			</motion.div>
		</div>
	);
}
