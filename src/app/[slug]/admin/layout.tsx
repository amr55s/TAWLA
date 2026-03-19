"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	BarChart3,
	Bell,
	ChevronDown,
	ClipboardList,
	Copy,
	ExternalLink,
	Globe,
	LayoutDashboard,
	LogOut,
	Menu,
	Search,
	Settings,
	Users,
	UtensilsCrossed,
	X,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
	RestaurantProvider,
	useRestaurant,
} from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const params = useParams();
	const urlSlug = params.slug as string;
	const { slug: contextSlug, restaurantId } = useRestaurant();
	const slug = urlSlug || contextSlug || "";
	const basePath = `/${slug}/admin`;

	const [mobileOpen, setMobileOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [notifCount, setNotifCount] = useState(0);
	const [copied, setCopied] = useState(false);

	useEffect(() => setMounted(true), []);

	// Realtime notification listener
	useEffect(() => {
		if (!mounted || !restaurantId) return;
		const supabase = createClient();

		const channel = supabase
			.channel(`admin-notifications-${restaurantId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "orders",
					filter: `restaurant_id=eq.${restaurantId}`,
				},
				() => {
					setNotifCount((c) => c + 1);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "waiter_calls",
					filter: `restaurant_id=eq.${restaurantId}`,
				},
				() => {
					setNotifCount((c) => c + 1);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [mounted, restaurantId]);

	const navItems = [
		{ label: "Dashboard", href: basePath, icon: LayoutDashboard },
		{ label: "Orders", href: `${basePath}/orders`, icon: ClipboardList },
		{ label: "Menu", href: `${basePath}/menu`, icon: UtensilsCrossed },
		{ label: "Analytics", href: `${basePath}/analytics`, icon: BarChart3 },
		{ label: "Staff", href: `${basePath}/staff`, icon: Users },
		{ label: "Settings", href: `${basePath}/settings`, icon: Settings },
	];

	const isActive = (href: string) => {
		if (href === basePath) return pathname === basePath;
		return pathname.startsWith(href);
	};

	const handleCopyLink = () => {
		const url = `${window.location.origin}/${slug}`;
		navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div
			className="h-screen overflow-hidden bg-[#F5F7FA]"
			suppressHydrationWarning
		>
			<div className="h-full flex">
				{/* ── Sidebar (Desktop) ── */}
				<aside className="hidden lg:flex fixed top-0 bottom-0 start-0 z-40 flex-col w-[260px] bg-white border-r border-[#E8ECF1] shrink-0 overflow-y-auto">
					{/* Logo */}
					<div className="px-7 pt-7 pb-6">
						<Link href={basePath} className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-[0_2px_8px_rgba(15,76,117,0.2)]">
								<span className="text-white text-sm font-bold">T</span>
							</div>
							<div>
								<span className="text-lg font-bold text-[#0A1628] tracking-tight block leading-none">
									Tawla
								</span>
								<span className="text-[10px] text-[#7B8BA3] font-medium tracking-wider uppercase">
									Dashboard
								</span>
							</div>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="flex-1 px-4 space-y-1">
						<p className="px-3 mb-2 text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-widest">
							Main Menu
						</p>
						{navItems.slice(0, 4).map((item) => {
							const Icon = item.icon;
							const active = isActive(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
										active
											? "bg-[#0F4C75] text-white shadow-[0_2px_8px_rgba(15,76,117,0.2)]"
											: "text-[#5A6B82] hover:bg-[#F0F4F8] hover:text-[#0A1628]"
									}`}
								>
									<Icon size={18} strokeWidth={active ? 2 : 1.5} />
									{item.label}
								</Link>
							);
						})}

						<div className="pt-5 pb-1">
							<p className="px-3 mb-2 text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-widest">
								Management
							</p>
						</div>
						{navItems.slice(4).map((item) => {
							const Icon = item.icon;
							const active = isActive(item.href);
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
										active
											? "bg-[#0F4C75] text-white shadow-[0_2px_8px_rgba(15,76,117,0.2)]"
											: "text-[#5A6B82] hover:bg-[#F0F4F8] hover:text-[#0A1628]"
									}`}
								>
									<Icon size={18} strokeWidth={active ? 2 : 1.5} />
									{item.label}
								</Link>
							);
						})}
					</nav>

					{/* Live Menu Card */}
					{slug && (
						<div className="px-4 pb-3">
							<div
								className="rounded-2xl p-4 border border-[#BBE1FA]/30"
								style={{
									background:
										"linear-gradient(135deg, rgba(15,76,117,0.06) 0%, rgba(50,130,184,0.08) 100%)",
									backdropFilter: "blur(8px)",
								}}
							>
								<div className="flex items-center gap-2 mb-2.5">
									<Globe size={14} className="text-[#3282B8]" />
									<span className="text-[10px] font-bold text-[#3282B8] uppercase tracking-widest">
										Live Menu
									</span>
								</div>
								<p className="text-[11px] text-[#5A6B82] font-medium truncate mb-3">
									tawla.app/{slug}
								</p>
								<div className="flex gap-2">
									<button
										onClick={handleCopyLink}
										className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/80 border border-[#E8ECF1] text-[10px] font-semibold text-[#5A6B82] hover:bg-white hover:text-[#0F4C75] transition-all"
									>
										<Copy size={11} />
										{copied ? "Copied!" : "Copy Link"}
									</button>
									<a
										href={`/${slug}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center justify-center px-3 py-2 rounded-lg bg-[#0F4C75] text-white hover:bg-[#0A3558] transition-colors"
									>
										<ExternalLink size={12} />
									</a>
								</div>
							</div>
						</div>
					)}

					{/* Bottom */}
					<div className="p-4 border-t border-[#E8ECF1]">
						<Link
							href="/"
							className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#5A6B82] hover:bg-[#F0F4F8] hover:text-[#0A1628] transition-all"
						>
							<LogOut size={18} strokeWidth={1.5} />
							Back to Site
						</Link>
					</div>
				</aside>

				{/* ── Main Area ── */}
				<div className="flex-1 flex flex-col h-full lg:ms-[260px] min-w-0">
					{/* Top Header */}
					<header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E8ECF1] px-5 lg:px-8 py-3.5">
						<div className="flex items-center justify-between gap-4">
							{/* Mobile menu toggle */}
							<button
								onClick={() => setMobileOpen(!mobileOpen)}
								className="lg:hidden p-2 -ml-2 text-[#5A6B82] hover:text-[#0A1628] transition-colors"
							>
								{mobileOpen ? <X size={22} /> : <Menu size={22} />}
							</button>

							{/* Search */}
							<div className="hidden sm:flex items-center flex-1 max-w-md">
								<div className="relative w-full">
									<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B8C4]" />
									<input
										type="text"
										placeholder="Search orders, menu items..."
										className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F7FA] border border-transparent text-sm text-[#0A1628]
                             placeholder:text-[#B0B8C4] focus:outline-none focus:bg-white focus:border-[#E8ECF1] focus:ring-1 focus:ring-[#3282B8]/20 transition-all"
									/>
								</div>
							</div>

							{/* Right actions */}
							<div className="flex items-center gap-3">
								{/* Notification */}
								<button
									onClick={() => setNotifCount(0)}
									className="relative p-2.5 rounded-xl hover:bg-[#F0F4F8] transition-colors"
								>
									<Bell size={18} className="text-[#5A6B82]" />
									{notifCount > 0 && (
										<span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
											{notifCount > 9 ? "9+" : notifCount}
										</span>
									)}
								</button>

								{/* Profile */}
								<div
									role="button"
									className="flex items-center gap-2.5 p-1.5 pe-3 rounded-xl hover:bg-[#F0F4F8] transition-colors cursor-pointer"
								>
									<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F4C75] to-[#3282B8] flex items-center justify-center">
										<span className="text-white text-xs font-bold">A</span>
									</div>
									<div className="hidden md:block text-start">
										<span className="block text-xs font-semibold text-[#0A1628] leading-none">
											Admin
										</span>
										<span className="block text-[10px] text-[#7B8BA3]">
											Owner
										</span>
									</div>
									<ChevronDown
										size={14}
										className="text-[#B0B8C4] hidden md:block"
									/>
								</div>
							</div>
						</div>
					</header>

					{/* Mobile Drawer — only render after mount to avoid hydration issues */}
					<AnimatePresence>
						{mounted && mobileOpen && (
							<motion.div
								key="mobile-drawer"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="lg:hidden fixed inset-0 z-50 flex"
							>
								<div
									className="absolute inset-0 bg-black/20 backdrop-blur-sm"
									onClick={() => setMobileOpen(false)}
								/>
								<motion.div
									initial={{ x: -280 }}
									animate={{ x: 0 }}
									exit={{ x: -280 }}
									transition={{ type: "spring", damping: 28, stiffness: 300 }}
									className="relative w-[280px] bg-white h-full shadow-2xl p-5 overflow-y-auto"
								>
									<div className="flex items-center justify-between mb-6">
										<span className="text-lg font-bold text-[#0A1628]">
											Tawla
										</span>
										<button
											onClick={() => setMobileOpen(false)}
											className="p-1.5 text-[#5A6B82]"
										>
											<X size={20} />
										</button>
									</div>
									<nav className="space-y-1">
										{navItems.map((item) => {
											const Icon = item.icon;
											const active = isActive(item.href);
											return (
												<Link
													key={item.href}
													href={item.href}
													onClick={() => setMobileOpen(false)}
													className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
														active
															? "bg-[#0F4C75] text-white"
															: "text-[#5A6B82] hover:bg-[#F0F4F8]"
													}`}
												>
													<Icon size={18} /> {item.label}
												</Link>
											);
										})}
									</nav>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Main Content */}
					<main className="flex-1 overflow-y-auto p-5 lg:p-8">{children}</main>
				</div>
			</div>
		</div>
	);
}

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const params = useParams();
	const slug = params.slug as string;
	return (
		<RestaurantProvider initialSlug={slug}>
			<AdminLayoutInner>{children}</AdminLayoutInner>
		</RestaurantProvider>
	);
}
