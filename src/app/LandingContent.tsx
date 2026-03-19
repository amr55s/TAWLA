"use client";

import { useGSAP } from "@gsap/react";
import {
	motion,
	useInView,
	useMotionValueEvent,
	useScroll,
} from "framer-motion";
import gsap from "gsap";
import {
	ArrowRight,
	BookOpen,
	BrainCircuit,
	Check,
	CreditCard,
	LayoutDashboard,
	Menu,
	Send,
	ShieldCheck,
	Sparkles,
	Utensils,
	X,
	Zap,
} from "lucide-react";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import type React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

const ibmArabic = IBM_Plex_Sans_Arabic({
	subsets: ["arabic"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

/* ════════════════════════════════════════════════════
   TRANSLATION CONTEXT & DICTIONARY
   ════════════════════════════════════════════════════ */
type Language = "en" | "ar";

const translations = {
	en: {
		nav: {
			features: "Features",
			ecosystem: "Ecosystem",
			pricing: "Pricing",
			request_demo: "Try Beta Free",
			language: "Language",
		},
		hero: {
			badge: "Powered by Agentic Intelligence",
			headline_1: "Simplify Your Restaurant's Universe with",
			headline_2: "Autonomous Intelligence.",
			subtitle:
				"Tawla is the fluid ecosystem that seamlessly connects your guests, waiters, and kitchen in real-time. Built with advanced agentic logic to optimize table turns and elevate the dining experience.",
			cta_primary: "Try Beta Free",
			cta_secondary: "See How It Works",
			card_tables: "Live Tables",
			card_occupied: "occupied",
			card_new_order: "New Order",
			card_grilled_salmon: "Grilled Salmon",
			card_caesar_salad: "Caesar Salad",
			card_table: "Table",
			card_processing: "Processing",
			card_revenue: "Revenue",
		},
		features: {
			heading_small: "Why Tawla?",
			heading_main: "Intelligence Built Into Every Layer",
			f1_title: "Autonomous Optimization",
			f1_text:
				"Agents dynamically adjust workflows based on real-time data, ensuring every table turn is optimized and every order flows seamlessly from guest to kitchen.",
			f2_title: "Proactive Issue Resolution",
			f2_text:
				"Anticipate and resolve bottlenecks before they impact service. Smart alerts and automated escalation keep your operation running flawlessly.",
			f3_title: "Waiter Intelligence",
			f3_text:
				"Empower your staff with real-time insights. Optimized assignments, live status tracking, and instant alerts accelerate service quality.",
		},
		ecosystem: {
			heading_small: "The Ecosystem",
			heading_main: "Three Pillars, One Seamless Experience",
			e1_subtitle: "Guest Experience",
			e1_title: "The Digital Menu",
			e1_text:
				"A beautiful, intuitive digital menu that delights guests. Real-time availability, dietary filters, and seamless ordering — all from their device.",
			e1_b1: "Real-time item availability",
			e1_b2: "Dietary filters & allergen info",
			e1_b3: "One-tap ordering",
			e1_mockup_btn: "Add to Order",
			e2_subtitle: "Floor Operations",
			e2_title: "The Waiter Hub",
			e2_text:
				"A real-time command center for your floor staff. Track table status, manage assignments, and respond to guest requests instantly.",
			e2_b1: "Live table status grid",
			e2_b2: "Instant guest call alerts",
			e2_b3: "Smart task prioritization",
			e2_mockup_title: "Floor View",
			e2_mockup_msg: "Guest Request",
			e3_subtitle: "Billing & Insights",
			e3_title: "The Cashier POS",
			e3_text:
				"Streamlined billing and powerful insights. Process payments, view order history, and generate reports — all in one unified interface.",
			e3_b1: "One-click bill generation",
			e3_b2: "Multi-payment support",
			e3_b3: "Real-time revenue analytics",
			e3_mockup_title: "Bill #0042",
			e3_mockup_status: "Open",
			e3_mockup_item1: "Sparkling Water",
			e3_mockup_total: "Total",
			e3_mockup_btn: "Print & Close",
		},
		pricing: {
			heading_small: "Pricing",
			heading_main: "Simple, Transparent Pricing",
			subtitle: "No hidden fees. Start free, upgrade when you're ready.",
			p1_name: "Starter",
			p1_desc:
				"Perfect for small restaurants getting started with digital operations.",
			p1_f1: "Up to 15 tables",
			p1_f2: "Digital Menu",
			p1_f3: "Basic analytics",
			p1_f4: "Email support",
			p2_name: "Professional",
			p2_badge: "Best Value",
			p2_desc: "For growing restaurants that need the full ecosystem.",
			p2_f1: "Unlimited tables",
			p2_f2: "Full Ecosystem",
			p2_f3: "Advanced analytics",
			p2_f4: "Waiter & Cashier Hub",
			p2_f5: "Priority support",
			p2_f6: "Custom branding",
			p3_name: "Enterprise",
			p3_desc: "For restaurant groups and chains with complex requirements.",
			p3_f1: "Everything in Professional",
			p3_f2: "Multi-location support",
			p3_f3: "Dedicated account manager",
			p3_f4: "Custom integrations",
			p3_f5: "SLA guarantee",
			btn_start: "Get Started",
			btn_contact: "Contact Sales",
			custom_price: "Custom",
		},
		cta: {
			headline: "Ready to elevate your restaurant's intelligence?",
			subtitle:
				"Join hundreds of restaurants transforming their operations with Tawla.",
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
			features: "المميزات",
			ecosystem: "النظام البيئي",
			pricing: "الباقات",
			request_demo: "جرب النسخة التجريبية مجاناً",
			language: "اللغة",
		},
		hero: {
			badge: "مدعوم بالذكاء الاصطناعي المستقل",
			headline_1: "ارتقِ بعالم مطعمك من خلال",
			headline_2: "الذكاء المستقل.",
			subtitle:
				"طاولة هي البيئة الرقمية المتكاملة التي تربط ضيوفك، طاقم الخدمة، والمطبخ في لحظة واحدة. مصممة بذكاء وكلاء مستقلين لتحسين سرعة الخدمة والارتقاء بتجربة الضيافة.",
			cta_primary: "جرب البيتا مجاناً",
			cta_secondary: "اكتشف كيف يعمل",
			card_tables: "الطاولات النشطة",
			card_occupied: "مشغولة",
			card_new_order: "طلب جديد",
			card_grilled_salmon: "سلمون مشوي",
			card_caesar_salad: "سلطة سيزر",
			card_table: "طاولة",
			card_processing: "قيد التجهيز",
			card_revenue: "الإيرادات",
		},
		features: {
			heading_small: "لماذا طاولة؟",
			heading_main: "ذكاء مدمج في كل تفصيلة",
			f1_title: "تحسين ذاتي ومستقل",
			f1_text:
				"يقوم الذكاء الاصطناعي بتعديل سير العمل بناءً على البيانات اللحظية، مما يضمن الاستفادة القصوى من كل طاولة وتدفق الطلبات بسلاسة.",
			f2_title: "حلول استباقية للمشكلات",
			f2_text:
				"توقع وحل العقبات قبل أن تؤثر على الخدمة. التنبيهات الذكية والتصعيد التلقائي يحافظان على سير عملك بشكل مثالي.",
			f3_title: "ذكاء طاقم الخدمة",
			f3_text:
				"مكن طاقمك بمعلومات لحظية. التعيينات المحسنة، وتتبع الحالة المباشر، والتنبيهات الفورية تسرّع من جودة الخدمة.",
		},
		ecosystem: {
			heading_small: "النظام البيئي",
			heading_main: "ثلاثة أعمدة رئيسية، لتجربة واحدة سلسة",
			e1_subtitle: "تجربة الضيف",
			e1_title: "المنيو الرقمي",
			e1_text:
				"قائمة طعام رقمية تفاعلية تبهر ضيوفك. توافر الأصناف لحظياً، فلاتر للأنظمة الغذائية، وطلب مباشر وسلس — كل ذلك من هواتفهم.",
			e1_b1: "توافر الأصناف لحظياً",
			e1_b2: "فلاتر الحساسية والأنظمة الغذائية",
			e1_b3: "الطلب بضغطة واحدة",
			e1_mockup_btn: "أضف للطلب",
			e2_subtitle: "إدارة الصالة",
			e2_title: "لوحة تحكم طاقم الخدمة",
			e2_text:
				"مركز قيادة لحظي لطاقم الصالة. تابع حالة الطاولات، أدر المهام، واستجب لطلبات الضيوف في ثوانٍ.",
			e2_b1: "شبكة حية لحالة الطاولات",
			e2_b2: "تنبيهات فورية لطلبات الضيوف",
			e2_b3: "تحديد ذكي لأولويات المهام",
			e2_mockup_title: "عرض الصالة",
			e2_mockup_msg: "طلب من الضيف",
			e3_subtitle: "الفواتير والتحليلات",
			e3_title: "نقطة بيع الكاشير",
			e3_text:
				"فوترة مبسطة وتحليلات قوية. قم بمعالجة المدفوعات، عرض سجل الطلبات، وإصدار التقارير — كل ذلك في واجهة واحدة موحدة.",
			e3_b1: "إصدار الفاتورة بضغطة واحدة",
			e3_b2: "دعم طرق دفع متعددة",
			e3_b3: "تحليلات لحظية للإيرادات",
			e3_mockup_title: "فاتورة #0042",
			e3_mockup_status: "مفتوحة",
			e3_mockup_item1: "مياه غازية",
			e3_mockup_total: "المجموع",
			e3_mockup_btn: "طباعة وإغلاق",
		},
		pricing: {
			heading_small: "الباقات",
			heading_main: "تسعير بسيط وشفاف",
			subtitle: "بدون رسوم خفية. ابدأ مجاناً، وقم بالترقية عندما تكون مستعداً.",
			p1_name: "البداية",
			p1_desc: "مثالي للمطاعم الصغيرة التي تبدأ رحلتها الرقمية.",
			p1_f1: "حتى 15 طاولة",
			p1_f2: "منيو رقمي",
			p1_f3: "تحليلات أساسية",
			p1_f4: "دعم عبر البريد",
			p2_name: "الاحترافية",
			p2_badge: "القيمة الأفضل",
			p2_desc: "للمطاعم النامية التي تحتاج النظام البيئي الكامل.",
			p2_f1: "طاولات غير محدودة",
			p2_f2: "النظام البيئي الكامل",
			p2_f3: "تحليلات متقدمة",
			p2_f4: "لوحة تحكم طاقم الخدمة والكاشير",
			p2_f5: "دعم ذو أولوية",
			p2_f6: "هوية بصرية مخصصة",
			p3_name: "الشركات",
			p3_desc: "لمجموعات المطاعم والسلاسل ذات المتطلبات المعقدة.",
			p3_f1: "كل ما سبق في الاحترافية",
			p3_f2: "دعم فروع متعددة",
			p3_f3: "مدير حساب مخصص",
			p3_f4: "ربط برمجي مخصص (API)",
			p3_f5: "ضمان مستوى الخدمة (SLA)",
			btn_start: "ابدأ الآن",
			btn_contact: "تواصل مع المبيعات",
			custom_price: "مخصص",
		},
		cta: {
			headline: "هل أنت مستعد للارتقاء بذكاء مطعمك؟",
			subtitle: "انضم إلى مئات المطاعم التي تدير عملياتها بذكاء مع طاولة.",
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
		<LanguageContext.Provider value={{ lang, setLang, t }}>
			{children}
		</LanguageContext.Provider>
	);
}

function useTranslation() {
	const context = useContext(LanguageContext);
	if (!context)
		throw new Error("useTranslation must be used within LanguageProvider");
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
	visible: { transition: { staggerChildren: 0.15 } },
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
			<div className="max-w-[1240px] mx-auto px-6 lg:px-8">{children}</div>
		</section>
	);
}

/* ─── Animated Block (scroll-triggered) ─── */
function Reveal({
	children,
	className = "",
	variants = fadeInUp,
	delay = 0,
}: {
	children: React.ReactNode;
	className?: string;
	variants?: typeof fadeInUp;
	delay?: number;
}) {
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-80px" });
	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={inView ? "visible" : "hidden"}
			variants={variants}
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
		{ label: t("nav.features"), href: "#features" },
		{ label: t("nav.ecosystem"), href: "#ecosystem" },
		{ label: t("nav.pricing"), href: "#pricing" },
	];

	return (
		<header className="fixed top-0 inset-x-0 z-50 flex justify-center transition-all duration-500 px-4 pt-0">
			<div
				className={`flex items-center justify-between h-[72px] transition-all duration-700 ease-[cubic-bezier(0.25,0.4,0.25,1)] ${
					scrolled
						? "max-w-4xl w-full mt-3 px-6 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-[0_8px_32px_rgba(15,76,117,0.08)]"
						: "max-w-[1240px] w-full px-6 lg:px-8 bg-transparent border border-transparent"
				}`}
			>
				{/* Logo — remains visible, scales down */}
				<a
					href="#"
					className={`font-display font-bold text-tawla-deep tracking-tight select-none transition-all duration-500 ${
						scrolled ? "text-[22px]" : "text-[26px]"
					}`}
				>
					Tawla
				</a>

				{/* Desktop nav */}
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

				{/* Right cluster: lang toggle + CTA */}
				<div className="hidden md:flex items-center gap-4">
					<LangToggle compact={scrolled} />

					<div className="flex items-center gap-2 lg:gap-3">
						<a
							href="/login"
							className="text-sm font-medium text-tawla-body-blue hover:text-tawla-deep transition-colors whitespace-nowrap"
						>
							Sign In
						</a>
						{/* CTA — visible, scales down padding/text */}
						<a
							href="/register"
							className={`inline-flex items-center justify-center rounded-full bg-tawla-deep text-white font-semibold
                         hover:bg-tawla-dark hover:scale-[1.03] active:scale-[0.98] transition-all duration-500
                         shadow-[0_4px_14px_rgba(15,76,117,0.25)] whitespace-nowrap ${
														scrolled
															? "px-4 py-2 text-xs"
															: "px-5 py-2.5 text-sm"
													}`}
						>
							{t("nav.request_demo")}
						</a>
					</div>
				</div>

				{/* Mobile toggle */}
				<button
					onClick={() => setOpen(!open)}
					className="md:hidden p-2 text-tawla-deep"
					aria-label="Toggle menu"
				>
					{open ? <X size={24} /> : <Menu size={24} />}
				</button>
			</div>

			{/* Mobile drawer */}
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
						<span className="text-xs text-tawla-muted font-medium">
							{t("nav.language")}
						</span>
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
   HERO SECTION (with GSAP parallax + interactive cards)
   ════════════════════════════════════════════════════ */
function HeroSection() {
	const { t, lang } = useTranslation();
	const [occupiedTables, setOccupiedTables] = useState<Set<number>>(
		() => new Set([1, 3, 6, 7]),
	);

	const heroRef = useRef<HTMLElement>(null);
	const cardsContainerRef = useRef<HTMLDivElement>(null);

	const toggleTable = useCallback((tableNum: number) => {
		setOccupiedTables((prev) => {
			const next = new Set(prev);
			if (next.has(tableNum)) next.delete(tableNum);
			else next.add(tableNum);
			return next;
		});
	}, []);

	const occupiedCount = occupiedTables.size;
	const occupancyPercent = Math.round((occupiedCount / 8) * 100);

	/* ── GSAP: Intro animation + mouse parallax ── */
	useGSAP(
		() => {
			if (!cardsContainerRef.current || !heroRef.current) return;

			const prefersReducedMotion = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;

			const cards =
				cardsContainerRef.current.querySelectorAll<HTMLElement>(
					"[data-hero-card]",
				);
			if (!cards.length) return;

			if (prefersReducedMotion) {
				gsap.set(cards, { opacity: 1, y: 0 });
				return;
			}

			/* Intro: staggered float-up with spring */
			gsap.from(cards, {
				y: 60,
				opacity: 0,
				duration: 1,
				stagger: 0.2,
				ease: "back.out(1.4)",
				delay: 0.5,
			});

			/* Mouse parallax */
			const depthFactors = [
				{ x: -15, y: -10 },
				{ x: 20, y: 15 },
				{ x: -10, y: 12 },
			];

			const onMouseMove = (e: MouseEvent) => {
				const rect = heroRef.current!.getBoundingClientRect();
				const nx = (e.clientX - rect.left) / rect.width - 0.5;
				const ny = (e.clientY - rect.top) / rect.height - 0.5;

				cards.forEach((card, i) => {
					const factor = depthFactors[i] || depthFactors[0];
					gsap.to(card, {
						x: nx * factor.x,
						y: ny * factor.y,
						duration: 0.6,
						ease: "power2.out",
						overwrite: "auto",
					});
				});
			};

			const onMouseLeave = () => {
				cards.forEach((card) => {
					gsap.to(card, {
						x: 0,
						y: 0,
						duration: 0.8,
						ease: "elastic.out(1, 0.5)",
						overwrite: "auto",
					});
				});
			};

			const hero = heroRef.current!;
			hero.addEventListener("mousemove", onMouseMove);
			hero.addEventListener("mouseleave", onMouseLeave);

			return () => {
				hero.removeEventListener("mousemove", onMouseMove);
				hero.removeEventListener("mouseleave", onMouseLeave);
			};
		},
		{ scope: heroRef },
	);

	return (
		<section
			ref={heroRef}
			className="relative min-h-screen flex items-center pt-20 pb-12 lg:pb-0 overflow-hidden"
		>
			{/* BG */}
			<div className="absolute inset-0 bg-gradient-to-br from-white via-white to-tawla-ghost" />
			<div className="absolute top-[20%] end-[20%] w-[500px] h-[500px] rounded-full bg-tawla-ice/15 blur-[120px]" />
			<div className="absolute bottom-[25%] start-[30%] w-[350px] h-[350px] rounded-full bg-tawla-sky/8 blur-[100px]" />

			<div className="relative max-w-[1240px] mx-auto px-6 lg:px-8 w-full">
				<div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">
					{/* Copy */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
					>
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.5 }}
							className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-tawla-ice/30 border border-tawla-ice text-tawla-sky text-[11px] font-semibold tracking-widest uppercase mb-8"
						>
							<Sparkles size={13} />
							{t("hero.badge")}
						</motion.div>

						<h1 className="font-display text-[40px] md:text-[52px] lg:text-[60px] leading-[1.08] font-bold text-tawla-ink tracking-tight mb-6">
							{t("hero.headline_1")}{" "}
							<span className="text-tawla-deep block md:inline">
								{t("hero.headline_2")}
							</span>
						</h1>

						<p className="text-lg md:text-xl text-tawla-body-blue leading-relaxed max-w-[520px] mb-10">
							{t("hero.subtitle")}
						</p>

						<div className="flex flex-col sm:flex-row gap-4">
							<a
								href="/register"
								className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-tawla-deep text-white font-semibold
                           hover:bg-tawla-dark hover:scale-[1.03] active:scale-[0.98] transition-all duration-300
                           shadow-[0_8px_24px_rgba(15,76,117,0.3)]"
							>
								{t("hero.cta_primary")}
							</a>
							<a
								href="#ecosystem"
								className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border-2 border-tawla-deep/15
                           text-tawla-deep font-semibold hover:border-tawla-deep/30 hover:bg-tawla-ghost transition-all duration-300`}
							>
								{t("hero.cta_secondary")}{" "}
								<ArrowRight size={18} className="rtl:-scale-x-100" />
							</a>
						</div>
					</motion.div>

					{/* ── Interactive Hero Visual (GSAP-animated) ── */}
					<div
						ref={cardsContainerRef}
						className={`relative h-[380px] lg:h-[540px] select-none ${lang === "ar" ? "font-sans" : ""}`}
						dir="ltr"
					>
						{/* Ambient glow */}
						<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
							<div className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-tawla-ice/30 via-tawla-ice/10 to-transparent blur-[60px]" />
						</div>

						{/* Card 1 — Live Tables (interactive) */}
						<div
							data-hero-card
							className="absolute top-[8%] left-[4%] lg:left-[8%] will-change-transform z-20"
						>
							<div className="w-[210px] bg-white/90 backdrop-blur rounded-2xl border border-tawla-deep/8 shadow-[0_8px_32px_rgba(15,76,117,0.12)] p-5">
								<div className="flex items-center gap-2 mb-4">
									<div className="w-2 h-2 rounded-full bg-tawla-sky animate-pulse" />
									<span
										className={`text-[10px] font-semibold text-tawla-body-blue uppercase ${lang === "ar" ? "tracking-normal" : "tracking-widest"}`}
									>
										{t("hero.card_tables")}
									</span>
								</div>
								<div className="grid grid-cols-4 gap-1.5">
									{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
										const isOccupied = occupiedTables.has(i);
										return (
											<button
												key={i}
												onClick={() => toggleTable(i)}
												className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold
                                   cursor-pointer transition-all duration-300 hover:scale-[1.08] active:scale-95 ${
																			isOccupied
																				? "bg-tawla-deep text-white shadow-sm"
																				: "bg-tawla-ice/40 text-tawla-sky border border-tawla-ice/60 hover:bg-tawla-ice/70"
																		}`}
											>
												{i}
											</button>
										);
									})}
								</div>
								<div className="mt-3 flex justify-between items-center text-[10px]">
									<span className="text-tawla-muted">
										{occupiedCount} {t("hero.card_occupied")}
									</span>
									<span className="text-tawla-sky font-semibold">
										{occupancyPercent}%
									</span>
								</div>
							</div>
						</div>

						{/* Card 2 — New Order */}
						<div
							data-hero-card
							className="absolute top-[4%] right-[2%] lg:right-[6%] will-change-transform z-30"
						>
							<div className="w-[190px] bg-white/90 backdrop-blur rounded-2xl border border-tawla-deep/8 shadow-[0_8px_32px_rgba(15,76,117,0.12)] p-4">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-6 h-6 rounded-lg bg-tawla-ice flex items-center justify-center">
										<Utensils className="w-3 h-3 text-tawla-deep" />
									</div>
									<span className="text-[11px] font-bold text-tawla-ink">
										{t("hero.card_new_order")}
									</span>
									<span className="ml-auto text-[9px] text-tawla-muted">
										2m
									</span>
								</div>
								<div className="space-y-1.5 text-[11px]">
									<div className="flex justify-between">
										<span className="text-tawla-body-blue">
											{t("hero.card_grilled_salmon")}
										</span>
										<span className="text-tawla-muted">×2</span>
									</div>
									<div className="flex justify-between">
										<span className="text-tawla-body-blue">
											{t("hero.card_caesar_salad")}
										</span>
										<span className="text-tawla-muted">×1</span>
									</div>
								</div>
								<div className="mt-3 pt-2.5 border-t border-tawla-deep/5 flex justify-between items-center">
									<span className="text-[10px] font-bold text-tawla-deep">
										{t("hero.card_table")} 3
									</span>
									<span className="text-[9px] px-2 py-0.5 rounded-full bg-tawla-ice/50 text-tawla-sky font-semibold">
										{t("hero.card_processing")}
									</span>
								</div>
							</div>
						</div>

						{/* Card 3 — Revenue */}
						<div
							data-hero-card
							className="absolute bottom-[8%] left-[12%] lg:left-[18%] will-change-transform z-10"
						>
							<div className="w-[230px] bg-white/90 backdrop-blur rounded-2xl border border-tawla-deep/8 shadow-[0_8px_32px_rgba(15,76,117,0.12)] p-5">
								<div className="flex justify-between items-center mb-3">
									<span
										className={`text-[10px] font-semibold text-tawla-body-blue uppercase ${lang === "ar" ? "tracking-normal" : "tracking-widest"}`}
									>
										{t("hero.card_revenue")}
									</span>
									<span className="text-[10px] text-tawla-sky font-bold">
										+12%
									</span>
								</div>
								<div className="text-2xl font-bold text-tawla-ink mb-3">
									$2,847
								</div>
								<div className="flex items-end gap-1 h-[44px]">
									{[35, 55, 40, 70, 60, 85, 75].map((h, i) => (
										<div
											key={i}
											className="flex-1 rounded-sm bg-gradient-to-t from-tawla-deep to-tawla-sky"
											style={{ height: `${h}%` }}
										/>
									))}
								</div>
								<div className="mt-1.5 flex justify-between text-[8px] text-tawla-muted">
									{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
										<span key={i}>{d}</span>
									))}
								</div>
							</div>
						</div>

						{/* Decorative dots */}
						<div className="absolute top-[38%] start-[50%] w-2.5 h-2.5 rounded-full bg-tawla-ice tawla-pulse pointer-events-none" />
						<div
							className="absolute top-[58%] end-[32%] w-2 h-2 rounded-full bg-tawla-sky/30 tawla-pulse pointer-events-none"
							style={{ animationDelay: "1s" }}
						/>
						<div
							className="absolute bottom-[32%] end-[22%] w-2 h-2 rounded-full bg-tawla-ice/60 tawla-pulse pointer-events-none"
							style={{ animationDelay: "0.5s" }}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ════════════════════════════════════════════════════
   FEATURES  (Why Tawla?)
   ════════════════════════════════════════════════════ */
function FeaturesSection() {
	const { t } = useTranslation();
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-80px" });

	const skills = [
		{
			icon: Zap,
			title: t("features.f1_title"),
			text: t("features.f1_text"),
		},
		{
			icon: ShieldCheck,
			title: t("features.f2_title"),
			text: t("features.f2_text"),
		},
		{
			icon: BrainCircuit,
			title: t("features.f3_title"),
			text: t("features.f3_text"),
		},
	];

	return (
		<Section id="features" className="bg-tawla-ghost">
			<Reveal className="text-center mb-16">
				<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.2em] uppercase block mb-4">
					{t("features.heading_small")}
				</span>
				<h2 className="font-display text-[34px] md:text-[44px] font-bold text-tawla-ink tracking-tight">
					{t("features.heading_main")}
				</h2>
			</Reveal>

			<motion.div
				ref={ref}
				initial="hidden"
				animate={inView ? "visible" : "hidden"}
				variants={stagger}
				className="grid md:grid-cols-3 gap-6 lg:gap-8"
			>
				{skills.map((s) => (
					<motion.div
						key={s.title}
						variants={fadeInUp}
						className="group bg-white rounded-2xl p-8 border border-tawla-deep/5 hover:border-tawla-sky/20
                       hover:shadow-[0_8px_32px_rgba(15,76,117,0.08)] transition-all duration-500"
					>
						<div className="w-12 h-12 rounded-xl bg-tawla-ice/40 flex items-center justify-center mb-6 group-hover:bg-tawla-ice group-hover:scale-110 transition-all duration-500">
							<s.icon className="w-6 h-6 text-tawla-sky" />
						</div>
						<h3 className="text-lg font-bold text-tawla-ink mb-3">{s.title}</h3>
						<p className="text-sm leading-relaxed text-tawla-body-blue">
							{s.text}
						</p>
					</motion.div>
				))}
			</motion.div>
		</Section>
	);
}

/* ════════════════════════════════════════════════════
   ECOSYSTEM  (Interactive Previews)
   ════════════════════════════════════════════════════ */

/* Mini abstract mockups for ecosystem section */
function EcoMockup({ type }: { type: string }) {
	const { t } = useTranslation();
	if (type === "menu") {
		return (
			<div className="w-[260px] mx-auto bg-white rounded-[20px] border border-tawla-deep/8 shadow-[0_12px_40px_rgba(15,76,117,0.1)] p-5 overflow-hidden">
				<div className="flex items-center gap-2 mb-4">
					<div className="w-8 h-1 rounded bg-tawla-deep" />
					<div className="w-5 h-1 rounded bg-tawla-ice" />
					<div className="w-5 h-1 rounded bg-tawla-ice" />
				</div>
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="flex items-center gap-3 py-2.5 border-b border-tawla-deep/5 last:border-0"
					>
						<div className="w-10 h-10 rounded-xl bg-tawla-ice/50" />
						<div className="flex-1">
							<div
								className={`h-2 rounded bg-tawla-deep/15 mb-1.5`}
								style={{ width: `${60 + i * 10}%` }}
							/>
							<div className="h-1.5 w-[40%] rounded bg-tawla-ice" />
						</div>
						<div className="text-[10px] font-bold text-tawla-deep">$12</div>
					</div>
				))}
				<div className="mt-3 h-8 rounded-full bg-tawla-deep flex items-center justify-center">
					<span className="text-[10px] text-white font-semibold">
						{t("ecosystem.e1_mockup_btn")}
					</span>
				</div>
			</div>
		);
	}
	if (type === "waiter") {
		return (
			<div className="w-[300px] mx-auto bg-white rounded-[20px] border border-tawla-deep/8 shadow-[0_12px_40px_rgba(15,76,117,0.1)] p-5 overflow-hidden">
				<div className="flex justify-between items-center mb-4">
					<span className="text-[10px] font-bold text-tawla-ink tracking-widest uppercase">
						{t("ecosystem.e2_mockup_title")}
					</span>
					<div className="w-2 h-2 rounded-full bg-tawla-sky animate-pulse" />
				</div>
				<div className="grid grid-cols-4 gap-2">
					{[
						{ n: "T1", active: true },
						{ n: "T2", active: false },
						{ n: "T3", active: true },
						{ n: "T4", active: true },
						{ n: "T5", active: false },
						{ n: "T6", active: true },
						{ n: "T7", active: false },
						{ n: "T8", active: false },
					].map((t) => (
						<div
							key={t.n}
							className={`aspect-square rounded-xl flex items-center justify-center text-[9px] font-bold transition-colors ${
								t.active
									? "bg-tawla-deep text-white"
									: "bg-tawla-ice/40 text-tawla-sky border border-tawla-ice/60"
							}`}
						>
							{t.n}
						</div>
					))}
				</div>
				<div className="mt-3 p-2 rounded-lg bg-tawla-ice/30 flex items-center gap-2">
					<div className="w-1.5 h-1.5 rounded-full bg-tawla-sky animate-pulse shrink-0" />
					<span className="text-[9px] text-tawla-deep font-semibold">
						{t("hero.card_table")} 3 — {t("ecosystem.e2_mockup_msg")}
					</span>
				</div>
			</div>
		);
	}
	/* cashier */
	return (
		<div className="w-[280px] mx-auto bg-white rounded-[20px] border border-tawla-deep/8 shadow-[0_12px_40px_rgba(15,76,117,0.1)] p-5 overflow-hidden">
			<div className="flex justify-between items-center mb-4">
				<span className="text-[10px] font-bold text-tawla-ink tracking-widest uppercase">
					{t("ecosystem.e3_mockup_title")}
				</span>
				<span className="text-[9px] px-2 py-0.5 rounded-full bg-tawla-ice/50 text-tawla-sky font-semibold">
					{t("ecosystem.e3_mockup_status")}
				</span>
			</div>
			<div className="space-y-2 text-[11px]">
				<div className="flex justify-between">
					<span className="text-tawla-body-blue">
						{t("hero.card_grilled_salmon")} ×2
					</span>
					<span className="text-tawla-ink font-semibold">$38</span>
				</div>
				<div className="flex justify-between">
					<span className="text-tawla-body-blue">
						{t("hero.card_caesar_salad")} ×1
					</span>
					<span className="text-tawla-ink font-semibold">$12</span>
				</div>
				<div className="flex justify-between">
					<span className="text-tawla-body-blue">
						{t("ecosystem.e3_mockup_item1")} ×2
					</span>
					<span className="text-tawla-ink font-semibold">$8</span>
				</div>
			</div>
			<div className="mt-3 pt-3 border-t border-tawla-deep/5 flex justify-between text-sm">
				<span className="font-bold text-tawla-ink">
					{t("ecosystem.e3_mockup_total")}
				</span>
				<span className="font-bold text-tawla-deep">$58.00</span>
			</div>
			<div className="mt-3 h-8 rounded-full bg-tawla-deep flex items-center justify-center">
				<span className="text-[10px] text-white font-semibold">
					{t("ecosystem.e3_mockup_btn")}
				</span>
			</div>
		</div>
	);
}

function EcosystemSection() {
	const { t } = useTranslation();

	const ecosystem = [
		{
			label: "01",
			icon: BookOpen,
			title: t("ecosystem.e1_title"),
			subtitle: t("ecosystem.e1_subtitle"),
			text: t("ecosystem.e1_text"),
			bullets: [
				t("ecosystem.e1_b1"),
				t("ecosystem.e1_b2"),
				t("ecosystem.e1_b3"),
			],
			mockup: "menu",
		},
		{
			label: "02",
			icon: LayoutDashboard,
			title: t("ecosystem.e2_title"),
			subtitle: t("ecosystem.e2_subtitle"),
			text: t("ecosystem.e2_text"),
			bullets: [
				t("ecosystem.e2_b1"),
				t("ecosystem.e2_b2"),
				t("ecosystem.e2_b3"),
			],
			mockup: "waiter",
		},
		{
			label: "03",
			icon: CreditCard,
			title: t("ecosystem.e3_title"),
			subtitle: t("ecosystem.e3_subtitle"),
			text: t("ecosystem.e3_text"),
			bullets: [
				t("ecosystem.e3_b1"),
				t("ecosystem.e3_b2"),
				t("ecosystem.e3_b3"),
			],
			mockup: "cashier",
		},
	];

	return (
		<Section id="ecosystem">
			<Reveal className="text-center mb-20">
				<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.2em] uppercase block mb-4">
					{t("ecosystem.heading_small")}
				</span>
				<h2 className="font-display text-[34px] md:text-[44px] font-bold text-tawla-ink tracking-tight">
					{t("ecosystem.heading_main")}
				</h2>
			</Reveal>

			<div className="space-y-28 lg:space-y-36">
				{ecosystem.map((item, idx) => {
					const isReversed = idx % 2 !== 0;
					return (
						<Reveal key={item.label}>
							<div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
								{/* Text */}
								<div className={isReversed ? "lg:order-2" : ""}>
									<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.15em] uppercase block mb-2">
										{item.subtitle}
									</span>
									<h3 className="font-display text-[28px] md:text-[36px] font-bold text-tawla-ink tracking-tight mb-4">
										{item.title}
									</h3>
									<p className="text-base text-tawla-body-blue leading-relaxed mb-6">
										{item.text}
									</p>
									<ul className="space-y-3">
										{item.bullets.map((b) => (
											<li
												key={b}
												className="flex items-center gap-3 text-sm text-tawla-body-blue"
											>
												<div className="w-5 h-5 rounded-full bg-tawla-ice/50 flex items-center justify-center shrink-0">
													<Check className="w-3 h-3 text-tawla-deep shrink-0" />
												</div>
												{b}
											</li>
										))}
									</ul>
								</div>
								{/* Mockup */}
								<div
									className={`flex justify-center ${isReversed ? "lg:order-1" : ""}`}
								>
									<EcoMockup type={item.mockup} />
								</div>
							</div>
						</Reveal>
					);
				})}
			</div>
		</Section>
	);
}

/* ════════════════════════════════════════════════════
   PRICING
   ════════════════════════════════════════════════════ */
function PricingSection() {
	const { t } = useTranslation();
	const ref = useRef(null);
	const inView = useInView(ref, { once: true, margin: "-80px" });

	const plans = [
		{
			name: t("pricing.p1_name"),
			price: "$49",
			period: "/mo",
			desc: t("pricing.p1_desc"),
			features: [
				t("pricing.p1_f1"),
				t("pricing.p1_f2"),
				t("pricing.p1_f3"),
				t("pricing.p1_f4"),
			],
			highlighted: false,
		},
		{
			name: t("pricing.p2_name"),
			price: "$99",
			period: "/mo",
			desc: t("pricing.p2_desc"),
			features: [
				t("pricing.p2_f1"),
				t("pricing.p2_f2"),
				t("pricing.p2_f3"),
				t("pricing.p2_f4"),
				t("pricing.p2_f5"),
				t("pricing.p2_f6"),
			],
			highlighted: true,
			badge: t("pricing.p2_badge"),
		},
		{
			name: t("pricing.p3_name"),
			price: t("pricing.custom_price"),
			period: "",
			desc: t("pricing.p3_desc"),
			features: [
				t("pricing.p3_f1"),
				t("pricing.p3_f2"),
				t("pricing.p3_f3"),
				t("pricing.p3_f4"),
				t("pricing.p3_f5"),
			],
			highlighted: false,
		},
	];

	return (
		<Section id="pricing" className="bg-tawla-ghost">
			<Reveal className="text-center mb-16">
				<span className="text-[11px] font-semibold text-tawla-sky tracking-[0.2em] uppercase block mb-4">
					{t("pricing.heading_small")}
				</span>
				<h2 className="font-display text-[34px] md:text-[44px] font-bold text-tawla-ink tracking-tight">
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
								? "bg-white border-tawla-sky/40 shadow-[0_0_40px_rgba(50,130,184,0.12)]"
								: "bg-white border-tawla-deep/5 hover:border-tawla-sky/20 hover:shadow-[0_8px_32px_rgba(15,76,117,0.06)]"
						}`}
					>
						{p.highlighted && (
							<div className="absolute -top-3 start-1/2 -content-center px-4 py-1 rounded-full bg-tawla-sky text-white text-[10px] font-bold tracking-wider uppercase transform -translate-x-1/2 rtl:translate-x-1/2">
								{(p as (typeof plans)[1]).badge}
							</div>
						)}
						<h3 className="text-lg font-bold text-tawla-ink mb-1">{p.name}</h3>
						<div className="flex items-baseline gap-1 mb-3">
							<span className="text-[36px] font-bold text-tawla-ink">
								{p.price}
							</span>
							{p.period && (
								<span className="text-sm text-tawla-muted">{p.period}</span>
							)}
						</div>
						<p className="text-sm text-tawla-body-blue mb-6">{p.desc}</p>
						<ul className="space-y-3 mb-8">
							{p.features.map((f) => (
								<li
									key={f}
									className="flex items-center gap-2.5 text-sm text-tawla-body-blue"
								>
									<Check className="w-4 h-4 text-tawla-sky shrink-0" />
									{f}
								</li>
							))}
						</ul>
						<a
							href="/register"
							className={`block text-center py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
								p.highlighted
									? "bg-tawla-deep text-white hover:bg-tawla-dark shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
									: "border-2 border-tawla-deep/15 text-tawla-deep hover:border-tawla-deep/30 hover:bg-tawla-ghost"
							}`}
						>
							{p.price === t("pricing.custom_price")
								? t("pricing.btn_contact")
								: t("pricing.btn_start")}
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
	const { t } = useTranslation();
	return (
		<section
			id="contact"
			className="relative py-24 lg:py-32 bg-tawla-deep overflow-hidden"
		>
			{/* BG accents */}
			<div className="absolute top-0 end-0 w-[400px] h-[400px] rounded-full bg-tawla-sky/10 blur-[120px]" />
			<div className="absolute bottom-0 start-0 w-[300px] h-[300px] rounded-full bg-tawla-ice/5 blur-[100px]" />

			<Reveal className="relative max-w-[640px] mx-auto px-6 text-center">
				<h2 className="font-display text-[32px] md:text-[44px] font-bold text-white tracking-tight mb-6">
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
						placeholder={t("cta.placeholder")}
						className="flex-1 px-5 py-3.5 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/40
                       text-sm focus:outline-none focus:ring-2 focus:ring-tawla-sky/50 transition"
					/>
					<button
						type="submit"
						className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-tawla-deep font-semibold text-sm
                       hover:bg-tawla-ice hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 shrink-0"
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
			<div className="max-w-[1240px] mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
				<a
					href="#"
					className="font-display text-xl font-bold text-white/90 tracking-tight"
				>
					Tawla
				</a>
				<nav className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
					{[
						{ label: t("nav.features"), href: "features" },
						{ label: t("nav.ecosystem"), href: "ecosystem" },
						{ label: t("nav.pricing"), href: "pricing" },
					].map((l) => (
						<a
							key={l.label}
							href={`#${l.href}`}
							className="hover:text-white/80 transition-colors"
						>
							{l.label}
						</a>
					))}
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							toast.info("Privacy Policy coming soon");
						}}
						className="hover:text-white/80 transition-colors"
					>
						{t("footer.privacy")}
					</a>
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							toast.info("Terms of Service coming soon");
						}}
						className="hover:text-white/80 transition-colors"
					>
						{t("footer.terms")}
					</a>
				</nav>
				<p className="text-xs text-white/30">{t("footer.rights")}</p>
			</div>
		</footer>
	);
}

/* ════════════════════════════════════════════════════
   MAIN EXPORT (Wrapped with Context)
   ════════════════════════════════════════════════════ */
function LandingContentInner() {
	const { lang } = useTranslation();

	return (
		<div
			suppressHydrationWarning
			className={`bg-white font-sans text-tawla-body-blue overflow-x-hidden ${
				lang === "ar" ? ibmArabic.className : ""
			}`}
			dir={lang === "ar" ? "rtl" : "ltr"}
		>
			<Header />
			<HeroSection />
			<FeaturesSection />
			<EcosystemSection />
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
