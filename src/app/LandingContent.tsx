"use client";

import Image from "next/image";
import { LogoBrand } from "@/components/ui/LogoBrand";
import {
	AnimatePresence,
	motion,
	useInView,
	useMotionValueEvent,
	useScroll,
} from "framer-motion";
import {
	ArrowRight,
	BookOpen,
	Check,
	Cloud,
	CreditCard,
	Globe,
	LayoutDashboard,
	Menu,
	Send,
	ShieldCheck,
	X,
	Zap,
} from "lucide-react";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════
   TRANSLATION CONTEXT & DICTIONARY
   ════════════════════════════════════════════════════ */
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
		hero: {
			headline_1: "The Digital Engine for",
			headline_2: "Modern Restaurants.",
			subtitle:
				"Tawla connects your guests, waiters, and cashiers in one seamless ecosystem. QR ordering, real-time floor management, and instant billing — all from day one.",
			cta_primary: "Try Beta Free",
			cta_secondary: "See How It Works",
			dashboard_alt: "Tawla dashboard preview",
		},
		journey: {
			heading_small: "How It Works",
			heading_main: "From Guest to Bill in Three Steps",
			tab1: "The Guest",
			tab2: "The Waiter",
			tab3: "The Cashier",
			step1_title: "Guests Order in Seconds",
			step1_text:
				"Guests scan a QR code at their table and instantly browse a beautiful digital menu. They add items, customize, and place their order — no app download, no waiting for a waiter.",
			step1_b1: "Instant QR menu access",
			step1_b2: "Bilingual menu (Arabic & English)",
			step1_b3: "One-tap ordering with live totals",
			step1_img_alt: "Digital menu screenshot",
			step2_title: "Staff Reacts in Real-Time",
			step2_text:
				"Every new order and table call arrives as a live alert on the waiter's dashboard. They confirm orders, resolve requests, and manage the floor — all from one screen.",
			step2_b1: "Live order & call alerts",
			step2_b2: "Table status at a glance",
			step2_b3: "One-tap order confirmation",
			step2_img_alt: "Waiter hub screenshot",
			step3_title: "Bills Closed Instantly",
			step3_text:
				"The cashier sees every order in a clear pipeline. Mark payments as cash or card, generate bills, and track daily revenue — without juggling paper or spreadsheets.",
			step3_b1: "Order-to-bill in one click",
			step3_b2: "Cash & card payment tracking",
			step3_b3: "Real-time revenue dashboard",
			step3_img_alt: "Cashier POS screenshot",
		},
		features: {
			heading_small: "Built for Real Restaurants",
			heading_main: "Everything You Need, Nothing You Don't",
			f1_title: "Cloud-Based",
			f1_text: "Access your dashboard from anywhere. No hardware, no installation. Just log in.",
			f2_title: "Multi-Language",
			f2_text: "Full Arabic and English support with seamless RTL switching for both staff and guests.",
			f3_title: "Real-Time Sync",
			f3_text: "Orders, table status, and calls update live across all screens. Zero refresh needed.",
			f4_title: "Secure Payments",
			f4_text: "Role-based access, encrypted data, and auditable payment records for every transaction.",
		},
		pricing: {
			heading_small: "Pricing",
			heading_main: "Simple, Transparent Pricing",
			subtitle: "No hidden fees. Start free, upgrade when you're ready.",
			p1_name: "Starter",
			p1_desc: "Always free. Perfect for trying Tawla with your restaurant.",
			p1_f1: "Digital menu (up to 30 items)",
			p1_f2: "Up to 5 tables",
			p1_f3: "1 Staff account",
			p1_f4: "Basic order management",
			p2_name: "Professional",
			p2_badge: "15-Day Money-Back Guarantee",
			p2_desc: "For growing restaurants that need the full toolkit.",
			p2_f1: "Unlimited menu items",
			p2_f2: "Up to 25 tables",
			p2_f3: "Up to 5 Staff accounts",
			p2_f4: "Waiter & Cashier dashboards",
			p2_f5: "Custom branding (no watermark)",
			p3_name: "Enterprise",
			p3_desc: "For chains and high-volume operations.",
			p3_f1: "Unlimited tables & staff",
			p3_f2: "Multi-location support",
			p3_f3: "Advanced analytics",
			p3_f4: "Priority support",
			p3_f5: "Custom integrations",
			btn_starter: "Start Free",
			btn_pro: "Get Started",
			btn_enterprise: "Contact Sales",
			custom_price: "Custom",
		},
		cta: {
			headline: "Ready to modernize your restaurant?",
			subtitle: "Join restaurants across the Gulf transforming their operations with Tawla.",
			placeholder: "Enter your email",
			btn: "Join Tawla",
		},
		footer: {
			privacy: "Privacy",
			terms: "Terms",
			rights: "© 2026 Tawla. All rights reserved.",
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
		hero: {
			headline_1: "المحرك الرقمي",
			headline_2: "للمطاعم الحديثة.",
			subtitle:
				"طاولة تربط ضيوفك، طاقم الخدمة، والكاشير في منظومة واحدة سلسة. طلبات QR، إدارة صالة لحظية، وفوترة فورية — من اليوم الأول.",
			cta_primary: "جرّب مجاناً",
			cta_secondary: "اكتشف كيف يعمل",
			dashboard_alt: "معاينة لوحة تحكم طاولة",
		},
		journey: {
			heading_small: "كيف يعمل",
			heading_main: "من الضيف إلى الفاتورة في ثلاث خطوات",
			tab1: "الضيف",
			tab2: "الويتر",
			tab3: "الكاشير",
			step1_title: "الضيوف يطلبون في ثوانٍ",
			step1_text:
				"يمسح الضيف رمز QR على طاولته ويتصفح قائمة رقمية أنيقة فوراً. يضيف الأصناف، يخصّص طلبه، ويرسله — بدون تطبيق، وبدون انتظار.",
			step1_b1: "قائمة QR فورية بدون تحميل",
			step1_b2: "منيو ثنائي اللغة (عربي وإنجليزي)",
			step1_b3: "طلب بضغطة واحدة مع المجموع الحي",
			step1_img_alt: "لقطة شاشة المنيو الرقمي",
			step2_title: "الطاقم يستجيب لحظياً",
			step2_text:
				"كل طلب جديد ونداء طاولة يصل كإشعار حي على لوحة الويتر. يؤكد الطلبات، يحل الطلبات، ويدير الصالة — كل ذلك من شاشة واحدة.",
			step2_b1: "تنبيهات حية للطلبات والنداءات",
			step2_b2: "حالة الطاولات بنظرة واحدة",
			step2_b3: "تأكيد الطلب بضغطة واحدة",
			step2_img_alt: "لقطة شاشة لوحة الويتر",
			step3_title: "الفواتير تُغلق فوراً",
			step3_text:
				"يرى الكاشير كل طلب في خط واضح. يسجّل الدفع نقداً أو بالبطاقة، يصدر الفاتورة، ويتابع إيرادات اليوم — بدون ورق أو جداول.",
			step3_b1: "من الطلب إلى الفاتورة بضغطة",
			step3_b2: "تتبع الدفع نقداً وبالبطاقة",
			step3_b3: "لوحة إيرادات لحظية",
			step3_img_alt: "لقطة شاشة الكاشير",
		},
		features: {
			heading_small: "مبني للمطاعم الحقيقية",
			heading_main: "كل ما تحتاجه، ولا شيء زائد",
			f1_title: "سحابي بالكامل",
			f1_text: "ادخل لوحتك من أي مكان. بدون أجهزة، بدون تثبيت. فقط سجّل دخولك.",
			f2_title: "متعدد اللغات",
			f2_text: "دعم كامل للعربية والإنجليزية مع تبديل RTL سلس للطاقم والضيوف.",
			f3_title: "مزامنة لحظية",
			f3_text: "الطلبات، حالة الطاولات، والنداءات تتحدث مباشرة على كل الشاشات.",
			f4_title: "مدفوعات آمنة",
			f4_text: "صلاحيات بحسب الدور، بيانات مشفرة، وسجلات دفع قابلة للمراجعة.",
		},
		pricing: {
			heading_small: "الباقات",
			heading_main: "تسعير بسيط وشفاف",
			subtitle: "بدون رسوم خفية. ابدأ مجاناً، ورقّي وقتما تحب.",
			p1_name: "البداية",
			p1_desc: "مجاني دائماً. مثالي لتجربة طاولة مع مطعمك.",
			p1_f1: "منيو رقمي (حتى 30 صنف)",
			p1_f2: "إدارة حتى 5 طاولات",
			p1_f3: "حساب موظف واحد",
			p1_f4: "إدارة الطلبات الأساسية",
			p2_name: "الاحترافية",
			p2_badge: "ضمان استرداد 15 يوماً",
			p2_desc: "للمطاعم النامية التي تحتاج الأدوات الكاملة.",
			p2_f1: "أصناف منيو غير محدودة",
			p2_f2: "إدارة حتى 25 طاولة",
			p2_f3: "حتى 5 حسابات موظفين",
			p2_f4: "لوحات الكاشير والويتر",
			p2_f5: "هوية بصرية مخصصة (بدون علامة طاولة)",
			p3_name: "الشركات",
			p3_desc: "للسلاسل والعمليات عالية الحجم.",
			p3_f1: "طاولات وموظفين بلا حدود",
			p3_f2: "دعم متعدد الفروع",
			p3_f3: "تحليلات متقدمة",
			p3_f4: "دعم أولوية",
			p3_f5: "تكاملات مخصصة",
			btn_starter: "ابدأ مجاناً",
			btn_pro: "ابدأ الآن",
			btn_enterprise: "تواصل مع المبيعات",
			custom_price: "مخصص",
		},
		cta: {
			headline: "جاهز لتحديث مطعمك رقمياً؟",
			subtitle: "انضم إلى مطاعم الخليج التي تدير عملياتها بذكاء مع طاولة.",
			placeholder: "أدخل بريدك الإلكتروني",
			btn: "انضم إلى طاولة",
		},
		footer: {
			privacy: "الخصوصية",
			terms: "الشروط",
			rights: "© 2026 طاولة. جميع الحقوق محفوظة.",
		},
	},
} as const;

type Translations = typeof translations.en;

interface LanguageContextType {
	lang: Language;
	setLang: (lang: Language) => void;
	t: (key: string) => string;
	isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function LanguageProvider({ children }: { children: React.ReactNode }) {
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
		<LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === "ar" }}>
			{children}
		</LanguageContext.Provider>
	);
}

function useTranslation() {
	const context = useContext(LanguageContext);
	if (!context) throw new Error("useTranslation must be used within LanguageProvider");
	return context;
}

/* ─── Animation Variants ─── */
const fadeInUp = {
	hidden: { opacity: 0, y: 32 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const },
	},
};

const stagger = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.12 } },
};

/* ─── Section Wrapper ─── */
function Section({
	children,
	id,
	className = "",
}: {
	children: React.ReactNode;
	id?: string;
	className?: string;
}) {
	return (
		<section id={id} className={`py-24 lg:py-32 ${className}`}>
			<div className="max-w-[1200px] mx-auto px-6 lg:px-8">{children}</div>
		</section>
	);
}

/* ─── Scroll-triggered reveal ─── */
function Reveal({
	children,
	className = "",
	delay = 0,
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-80px" });
	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={inView ? "visible" : "hidden"}
			variants={fadeInUp}
			transition={{ delay }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

/* ════════════════════════════════════════════════════
   LANGUAGE TOGGLE
   ════════════════════════════════════════════════════ */
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

/* ════════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════════ */
function Header() {
	const { t, lang } = useTranslation();
	const [scrolled, setScrolled] = useState(false);
	const [open, setOpen] = useState(false);

	const { scrollY } = useScroll();
	useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 50));

	const links = [
		{ label: t("nav.journey"), href: "#journey" },
		{ label: t("nav.features"), href: "#features" },
		{ label: t("nav.pricing"), href: "#pricing" },
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
					href="#"
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

/* ════════════════════════════════════════════════════
   HERO — Minimalist
   ════════════════════════════════════════════════════ */
function HeroSection() {
	const { t, lang, isRTL } = useTranslation();

	return (
		<section className="relative min-h-[90vh] flex items-center pt-28 pb-16 overflow-hidden bg-[#f1f7fc]">
			{/* Subtle radial glow */}
			<div className="absolute top-[15%] start-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-tawla-ice/10 blur-[160px] pointer-events-none" />

			<div className="relative max-w-[1200px] mx-auto px-6 lg:px-8 w-full">
				{/* Copy — centered */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
					className="text-center max-w-[760px] mx-auto mb-14"
				>
					<h1 className={`text-[40px] md:text-[56px] lg:text-[68px] leading-[1.06] font-bold text-tawla-ink tracking-tight mb-6 ${isRTL ? "font-[family-name:var(--font-din-next)]" : "font-sans"}`}>
						{t("hero.headline_1")}{" "}
						<span className="text-tawla-deep">{t("hero.headline_2")}</span>
					</h1>

					<p className={`text-lg md:text-xl text-tawla-body-blue leading-relaxed max-w-[600px] mx-auto mb-10 ${isRTL ? "font-[family-name:var(--font-din-next)]" : ""}`}>
						{t("hero.subtitle")}
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<a
							href="/register"
							className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-tawla-deep text-white font-semibold text-base
								hover:bg-tawla-dark hover:scale-[1.03] active:scale-[0.98] transition-all duration-300
								shadow-[0_8px_24px_rgba(15,76,117,0.3)]"
						>
							{t("hero.cta_primary")}
						</a>
						<a
							href="#journey"
							className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-tawla-deep/15
								text-tawla-deep font-semibold text-base hover:border-tawla-deep/30 hover:bg-white transition-all duration-300"
						>
							{t("hero.cta_secondary")}
							<ArrowRight size={18} className="rtl:-scale-x-100" />
						</a>
					</div>
				</motion.div>

				{/* Dashboard preview placeholder */}
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
					className="relative max-w-[960px] mx-auto"
				>
					<div className="relative rounded-2xl lg:rounded-3xl overflow-hidden border border-tawla-deep/8 shadow-[0_24px_80px_rgba(15,76,117,0.12)] bg-white">
						<Image
							src="/img/dashboard.png"
							alt={t("hero.dashboard_alt")}
							width={1920}
							height={1080}
							className="w-full h-auto object-cover"
							priority
						/>
					</div>
					{/* Glow under the card */}
					<div className="absolute -bottom-8 inset-x-[10%] h-16 bg-tawla-deep/5 blur-[40px] rounded-full pointer-events-none" />
				</motion.div>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════════════
   JOURNEY — Interactive Card Tabs with AnimatePresence
   ════════════════════════════════════════════════════ */
const journeySteps = [
	{
		id: "guest",
		tabKey: "journey.tab1",
		titleKey: "journey.step1_title",
		textKey: "journey.step1_text",
		bullets: ["journey.step1_b1", "journey.step1_b2", "journey.step1_b3"],
		imgAltKey: "journey.step1_img_alt",
		image: "/img/menu.png",
		icon: BookOpen,
		accent: "from-tawla-ice to-tawla-ice-light",
		iconColor: "text-tawla-deep",
		stepLabel: "01",
	},
	{
		id: "waiter",
		tabKey: "journey.tab2",
		titleKey: "journey.step2_title",
		textKey: "journey.step2_text",
		bullets: ["journey.step2_b1", "journey.step2_b2", "journey.step2_b3"],
		imgAltKey: "journey.step2_img_alt",
		image: "/img/waiter.png",
		icon: LayoutDashboard,
		accent: "from-tawla-deep/10 to-tawla-sky/10",
		iconColor: "text-tawla-sky",
		stepLabel: "02",
	},
	{
		id: "cashier",
		tabKey: "journey.tab3",
		titleKey: "journey.step3_title",
		textKey: "journey.step3_text",
		bullets: ["journey.step3_b1", "journey.step3_b2", "journey.step3_b3"],
		imgAltKey: "journey.step3_img_alt",
		image: "/img/casher.png",
		icon: CreditCard,
		accent: "from-tawla-sky/10 to-tawla-ice/30",
		iconColor: "text-tawla-deep",
		stepLabel: "03",
	},
] as const;

function JourneySection() {
	const { t, isRTL, lang } = useTranslation();
	const [active, setActive] = useState(0);
	const step = journeySteps[active];
	const Icon = step.icon;

	return (
		<Section id="journey" className="bg-white">
			<Reveal className="text-center mb-16">
				<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.2em] uppercase block mb-4">
					{t("journey.heading_small")}
				</span>
				<h2 className={`text-[34px] md:text-[44px] font-bold text-tawla-ink tracking-tight ${isRTL ? "font-[family-name:var(--font-din-next)]" : "font-sans"}`}>
					{t("journey.heading_main")}
				</h2>
			</Reveal>

			{/* Tabs */}
			<div className="flex justify-center mb-12">
				<div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-tawla-ghost border border-tawla-deep/5">
					{journeySteps.map((s, idx) => {
						const isActive = idx === active;
						const TabIcon = s.icon;
						return (
							<button
								key={s.id}
								onClick={() => setActive(idx)}
								className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
									isActive
										? "bg-white text-tawla-deep shadow-[0_2px_12px_rgba(15,76,117,0.1)]"
										: "text-tawla-muted hover:text-tawla-body-blue"
								}`}
							>
								<TabIcon size={16} />
								<span className="hidden sm:inline">{t(s.tabKey)}</span>
								<span className={`sm:hidden text-[10px] font-bold ${isActive ? "text-tawla-deep" : "text-tawla-muted"}`}>
									{s.stepLabel}
								</span>
							</button>
						);
					})}
				</div>
			</div>

			{/* Card */}
			<div className="max-w-[1040px] mx-auto">
				<AnimatePresence mode="wait">
					<motion.div
						key={step.id}
						layout
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.45, ease: [0.25, 0.4, 0.25, 1] }}
						className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center"
					>
						{/* Text side */}
						<div className={active === 1 ? "lg:order-2" : ""}>
							<div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${step.accent} mb-6`}>
								<Icon size={14} className={step.iconColor} />
								<span className="text-[11px] font-bold text-tawla-deep tracking-wider uppercase">
									{t(step.tabKey)}
								</span>
							</div>

							<h3 className={`text-[28px] md:text-[36px] font-bold text-tawla-ink tracking-tight mb-4 ${isRTL ? "font-[family-name:var(--font-din-next)]" : "font-sans"}`}>
								{t(step.titleKey)}
							</h3>

							<p className={`text-base text-tawla-body-blue leading-relaxed mb-8 ${isRTL ? "font-[family-name:var(--font-din-next)]" : ""}`}>
								{t(step.textKey)}
							</p>

							<ul className="space-y-3.5">
								{step.bullets.map((bKey) => (
									<li key={bKey} className="flex items-center gap-3 text-sm text-tawla-body-blue">
										<div className="w-5 h-5 rounded-full bg-tawla-ice/60 flex items-center justify-center shrink-0">
											<Check className="w-3 h-3 text-tawla-deep" />
										</div>
										{t(bKey)}
									</li>
								))}
							</ul>
						</div>

						{/* Screenshot — mobile phone frame or landscape desktop frame */}
						<div className={`flex justify-center ${active === 1 ? "lg:order-1" : ""}`}>
							{(active === 0 || active === 1) ? (
								/* Portrait mobile phone mockup */
								<div className="relative max-w-[280px] sm:max-w-[320px] w-full aspect-[9/19.5] mx-auto rounded-[2.5rem] border-[8px] border-white shadow-2xl overflow-hidden">
									<Image
										src={step.image}
										alt={t(step.imgAltKey)}
										fill
										priority
										sizes="(max-width: 640px) 100vw, 320px"
										className="object-cover object-top"
									/>
								</div>
							) : (
								/* Landscape desktop / cashier POS frame */
								<div className="relative w-full aspect-video rounded-xl border-4 border-white shadow-xl overflow-hidden">
									<Image
										src={step.image}
										alt={t(step.imgAltKey)}
										fill
										priority
										sizes="(max-width: 1024px) 100vw, 500px"
										className="object-cover object-top"
									/>
								</div>
							)}
						</div>
					</motion.div>
				</AnimatePresence>
			</div>
		</Section>
	);
}

/* ════════════════════════════════════════════════════
   FEATURES GRID
   ════════════════════════════════════════════════════ */
function FeaturesSection() {
	const { t, isRTL } = useTranslation();
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-80px" });

	const features = [
		{ icon: Cloud, titleKey: "features.f1_title", textKey: "features.f1_text" },
		{ icon: Globe, titleKey: "features.f2_title", textKey: "features.f2_text" },
		{ icon: Zap, titleKey: "features.f3_title", textKey: "features.f3_text" },
		{ icon: ShieldCheck, titleKey: "features.f4_title", textKey: "features.f4_text" },
	];

	return (
		<Section id="features" className="bg-[#f1f7fc]">
			<Reveal className="text-center mb-16">
				<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.2em] uppercase block mb-4">
					{t("features.heading_small")}
				</span>
				<h2 className={`text-[34px] md:text-[44px] font-bold text-tawla-ink tracking-tight ${isRTL ? "font-[family-name:var(--font-din-next)]" : "font-sans"}`}>
					{t("features.heading_main")}
				</h2>
			</Reveal>

			<motion.div
				ref={ref}
				initial="hidden"
				animate={inView ? "visible" : "hidden"}
				variants={stagger}
				className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
			>
				{features.map((f) => (
					<motion.div
						key={f.titleKey}
						variants={fadeInUp}
						className="group bg-white rounded-2xl p-7 border border-tawla-deep/5
							hover:border-tawla-sky/20 hover:shadow-[0_12px_40px_rgba(15,76,117,0.06)] transition-all duration-500"
					>
						<div className="w-11 h-11 rounded-xl bg-tawla-ice/40 flex items-center justify-center mb-5 group-hover:bg-tawla-ice group-hover:scale-110 transition-all duration-500">
							<f.icon className="w-5 h-5 text-tawla-sky" />
						</div>
						<h3 className={`text-base font-bold text-tawla-ink mb-2 ${isRTL ? "font-[family-name:var(--font-din-next)]" : ""}`}>
							{t(f.titleKey)}
						</h3>
						<p className="text-sm leading-relaxed text-tawla-body-blue">
							{t(f.textKey)}
						</p>
					</motion.div>
				))}
			</motion.div>
		</Section>
	);
}

/* ════════════════════════════════════════════════════
   PRICING
   ════════════════════════════════════════════════════ */
function PricingSection() {
	const { t, isRTL } = useTranslation();
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-80px" });

	const plans = [
		{
			id: "starter",
			name: t("pricing.p1_name"),
			price: "$0",
			period: "/mo",
			desc: t("pricing.p1_desc"),
			features: [t("pricing.p1_f1"), t("pricing.p1_f2"), t("pricing.p1_f3"), t("pricing.p1_f4")],
			btn_text: t("pricing.btn_starter"),
			highlighted: false,
		},
		{
			id: "pro",
			name: t("pricing.p2_name"),
			price: "$49",
			period: "/mo",
			desc: t("pricing.p2_desc"),
			features: [t("pricing.p2_f1"), t("pricing.p2_f2"), t("pricing.p2_f3"), t("pricing.p2_f4"), t("pricing.p2_f5")],
			btn_text: t("pricing.btn_pro"),
			highlighted: true,
			badge: t("pricing.p2_badge"),
		},
		{
			id: "enterprise",
			name: t("pricing.p3_name"),
			price: t("pricing.custom_price"),
			period: "",
			desc: t("pricing.p3_desc"),
			features: [t("pricing.p3_f1"), t("pricing.p3_f2"), t("pricing.p3_f3"), t("pricing.p3_f4"), t("pricing.p3_f5")],
			btn_text: t("pricing.btn_enterprise"),
			highlighted: false,
		},
	];

	return (
		<Section id="pricing" className="bg-white">
			<Reveal className="text-center mb-16">
				<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.2em] uppercase block mb-4">
					{t("pricing.heading_small")}
				</span>
				<h2 className={`text-[34px] md:text-[44px] font-bold text-tawla-ink tracking-tight ${isRTL ? "font-[family-name:var(--font-din-next)]" : "font-sans"}`}>
					{t("pricing.heading_main")}
				</h2>
				<p className="mt-4 text-base text-tawla-body-blue max-w-md mx-auto">
					{t("pricing.subtitle")}
				</p>
			</Reveal>

			<motion.div
				ref={ref}
				initial="hidden"
				animate={inView ? "visible" : "hidden"}
				variants={stagger}
				className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-[960px] mx-auto"
			>
				{plans.map((p) => (
					<motion.div
						key={p.name}
						variants={fadeInUp}
						className={`relative rounded-2xl p-8 border transition-all duration-500 ${
							p.highlighted
								? "bg-white border-tawla-sky/40 shadow-[0_0_48px_rgba(50,130,184,0.1)]"
								: "bg-white border-tawla-deep/5 hover:border-tawla-sky/20 hover:shadow-[0_8px_32px_rgba(15,76,117,0.06)]"
						}`}
					>
						{p.highlighted && (
							<div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 px-4 py-1 rounded-full bg-tawla-sky text-white text-[10px] font-bold tracking-wider uppercase whitespace-nowrap">
								{p.badge}
							</div>
						)}
						<h3 className={`text-lg font-bold text-tawla-ink mb-1 ${isRTL ? "font-[family-name:var(--font-din-next)]" : ""}`}>
							{p.name}
						</h3>
						<div className="flex items-baseline gap-1 mb-3">
							<span className="text-[36px] font-bold text-tawla-ink">{p.price}</span>
							{p.period && <span className="text-sm text-tawla-muted">{p.period}</span>}
						</div>
						<p className="text-sm text-tawla-body-blue mb-6">{p.desc}</p>
						<ul className="space-y-3 mb-8">
							{p.features.map((f) => (
								<li key={f} className="flex items-center gap-2.5 text-sm text-tawla-body-blue">
									<Check className="w-4 h-4 text-tawla-sky shrink-0" />
									{f}
								</li>
							))}
						</ul>
						<a
							href={p.id === "enterprise" ? "#contact" : `/register${p.id === "starter" ? "" : `?plan=${p.id}`}`}
							className={`block text-center py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
								p.highlighted
									? "bg-tawla-deep text-white hover:bg-tawla-dark shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
									: "border-2 border-tawla-deep/15 text-tawla-deep hover:border-tawla-deep/30 hover:bg-tawla-ghost"
							}`}
						>
							{p.btn_text}
						</a>
					</motion.div>
				))}
			</motion.div>
		</Section>
	);
}

/* ════════════════════════════════════════════════════
   FINAL CTA
   ════════════════════════════════════════════════════ */
function CTASection() {
	const { t, isRTL } = useTranslation();
	return (
		<section id="contact" className="relative py-24 lg:py-32 bg-tawla-deep overflow-hidden">
			<div className="absolute top-0 end-0 w-[400px] h-[400px] rounded-full bg-tawla-sky/10 blur-[120px]" />
			<div className="absolute bottom-0 start-0 w-[300px] h-[300px] rounded-full bg-tawla-ice/5 blur-[100px]" />

			<Reveal className="relative max-w-[640px] mx-auto px-6 text-center">
				<h2 className={`text-[32px] md:text-[44px] font-bold text-white tracking-tight mb-6 ${isRTL ? "font-[family-name:var(--font-din-next)]" : "font-sans"}`}>
					{t("cta.headline")}
				</h2>
				<p className="text-base text-tawla-ice/80 mb-10">{t("cta.subtitle")}</p>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						toast.success("Thanks for joining! We'll be in touch soon.");
					}}
					className="flex flex-col sm:flex-row gap-3 max-w-[460px] mx-auto"
				>
					<input
						type="email"
						required
						placeholder={t("cta.placeholder")}
						className="flex-1 px-5 py-3.5 rounded-full bg-white text-tawla-ink placeholder:text-tawla-muted border border-white/20
							text-sm focus:outline-none focus:ring-2 focus:ring-tawla-sky/50 transition"
					/>
					<button
						type="submit"
						className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-tawla-sky text-white font-semibold text-sm
							hover:bg-tawla-sky/90 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shrink-0"
					>
						{t("cta.btn")} <Send size={15} className="rtl:-scale-x-100" />
					</button>
				</form>
			</Reveal>
		</section>
	);
}

/* ════════════════════════════════════════════════════
   FOOTER
   ════════════════════════════════════════════════════ */
function Footer() {
	const { t } = useTranslation();
	return (
		<footer className="bg-[#071A2E] py-12">
			<div className="max-w-[1200px] mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
				<LogoBrand variant="footer" href="#" />
				<nav className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
					{[
						{ label: t("nav.journey"), href: "#journey" },
						{ label: t("nav.features"), href: "#features" },
						{ label: t("nav.pricing"), href: "#pricing" },
						{ label: t("nav.blog"), href: "/blog" },
					].map((l) => (
						<a
							key={l.label}
							href={l.href}
							className="hover:text-white/80 transition-colors"
						>
							{l.label}
						</a>
					))}
					<a
						href="#"
						onClick={(e) => { e.preventDefault(); toast.info("Privacy Policy coming soon"); }}
						className="hover:text-white/80 transition-colors"
					>
						{t("footer.privacy")}
					</a>
					<a
						href="#"
						onClick={(e) => { e.preventDefault(); toast.info("Terms of Service coming soon"); }}
						className="hover:text-white/80 transition-colors"
					>
						{t("footer.terms")}
					</a>
				</nav>
				<p className="text-xs text-white/30">{t("footer.rights")}</p>
				<div className="flex items-center gap-1.5 text-[11px] text-white/40">
					<span>Powered by</span>
					<a
						href="https://tawla.link"
						className="font-bold text-tawla-ice hover:text-tawla-sky transition-colors"
					>
						Tawla
					</a>
				</div>
			</div>
		</footer>
	);
}

/* ════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════ */
function LandingContentInner() {
	const { lang } = useTranslation();

	return (
		<div
			suppressHydrationWarning
			className="bg-[#f1f7fc] font-sans text-tawla-body-blue overflow-x-hidden"
			dir={lang === "ar" ? "rtl" : "ltr"}
		>
			<Header />
			<HeroSection />
			<JourneySection />
			<FeaturesSection />
			<PricingSection />
			<CTASection />
			<Footer />
		</div>
	);
}

export default function LandingContent() {
	return (
		<LanguageProvider>
			<LandingContentInner />
		</LanguageProvider>
	);
}
