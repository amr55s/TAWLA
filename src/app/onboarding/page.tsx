"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	ArrowLeft,
	ArrowRight,
	Check,
	ChefHat,
	LayoutGrid,
	Link2,
	Loader2,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CUISINE_TYPES = [
	"General",
	"Italian",
	"Japanese",
	"Mexican",
	"Indian",
	"Chinese",
	"Thai",
	"Mediterranean",
	"American",
	"French",
	"Korean",
	"Middle Eastern",
	"Seafood",
	"Steakhouse",
	"Vegetarian",
	"Café & Bakery",
];

const TABLE_PRESETS = [5, 10, 15, 20, 25, 30];

const steps = [
	{ id: 1, label: "Restaurant", icon: ChefHat },
	{ id: 2, label: "Your URL", icon: Link2 },
	{ id: 3, label: "Tables", icon: LayoutGrid },
];

export default function OnboardingPage() {
	const router = useRouter();
	const supabase = createClient();

	const [step, setStep] = useState(1);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Step 1
	const [restaurantName, setRestaurantName] = useState("");
	const [cuisineType, setCuisineType] = useState("General");

	// Step 2
	const [slug, setSlug] = useState("");
	const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
	const [slugChecking, setSlugChecking] = useState(false);

	// Step 3
	const [tableCount, setTableCount] = useState(10);

	// Auto-generate slug from restaurant name
	useEffect(() => {
		if (step === 2 && !slug && restaurantName) {
			const generated = restaurantName
				.toLowerCase()
				.replace(/[^a-z0-9\s-]/g, "")
				.replace(/\s+/g, "-")
				.slice(0, 30);
			setSlug(generated);
		}
	}, [step, restaurantName, slug]);

	// Check slug uniqueness with debounce
	const checkSlug = useCallback(
		async (value: string) => {
			if (!value || value.length < 3) {
				setSlugAvailable(null);
				return;
			}
			setSlugChecking(true);
			const { data } = await supabase
				.from("restaurants")
				.select("id")
				.eq("slug", value)
				.maybeSingle();
			setSlugAvailable(!data);
			setSlugChecking(false);
		},
		[supabase],
	);

	useEffect(() => {
		if (slug.length < 3) {
			setSlugAvailable(null);
			return;
		}
		const timer = setTimeout(() => checkSlug(slug), 500);
		return () => clearTimeout(timer);
	}, [slug, checkSlug]);

	const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "")
			.slice(0, 30);
		setSlug(value);
	};

	const canProceed = () => {
		if (step === 1) return restaurantName.trim().length >= 2;
		if (step === 2) return slug.length >= 3 && slugAvailable === true;
		if (step === 3) return tableCount >= 1 && tableCount <= 100;
		return false;
	};

	const handleSubmit = async () => {
		setLoading(true);
		setError("");

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				router.push("/register");
				return;
			}

			// Pre-check Slug Uniqueness
			const { data: existingSlug } = await supabase
				.from("restaurants")
				.select("id")
				.eq("slug", slug)
				.maybeSingle();

			if (existingSlug) {
				setError("This URL is already taken. Please choose another one.");
				setStep(2);
				setLoading(false);
				return;
			}

			// Insert restaurant
			const { data: restaurant, error: restError } = await supabase
				.from("restaurants")
				.insert([
					{
						name: restaurantName.trim(),
						slug,
						cuisine_type: cuisineType,
						owner_id: user.id,
					},
				])
				.select()
				.single();

			if (restError) {
				console.error("Restaurant Insert Error:", restError);
				throw restError;
			}

			// Bulk-insert tables
			const tablesToInsert = Array.from({ length: tableCount }).map(
				(_, index) => ({
					restaurant_id: restaurant.id, // This must not be null/undefined
					table_number: index + 1,
				}),
			);

			console.log("Attempting to insert floor plan payload:", tablesToInsert);

			const { error: tablesError } = await supabase
				.from("tables")
				.insert(tablesToInsert);
			if (tablesError) {
				console.error("Tables Insert Error:", tablesError);
				throw tablesError;
			}

			router.push(`/${slug}/admin`);
		} catch (err: any) {
			if (err.code === "23505") {
				setError("This URL is already taken. Please choose another one.");
				setStep(2);
			} else {
				setError(err.message || "Something went wrong. Please try again.");
			}
			setLoading(false);
		}
	};

	if (!mounted) {
		return (
			<div className="min-h-screen bg-[#F8FAFB] flex flex-col">
				<header className="flex items-center justify-between px-6 lg:px-10 py-5 border-b border-[#E8ECF1] bg-white">
					<span className="text-xl font-bold text-[#0F4C75] tracking-tight font-display">
						Tawla
					</span>
				</header>
				<div className="flex-1 flex items-center justify-center">
					<div className="w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#F8FAFB] flex flex-col">
			{/* Header */}
			<header className="flex items-center justify-between px-6 lg:px-10 py-5 border-b border-[#E8ECF1] bg-white">
				<span className="text-xl font-bold text-[#0F4C75] tracking-tight font-display">
					Tawla
				</span>
				<div className="flex items-center gap-1.5">
					{steps.map((s) => (
						<div key={s.id} className="flex items-center gap-1.5">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
									step > s.id
										? "bg-[#0F4C75] text-white"
										: step === s.id
											? "bg-[#0F4C75] text-white shadow-[0_2px_8px_rgba(15,76,117,0.3)]"
											: "bg-[#E8ECF1] text-[#7B8BA3]"
								}`}
							>
								{step > s.id ? <Check size={14} /> : s.id}
							</div>
							<span
								className={`hidden sm:block text-xs font-medium ${step >= s.id ? "text-[#0A1628]" : "text-[#B0B8C4]"}`}
							>
								{s.label}
							</span>
							{s.id < 3 && (
								<div
									className={`w-8 h-0.5 rounded-full mx-1 ${step > s.id ? "bg-[#0F4C75]" : "bg-[#E8ECF1]"}`}
								/>
							)}
						</div>
					))}
				</div>
			</header>

			{/* Content */}
			<div className="flex-1 flex items-center justify-center px-6 py-10">
				<div className="w-full max-w-[520px]">
					{error && (
						<div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
							<AlertCircle size={16} /> {error}
						</div>
					)}

					<AnimatePresence mode="wait">
						{/* ── Step 1: Restaurant Info ── */}
						{step === 1 && (
							<motion.div
								key="step1"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
							>
								<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BBE1FA]/20 border border-[#BBE1FA]/40 text-[#3282B8] text-[10px] font-bold tracking-widest uppercase mb-6">
									<Sparkles size={11} /> Step 1 of 3
								</div>
								<h2 className="text-2xl font-bold text-[#0A1628] tracking-tight mb-2">
									Tell us about your restaurant
								</h2>
								<p className="text-sm text-[#7B8BA3] mb-8">
									Start with the basics — you can always update later.
								</p>

								<div className="space-y-5">
									<div>
										<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
											Restaurant Name
										</label>
										<input
											type="text"
											value={restaurantName}
											onChange={(e) => setRestaurantName(e.target.value)}
											placeholder="e.g. The Kitchen, La Piazza"
											className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#E8ECF1] text-sm text-[#0A1628]
                                 placeholder:text-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8] transition-all"
										/>
									</div>
									<div>
										<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
											Cuisine Type
										</label>
										<div className="flex flex-wrap gap-2">
											{CUISINE_TYPES.map((c) => (
												<button
													key={c}
													type="button"
													onClick={() => setCuisineType(c)}
													className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
														cuisineType === c
															? "bg-[#0F4C75] text-white shadow-sm"
															: "bg-white border border-[#E8ECF1] text-[#3D4F6F] hover:border-[#3282B8]/40 hover:text-[#0F4C75]"
													}`}
												>
													{c}
												</button>
											))}
										</div>
									</div>
								</div>
							</motion.div>
						)}

						{/* ── Step 2: URL Slug ── */}
						{step === 2 && (
							<motion.div
								key="step2"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
							>
								<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BBE1FA]/20 border border-[#BBE1FA]/40 text-[#3282B8] text-[10px] font-bold tracking-widest uppercase mb-6">
									<Sparkles size={11} /> Step 2 of 3
								</div>
								<h2 className="text-2xl font-bold text-[#0A1628] tracking-tight mb-2">
									Choose your URL
								</h2>
								<p className="text-sm text-[#7B8BA3] mb-8">
									This will be your restaurant's unique web address.
								</p>

								<div>
									<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
										URL Slug
									</label>
									<div className="flex items-center gap-0 rounded-xl border border-[#E8ECF1] bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#3282B8]/30 focus-within:border-[#3282B8] transition-all">
										<span className="px-4 py-3.5 text-sm text-[#7B8BA3] bg-[#F5F7FA] border-r border-[#E8ECF1] whitespace-nowrap select-none">
											tawla.app/
										</span>
										<input
											type="text"
											value={slug}
											onChange={handleSlugChange}
											placeholder="your-restaurant"
											className="flex-1 px-4 py-3.5 text-sm text-[#0A1628] placeholder:text-[#B0B8C4] focus:outline-none bg-transparent"
										/>
										<div className="px-3">
											{slugChecking && (
												<Loader2
													size={16}
													className="text-[#7B8BA3] animate-spin"
												/>
											)}
											{!slugChecking && slugAvailable === true && (
												<Check size={16} className="text-sky-500" />
											)}
											{!slugChecking && slugAvailable === false && (
												<AlertCircle size={16} className="text-red-400" />
											)}
										</div>
									</div>
									<div className="mt-2 h-5">
										{slug.length > 0 && slug.length < 3 && (
											<p className="text-xs text-[#7B8BA3]">
												Minimum 3 characters
											</p>
										)}
										{!slugChecking && slugAvailable === true && (
											<p className="text-xs text-sky-600 font-medium">
												✓ This URL is available!
											</p>
										)}
										{!slugChecking && slugAvailable === false && (
											<p className="text-xs text-red-500 font-medium">
												This URL is already taken. Try another.
											</p>
										)}
									</div>
								</div>
							</motion.div>
						)}

						{/* ── Step 3: Table Count ── */}
						{step === 3 && (
							<motion.div
								key="step3"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
							>
								<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BBE1FA]/20 border border-[#BBE1FA]/40 text-[#3282B8] text-[10px] font-bold tracking-widest uppercase mb-6">
									<Sparkles size={11} /> Step 3 of 3
								</div>
								<h2 className="text-2xl font-bold text-[#0A1628] tracking-tight mb-2">
									How many tables?
								</h2>
								<p className="text-sm text-[#7B8BA3] mb-8">
									We'll set up your floor plan. You can adjust this anytime.
								</p>

								<div>
									<label className="block text-xs font-semibold text-[#3D4F6F] mb-3 uppercase tracking-wider">
										Quick Select
									</label>
									<div className="flex flex-wrap gap-2 mb-6">
										{TABLE_PRESETS.map((n) => (
											<button
												key={n}
												type="button"
												onClick={() => setTableCount(n)}
												className={`w-14 h-14 rounded-2xl text-sm font-bold transition-all duration-200 ${
													tableCount === n
														? "bg-[#0F4C75] text-white shadow-[0_4px_12px_rgba(15,76,117,0.25)]"
														: "bg-white border border-[#E8ECF1] text-[#3D4F6F] hover:border-[#3282B8]/40"
												}`}
											>
												{n}
											</button>
										))}
									</div>

									<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
										Or enter a custom number
									</label>
									<input
										type="number"
										min={1}
										max={100}
										value={tableCount}
										onChange={(e) =>
											setTableCount(
												Math.max(
													1,
													Math.min(100, parseInt(e.target.value) || 1),
												),
											)
										}
										className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#E8ECF1] text-sm text-[#0A1628]
                               focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8] transition-all"
									/>
									<p className="mt-2 text-xs text-[#7B8BA3]">
										We'll create {tableCount} table{tableCount !== 1 ? "s" : ""}{" "}
										for your restaurant.
									</p>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Navigation */}
					<div className="flex items-center justify-between mt-10">
						<button
							type="button"
							onClick={() => setStep((s) => s - 1)}
							disabled={step === 1}
							className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
								step === 1
									? "opacity-0 pointer-events-none"
									: "text-[#3D4F6F] hover:bg-[#E8ECF1]/50"
							}`}
						>
							<ArrowLeft size={16} /> Back
						</button>

						{step < 3 ? (
							<button
								type="button"
								onClick={() => setStep((s) => s + 1)}
								disabled={!canProceed()}
								className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F4C75] text-white text-sm font-semibold
                           hover:bg-[#0A3558] active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed
                           shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
							>
								Continue <ArrowRight size={16} />
							</button>
						) : (
							<button
								type="button"
								onClick={handleSubmit}
								disabled={!canProceed() || loading}
								className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F4C75] text-white text-sm font-semibold
                           hover:bg-[#0A3558] active:scale-[0.98] transition-all duration-300 disabled:opacity-40
                           shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
							>
								{loading ? (
									<Loader2 size={16} className="animate-spin" />
								) : (
									<>
										Launch Your Restaurant <Sparkles size={14} />
									</>
								)}
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
