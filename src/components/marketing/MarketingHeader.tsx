"use client";

import { LogoBrand } from "@/components/ui/LogoBrand";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

/* ═══ Language Context & Translations ═══ */
type Language = "en" | "ar";

const translations = {
	en: {
		nav: {
			journey: "How It Works",
			features: "Features",
			pricing: "Pricing",
			blog: "Blog",
			request_demo: "Try Beta Free",
			language: "Language",
		},
	},
	ar: {
		nav: {
			journey: "كيف يعمل",
			features: "المميزات",
			pricing: "الباقات",
			blog: "المدونة",
			request_demo: "جرّب مجاناً",
			language: "اللغة",
		},
	},
} as const;

interface LanguageContextType {
	lang: Language;
	setLang: (lang: Language) => void;
	t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function useTranslation() {
	const context = useContext(LanguageContext);
	if (!context) throw new Error("useTranslation must be used within LanguageProvider");
	return context;
}

/* ═══ Language Toggle ═══ */
function LangToggle({ compact = false }: { compact?: boolean }) {
	const { lang, setLang } = useTranslation();
	return (
		<div
			className={`flex items-center gap-0.5 p-1 rounded-full bg-tawla-ice/40 border border-tawla-deep/8 ${compact ? "scale-90" : ""}`}
		>
			{(["AR", "EN"] as const).map((l) => {
				const val = l.toLowerCase() as Language;
				const active = lang === val;
				return (
					<button
						key={l}
						onClick={() => setLang(val)}
						className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all duration-300 ${
							active
								? "bg-tawla-deep text-white shadow-sm"
								: "text-tawla-body-blue hover:text-tawla-deep"
						}`}
					>
						{l}
					</button>
				);
			})}
		</div>
	);
}

/* ═══ Inner Header (uses context) ═══ */
function HeaderInner() {
	const { t } = useTranslation();
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);

	const { scrollY } = useScroll();
	useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 50));

	const links = [
		{ label: t("nav.journey"), href: "/#journey" },
		{ label: t("nav.features"), href: "/#features" },
		{ label: t("nav.pricing"), href: "/#pricing" },
		{ label: t("nav.blog"), href: "/blog" },
	];

	return (
		<header className="fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-500 px-4 pt-0">
			<div
				className={`flex items-center justify-between h-[72px] transition-all duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)] ${
					scrolled
						? "max-w-4xl w-full mt-3 px-6 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-[0_8px_32px_rgba(15,76,117,0.08)]"
						: "max-w-[1200px] w-full px-6 lg:px-8 bg-transparent border border-transparent"
				}`}
			>
				<LogoBrand
					variant="primary"
					href="/"
					className={`transition-all duration-500 ${scrolled ? "scale-90" : "scale-100"}`}
				/>

				<nav className="hidden md:flex items-center gap-6">
					{links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							className="text-sm font-medium text-tawla-body-blue hover:text-tawla-deep transition-colors"
						>
							{l.label}
						</a>
					))}
				</nav>

				<div className="hidden md:flex items-center gap-4">
					<LangToggle compact={scrolled} />
					<div className="flex items-center gap-2 lg:gap-3">
						<a
							href="/login"
							className="text-sm font-medium text-tawla-body-blue hover:text-tawla-deep transition-colors whitespace-nowrap"
						>
							Sign In
						</a>
						<a
							href="/register"
							className={`inline-flex items-center justify-center rounded-full bg-tawla-deep text-white font-semibold
								hover:bg-tawla-dark hover:scale-[1.03] active:scale-[0.98] transition-all duration-500
								shadow-[0_4px_14px_rgba(15,76,117,0.25)] whitespace-nowrap ${
									scrolled ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm"
								}`}
						>
							{t("nav.request_demo")}
						</a>
					</div>
				</div>

				<button
					onClick={() => setOpen(!open)}
					className="md:hidden p-2 text-tawla-deep"
					aria-label="Toggle menu"
				>
					{open ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{open && (
				<motion.div
					initial={{ opacity: 0, y: -8 }}
					animate={{ opacity: 1, y: 0 }}
					className="absolute top-[72px] inset-x-4 md:hidden bg-white/95 backdrop-blur-xl border border-tawla-deep/5 rounded-2xl px-6 pb-6 pt-4 shadow-lg"
				>
					{links.map((l) => (
						<a
							key={l.href}
							href={l.href}
							onClick={() => setOpen(false)}
							className="block py-3 text-base font-medium text-tawla-body-blue"
						>
							{l.label}
						</a>
					))}
					<div className="flex items-center justify-between mt-3 mb-4">
						<span className="text-xs text-tawla-muted font-medium">{t("nav.language")}</span>
						<LangToggle />
					</div>
					<div className="flex flex-col gap-2">
						<a
							href="/login"
							className="block text-center py-3 rounded-full border border-[#E8ECF1] text-tawla-deep text-sm font-semibold"
						>
							Sign In
						</a>
						<a
							href="/register"
							className="block text-center py-3 rounded-full bg-tawla-deep text-white text-sm font-semibold"
						>
							{t("nav.request_demo")}
						</a>
					</div>
				</motion.div>
			)}
		</header>
	);
}

/* ═══ Provider Wrapper + Exported Header ═══ */
export function MarketingHeader() {
	const [lang, setLang] = useState<Language>("en");
	const t = useCallback(
		(keyString: string) => {
			const keys = keyString.split(".");
			let current: any = translations[lang];
			for (const k of keys) {
				if (current[k] === undefined) return keyString;
				current = current[k];
			}
			return current as string;
		},
		[lang],
	);

	return (
		<LanguageContext.Provider value={{ lang, setLang, t }}>
			<HeaderInner />
		</LanguageContext.Provider>
	);
}
