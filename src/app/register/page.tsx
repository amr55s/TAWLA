"use client";

import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
	const router = useRouter();
	const supabase = createClient();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		if (password.length < 6) {
			setError("Password must be at least 6 characters.");
			return;
		}

		setLoading(true);
		const { error: signUpError } = await supabase.auth.signUp({
			email,
			password,
		});

		if (signUpError) {
			setError(signUpError.message);
			setLoading(false);
			return;
		}

		posthog.capture("restaurant_registered", {
			email,
		});

		router.push("/onboarding");
	};

	return (
		<div className="min-h-screen flex">
			{/* Left — Brand Panel */}
			<div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-[#0F4C75] via-[#0A3558] to-[#071A2E] flex-col justify-between p-12 overflow-hidden">
				{/* Decorative elements */}
				<div className="absolute top-[15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#3282B8]/10 blur-[100px]" />
				<div className="absolute bottom-[20%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#BBE1FA]/8 blur-[80px]" />

				<div className="relative z-10">
					<Link
						href="/"
						className="text-2xl font-bold text-white tracking-tight font-display"
					>
						Tawla
					</Link>
				</div>

				<div className="relative z-10 space-y-6">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#BBE1FA] text-xs font-semibold tracking-wider uppercase">
						<Sparkles size={12} />
						Beta Access
					</div>
					<h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight font-display">
						Your restaurant,
						<br />
						<span className="text-[#BBE1FA]">reimagined.</span>
					</h2>
					<p className="text-base text-[#BBE1FA]/70 max-w-md leading-relaxed">
						Join the next generation of restaurant management. Smart menus,
						real-time operations, and autonomous intelligence — all in one
						place.
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
				<div className="w-full max-w-[420px]">
					{/* Mobile logo */}
					<Link
						href="/"
						className="lg:hidden text-2xl font-bold text-[#0F4C75] tracking-tight font-display block mb-8"
					>
						Tawla
					</Link>

					<h1 className="text-[28px] font-bold text-[#0A1628] tracking-tight mb-2">
						Create your account
					</h1>
					<p className="text-sm text-[#7B8BA3] mb-8">
						Start your free beta — no credit card required.
					</p>

					{error && (
						<div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
							{error}
						</div>
					)}

					<form onSubmit={handleSignUp} className="space-y-5">
						{/* Email */}
						<div>
							<label
								htmlFor="email"
								className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider"
							>
								Email
							</label>
							<div className="relative">
								<Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8BA3]" />
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									placeholder="you@restaurant.com"
									className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-[#E8ECF1] text-sm text-[#0A1628]
                             placeholder:text-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8]
                             transition-all"
								/>
							</div>
						</div>

						{/* Password */}
						<div>
							<label
								htmlFor="password"
								className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider"
							>
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8BA3]" />
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									placeholder="Min. 6 characters"
									className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white border border-[#E8ECF1] text-sm text-[#0A1628]
                             placeholder:text-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8]
                             transition-all"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7B8BA3] hover:text-[#3D4F6F] transition-colors"
								>
									{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</div>

						{/* Confirm Password */}
						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider"
							>
								Confirm Password
							</label>
							<div className="relative">
								<Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7B8BA3]" />
								<input
									id="confirmPassword"
									type={showPassword ? "text" : "password"}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									required
									placeholder="Re-enter your password"
									className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white border border-[#E8ECF1] text-sm text-[#0A1628]
                             placeholder:text-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8]
                             transition-all"
								/>
							</div>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#0F4C75] text-white font-semibold text-sm
                         hover:bg-[#0A3558] active:scale-[0.98] transition-all duration-300 disabled:opacity-60
                         shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
						>
							{loading ? (
								<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<>
									Create Account <ArrowRight size={16} />
								</>
							)}
						</button>
					</form>

					<p className="mt-8 text-center text-sm text-[#7B8BA3]">
						Already have an account?{" "}
						<Link
							href="/login"
							className="text-[#3282B8] font-semibold hover:underline"
						>
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
