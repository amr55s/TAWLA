"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	AlertCircle,
	Building2,
	Check,
	ChevronRight,
	Download,
	LayoutGrid,
	Loader2,
	Palette,
	QrCode,
} from "lucide-react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const FONT_OPTIONS = [
	{ value: "Tajawal", label: "Tajawal (Arabic-first)" },
	{ value: "Cairo", label: "Cairo" },
	{ value: "Inter", label: "Inter (Latin)" },
	{ value: "Poppins", label: "Poppins" },
];

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface ThemeData {
	primary: string;
	background: string;
	fontFamily?: string;
}

interface RestaurantSettings {
	id: string;
	name: string;
	slug: string;
	theme_colors: ThemeData | null;
}

function ColorField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div>
			<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
				{label}
			</label>
			<div className="flex items-center gap-3">
				<div
					className="w-10 h-10 rounded-xl border border-[#E8ECF1] flex-shrink-0 shadow-sm"
					style={{ backgroundColor: HEX_RE.test(value) ? value : "#cccccc" }}
				/>
				<input
					type="color"
					value={HEX_RE.test(value) ? value : "#000000"}
					onChange={(e) => onChange(e.target.value)}
					className="w-10 h-10 rounded-xl border border-[#E8ECF1] cursor-pointer p-1 bg-white"
					title="Pick a color"
				/>
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="#000000"
					className="flex-1 py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20 focus:border-[#0F4C75] transition-colors"
				/>
			</div>
		</div>
	);
}

function SectionCard({
	title,
	description,
	icon: Icon,
	children,
}: {
	title: string;
	description: string;
	icon: React.ElementType;
	children: React.ReactNode;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white border border-[#E8ECF1] rounded-2xl shadow-sm overflow-hidden"
		>
			<div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center gap-3">
				<div className="w-10 h-10 rounded-xl bg-[#E8F4FD] flex items-center justify-center flex-shrink-0">
					<Icon size={18} className="text-[#0F4C75]" />
				</div>
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">{title}</h3>
					<p className="text-xs text-[#64748B]">{description}</p>
				</div>
			</div>
			<div className="px-6 py-6 space-y-5">{children}</div>
		</motion.div>
	);
}

export default function AdminSettingsPage() {
	const params = useParams<{ slug: string }>();
	const slug = params.slug;

	const [restaurant, setRestaurant] = useState<RestaurantSettings | null>(null);
	const [loading, setLoading] = useState(true);
	const [fetchError, setFetchError] = useState<string | null>(null);

	// Branding
	const [primary, setPrimary] = useState("#0F4C75");
	const [background, setBackground] = useState("#FAF8F5");
	const [fontFamily, setFontFamily] = useState("Tajawal");
	const [savingBranding, setSavingBranding] = useState(false);

	// Tables
	const [tableCount, setTableCount] = useState<number>(10);
	const [currentTableCount, setCurrentTableCount] = useState<number>(0);
	const [savingTables, setSavingTables] = useState(false);

	// QR
	const [baseUrl, setBaseUrl] = useState("");
	const qrRef = useRef<HTMLDivElement>(null);

	// ── Auth: slug-based fetch, verify ownership ──
	const fetchSettings = useCallback(async () => {
		setLoading(true);
		setFetchError(null);
		try {
			const {
				data: { user },
				error: authError,
			} = await supabase.auth.getUser();
			if (authError || !user) {
				setFetchError("You must be logged in to view settings.");
				return;
			}

			// Fetch restaurant by slug
			const { data: rest, error: restError } = await supabase
				.from("restaurants")
				.select("id, name, slug, theme_colors")
				.eq("slug", slug)
				.maybeSingle();

			if (restError) throw new Error(restError.message);
			if (!rest) throw new Error(`No restaurant found with slug "${slug}".`);

			// Verify ownership
			const { data: fullRest } = await supabase
				.from("restaurants")
				.select("owner_id")
				.eq("id", rest.id)
				.single();

			if (fullRest?.owner_id && fullRest.owner_id !== user.id) {
				throw new Error("Unauthorized: you do not own this restaurant.");
			}

			setRestaurant(rest as RestaurantSettings);

			// Populate theme
			const tc = rest.theme_colors as ThemeData | null;
			if (tc) {
				setPrimary(tc.primary || "#0F4C75");
				setBackground(tc.background || "#FAF8F5");
				setFontFamily(tc.fontFamily || "Tajawal");
			}

			// Count actual tables
			const { count } = await supabase
				.from("tables")
				.select("id", { count: "exact", head: true })
				.eq("restaurant_id", rest.id);

			const actualCount = count ?? 0;
			setCurrentTableCount(actualCount);
			setTableCount(actualCount || 10);

			if (typeof window !== "undefined") {
				setBaseUrl(window.location.origin);
			}
		} catch (err: any) {
			console.error("Settings fetch error:", err);
			setFetchError(err.message || "Failed to load settings.");
		} finally {
			setLoading(false);
		}
	}, [slug]);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	// ── Save Branding ──
	const handleSaveBranding = async () => {
		if (!restaurant) return;
		if (!HEX_RE.test(primary)) {
			toast.error("Primary color must be a valid hex (e.g. #0F4C75)");
			return;
		}
		if (!HEX_RE.test(background)) {
			toast.error("Background color must be a valid hex (e.g. #FAF8F5)");
			return;
		}

		setSavingBranding(true);
		const theme: ThemeData = { primary, background, fontFamily };

		const { error } = await supabase
			.from("restaurants")
			.update({ theme_colors: theme })
			.eq("id", restaurant.id)
			.eq("owner_id", (await supabase.auth.getUser()).data.user?.id ?? "");

		if (error) {
			toast.error(error.message || "Failed to update branding");
		} else {
			toast.success("Branding saved — changes are live!");
		}
		setSavingBranding(false);
	};

	// ── Save Tables (sync missing tables) ──
	const handleSaveTables = async () => {
		if (!restaurant) return;
		if (tableCount < 1 || tableCount > 200) {
			toast.error("Table count must be between 1 and 200");
			return;
		}

		setSavingTables(true);
		try {
			if (tableCount > currentTableCount) {
				// Insert only the missing table rows
				const newTables = Array.from(
					{ length: tableCount - currentTableCount },
					(_, i) => ({
						restaurant_id: restaurant.id,
						table_number: currentTableCount + i + 1,
					}),
				);

				const { error: insertError } = await supabase
					.from("tables")
					.insert(newTables);

				if (insertError) throw insertError;
				setCurrentTableCount(tableCount);
				toast.success(
					`Tables updated — added ${newTables.length} new table${newTables.length > 1 ? "s" : ""}.`,
				);
			} else if (tableCount < currentTableCount) {
				// Remove the highest-numbered excess tables
				// Fetch table IDs ordered by table_number descending, take the excess ones
				const excess = currentTableCount - tableCount;
				const { data: toDelete } = await supabase
					.from("tables")
					.select("id")
					.eq("restaurant_id", restaurant.id)
					.order("table_number", { ascending: false })
					.limit(excess);

				if (toDelete && toDelete.length > 0) {
					await supabase
						.from("tables")
						.delete()
						.in(
							"id",
							toDelete.map((t) => t.id),
						)
						.eq("restaurant_id", restaurant.id);
				}

				setCurrentTableCount(tableCount);
				toast.success(`Tables reduced to ${tableCount}.`);
			} else {
				toast("Table count is already up to date.");
			}
		} catch (err: any) {
			console.error("Table sync error:", err);
			toast.error(err.message || "Failed to sync tables");
		} finally {
			setSavingTables(false);
		}
	};

	// ── QR Download ──
	const handleDownloadQR = () => {
		if (!qrRef.current) return;
		const svg = qrRef.current.querySelector("svg");
		if (!svg) return;

		const serializer = new XMLSerializer();
		const svgStr = serializer.serializeToString(svg);
		const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
		const url = URL.createObjectURL(svgBlob);

		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const scale = 3;
			canvas.width = img.width * scale;
			canvas.height = img.height * scale;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
			const pngUrl = canvas.toDataURL("image/png");
			const a = document.createElement("a");
			a.href = pngUrl;
			a.download = `${slug}-qr-code.png`;
			a.click();
			URL.revokeObjectURL(url);
		};
		img.src = url;
	};

	const qrValue = baseUrl && slug ? `${baseUrl}/${slug}` : "";

	// ── Loading UI ──
	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-64 gap-4">
				<div className="animate-spin w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full" />
				<p className="text-sm text-[#64748B]">Loading settings…</p>
			</div>
		);
	}

	// ── Error UI ──
	if (fetchError) {
		return (
			<div className="max-w-md mx-auto mt-12">
				<div className="bg-white border border-red-100 rounded-2xl p-8 text-center shadow-sm">
					<div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
						<AlertCircle size={24} className="text-red-500" />
					</div>
					<h3 className="text-base font-bold text-[#0A1628] mb-2">
						Error loading settings
					</h3>
					<p className="text-sm text-[#64748B] mb-5">{fetchError}</p>
					<button
						onClick={fetchSettings}
						className="px-5 py-2.5 rounded-xl bg-[#0F4C75] text-white text-sm font-semibold hover:bg-[#0A3558] transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	// ── Main Settings UI ──
	return (
		<div className="max-w-3xl">
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-2xl font-black text-[#0A1628]">Settings</h1>
				{restaurant && (
					<div className="flex items-center gap-1.5 mt-1 text-sm text-[#64748B]">
						<span className="font-semibold text-[#0F4C75]">
							{restaurant.name}
						</span>
						<ChevronRight size={14} />
						<span className="text-xs font-mono bg-[#F1F5F9] px-2 py-0.5 rounded-lg">
							/{slug}/admin
						</span>
					</div>
				)}
			</div>

			<div className="space-y-6">
				{/* ── Card 1: Theme & Branding ── */}
				<SectionCard
					title="Theme & Branding"
					description="Colors and font shown to guests in the menu"
					icon={Palette}
				>
					<ColorField
						label="Primary Color"
						value={primary}
						onChange={setPrimary}
					/>
					<ColorField
						label="Background Color"
						value={background}
						onChange={setBackground}
					/>

					<div>
						<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
							Font Family
						</label>
						<select
							value={fontFamily}
							onChange={(e) => setFontFamily(e.target.value)}
							className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20 focus:border-[#0F4C75] transition-colors"
						>
							{FONT_OPTIONS.map((f) => (
								<option key={f.value} value={f.value}>
									{f.label}
								</option>
							))}
						</select>
					</div>

					{/* Live preview strip */}
					<div
						className="w-full p-4 rounded-xl border border-[#E8ECF1] flex items-center gap-4"
						style={{ backgroundColor: background }}
					>
						<div className="flex-1">
							<p className="text-xs font-bold text-[#64748B] uppercase tracking-wide mb-1">
								Preview
							</p>
							<p
								className="text-base font-bold"
								style={{ color: primary, fontFamily }}
							>
								{restaurant?.name || "Restaurant Name"}
							</p>
							<p className="text-[11px] text-[#64748B]" style={{ fontFamily }}>
								Welcome to our menu
							</p>
						</div>
						<div
							className="w-8 h-8 rounded-lg shadow-sm"
							style={{ backgroundColor: primary }}
						/>
					</div>

					<motion.button
						whileTap={{ scale: 0.97 }}
						onClick={handleSaveBranding}
						disabled={savingBranding}
						className="w-full py-3 rounded-xl bg-[#0F4C75] hover:bg-[#0A3558] text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-[#0F4C75]/20"
					>
						{savingBranding ? (
							<>
								<Loader2 size={16} className="animate-spin" /> Saving…
							</>
						) : (
							<>
								<Check size={16} /> Save Branding
							</>
						)}
					</motion.button>
				</SectionCard>

				{/* ── Card 2: Operations & Tables ── */}
				<SectionCard
					title="Operations & Tables"
					description="Manage the number of physical tables in your restaurant"
					icon={LayoutGrid}
				>
					<div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl px-4 py-3">
						<div>
							<p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">
								Currently in DB
							</p>
							<p className="text-2xl font-black text-[#0F4C75]">
								{currentTableCount} tables
							</p>
						</div>
						<div className="w-10 h-10 rounded-xl bg-[#E8F4FD] flex items-center justify-center">
							<LayoutGrid size={18} className="text-[#0F4C75]" />
						</div>
					</div>

					<div>
						<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
							New Table Count
						</label>
						<input
							type="number"
							min="1"
							max="200"
							value={tableCount}
							onChange={(e) => setTableCount(Number(e.target.value))}
							className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20 focus:border-[#0F4C75] transition-colors"
							placeholder="e.g. 15"
						/>
						<p className="text-[11px] text-[#64748B] mt-1.5">
							{tableCount > currentTableCount
								? `Will add ${tableCount - currentTableCount} new table${tableCount - currentTableCount > 1 ? "s" : ""} to the database.`
								: tableCount < currentTableCount
									? `Will remove the ${currentTableCount - tableCount} highest-numbered tables.`
									: "No change needed."}
						</p>
					</div>

					<motion.button
						whileTap={{ scale: 0.97 }}
						onClick={handleSaveTables}
						disabled={savingTables || tableCount === currentTableCount}
						className="w-full py-3 rounded-xl bg-[#0F4C75] hover:bg-[#0A3558] text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-[#0F4C75]/20"
					>
						{savingTables ? (
							<>
								<Loader2 size={16} className="animate-spin" /> Syncing Tables…
							</>
						) : (
							<>
								<Check size={16} /> Sync Tables
							</>
						)}
					</motion.button>
				</SectionCard>

				{/* ── Card 3: QR Code ── */}
				<SectionCard
					title="Guest QR Code"
					description="Share this code for guests to access the digital menu on their devices"
					icon={QrCode}
				>
					<div>
						<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
							Network Base URL
						</label>
						<input
							type="text"
							value={baseUrl}
							onChange={(e) => setBaseUrl(e.target.value)}
							placeholder="http://192.168.1.x:3000"
							className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] font-mono focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20 focus:border-[#0F4C75] transition-colors"
							style={{ direction: "ltr" }}
						/>
						<p className="text-[11px] text-[#64748B] mt-1.5">
							Change this to your local IP if guests are on the same Wi-Fi.
						</p>
					</div>

					<div className="flex flex-col items-center gap-5 pt-2">
						<div
							ref={qrRef}
							className="bg-white border-2 border-[#E8ECF1] rounded-2xl p-6 shadow-sm"
						>
							{qrValue ? (
								<QRCodeSVG
									value={qrValue}
									size={180}
									bgColor="transparent"
									fgColor="#0A1628"
									level="M"
								/>
							) : (
								<div className="w-[180px] h-[180px] flex items-center justify-center text-[#94A3B8] text-sm">
									No URL configured
								</div>
							)}
						</div>

						{qrValue && (
							<p className="text-xs text-[#64748B] text-center break-all max-w-[260px] font-mono">
								{qrValue}
							</p>
						)}

						<motion.button
							whileTap={{ scale: 0.97 }}
							onClick={handleDownloadQR}
							disabled={!qrValue}
							className="px-6 py-3 rounded-xl bg-[#0F4C75] hover:bg-[#0A3558] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40 transition-colors"
						>
							<Download size={16} />
							Download QR Code (PNG)
						</motion.button>
					</div>
				</SectionCard>
			</div>
		</div>
	);
}
