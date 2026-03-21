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
	Sun,
	Moon,
	KeyRound,
	Mail,
	CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
	RestaurantProvider,
	useRestaurant,
} from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/contexts/ThemeContext";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const params = useParams();
	const router = useRouter();
	const urlSlug = params.slug as string;
	const { slug: contextSlug, restaurantId } = useRestaurant();
	const slug = urlSlug || contextSlug || "";
	const basePath = `/${slug}/admin`;

	const { theme, setTheme } = useTheme();

	const [mobileOpen, setMobileOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	
	// Notifications
	const [notifCount, setNotifCount] = useState(0);
	const [notifOpen, setNotifOpen] = useState(false);
	const [notifications, setNotifications] = useState<{id: string, message: string, time: Date}[]>([]);
	
	// Profile & Settings
	const [profileOpen, setProfileOpen] = useState(false);
	const [settingsModalOpen, setSettingsModalOpen] = useState(false);
	const [settingsView, setSettingsView] = useState<"email" | "password">("email");
	const [emailInput, setEmailInput] = useState("");
	const [passwordInput, setPasswordInput] = useState("");
	const [savingAuth, setSavingAuth] = useState(false);

	const [copied, setCopied] = useState(false);

	const notifRef = useRef<HTMLDivElement>(null);
	const profileRef = useRef<HTMLDivElement>(null);

	useEffect(() => setMounted(true), []);

	// Click outside handlers
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
				setNotifOpen(false);
			}
			if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
				setProfileOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

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
					setNotifications((prev) => [
						{ id: Math.random().toString(), message: "New Order Received!", time: new Date() },
						...prev,
					].slice(0, 10)); // keep last 10
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
					setNotifications((prev) => [
						{ id: Math.random().toString(), message: "New Waiter Call!", time: new Date() },
						...prev,
					].slice(0, 10));
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

	const handleUpdateAuth = async () => {
		setSavingAuth(true);
		const supabase = createClient();
		
		try {
			if (settingsView === "email") {
				if (!emailInput.includes("@")) {
					toast.error("Please enter a valid email");
					return;
				}
				const { error } = await supabase.auth.updateUser({ email: emailInput });
				if (error) throw error;
				toast.success("Confirmation link sent to both old and new emails.");
			} else {
				if (passwordInput.length < 6) {
					toast.error("Password must be at least 6 characters");
					return;
				}
				const { error } = await supabase.auth.updateUser({ password: passwordInput });
				if (error) throw error;
				toast.success("Password updated successfully.");
			}
			setSettingsModalOpen(false);
			setEmailInput("");
			setPasswordInput("");
		} catch (err: any) {
			console.error("Auth update error:", err);
			toast.error(err.message || "Failed to update authentication settings");
		} finally {
			setSavingAuth(false);
		}
	};

	const handleBellClick = () => {
		setNotifOpen(!notifOpen);
		if (!notifOpen && notifCount > 0) {
			setNotifCount(0); // Mark as read when opening
		}
	};

	return (
		<div
			className="h-screen overflow-hidden bg-[#F5F7FA] dark:bg-gray-900 transition-colors duration-200"
			suppressHydrationWarning
		>
			<div className="h-full flex">
				{/* ── Sidebar (Desktop) ── */}
				<aside className="hidden lg:flex fixed top-0 bottom-0 start-0 z-40 flex-col w-[260px] bg-white dark:bg-gray-800 border-r border-[#E8ECF1] dark:border-gray-700 shrink-0 overflow-y-auto transition-colors duration-200">
					{/* Logo */}
					<div className="px-7 pt-7 pb-6">
						<Link href={basePath} className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-[0_2px_8px_rgba(15,76,117,0.2)]">
								<span className="text-white text-sm font-bold">T</span>
							</div>
							<div>
								<span className="text-lg font-bold text-[#0A1628] dark:text-white tracking-tight block leading-none">
									Tawla
								</span>
								<span className="text-[10px] text-[#7B8BA3] dark:text-gray-400 font-medium tracking-wider uppercase">
									Dashboard
								</span>
							</div>
						</Link>
					</div>

					{/* Navigation */}
					<nav className="flex-1 px-4 space-y-1">
						<p className="px-3 mb-2 text-[10px] font-semibold text-[#B0B8C4] dark:text-gray-500 uppercase tracking-widest">
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
											: "text-[#5A6B82] dark:text-gray-400 hover:bg-[#F0F4F8] dark:hover:bg-gray-700/50 hover:text-[#0A1628] dark:hover:text-white"
									}`}
								>
									<Icon size={18} strokeWidth={active ? 2 : 1.5} />
									{item.label}
								</Link>
							);
						})}

						<div className="pt-5 pb-1">
							<p className="px-3 mb-2 text-[10px] font-semibold text-[#B0B8C4] dark:text-gray-500 uppercase tracking-widest">
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
											: "text-[#5A6B82] dark:text-gray-400 hover:bg-[#F0F4F8] dark:hover:bg-gray-700/50 hover:text-[#0A1628] dark:hover:text-white"
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
								className="rounded-2xl p-4 border border-[#BBE1FA]/30 dark:border-white/10"
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
								<p className="text-[11px] text-[#5A6B82] dark:text-gray-300 font-medium truncate mb-3">
									tawla.app/{slug}
								</p>
								<div className="flex gap-2">
									<button
										onClick={handleCopyLink}
										className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/80 dark:bg-gray-800 border border-[#E8ECF1] dark:border-gray-600 text-[10px] font-semibold text-[#5A6B82] dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-[#0F4C75] transition-all"
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
					<div className="p-4 border-t border-[#E8ECF1] dark:border-gray-700">
						<Link
							href="/"
							className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-[#5A6B82] dark:text-gray-400 hover:bg-[#F0F4F8] dark:hover:bg-gray-700/50 hover:text-[#0A1628] dark:hover:text-white transition-all"
						>
							<LogOut size={18} strokeWidth={1.5} />
							Back to Site
						</Link>
					</div>
				</aside>

				{/* ── Main Area ── */}
				<div className="flex-1 flex flex-col h-full lg:ms-[260px] min-w-0">
					{/* Top Header */}
					<header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-[#E8ECF1] dark:border-gray-800 px-5 lg:px-8 py-3.5 transition-colors duration-200">
						<div className="flex items-center justify-between gap-4">
							{/* Mobile menu toggle */}
							<button
								onClick={() => setMobileOpen(!mobileOpen)}
								className="lg:hidden p-2 -ml-2 text-[#5A6B82] dark:text-gray-400 hover:text-[#0A1628] dark:hover:text-white transition-colors"
							>
								{mobileOpen ? <X size={22} /> : <Menu size={22} />}
							</button>

							{/* Search */}
							<div className="hidden sm:flex items-center flex-1 max-w-md">
								<div className="relative w-full">
									<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0B8C4] dark:text-gray-500" />
									<input
										type="text"
										placeholder="Search orders, menu items..."
										className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F5F7FA] dark:bg-gray-800 border border-transparent text-sm text-[#0A1628] dark:text-white
                             placeholder:text-[#B0B8C4] dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-gray-700 focus:border-[#E8ECF1] dark:focus:border-gray-600 focus:ring-1 focus:ring-[#3282B8]/20 transition-all"
									/>
								</div>
							</div>

							{/* Right actions */}
							<div className="flex items-center gap-2 sm:gap-3 ml-auto">
								
								{/* Dark Mode Toggle */}
								{mounted && (
									<button
										onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
										className="p-2.5 rounded-xl hover:bg-[#F0F4F8] dark:hover:bg-gray-800 transition-colors text-[#5A6B82] dark:text-gray-400"
										aria-label="Toggle Dark Mode"
									>
										{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
									</button>
								)}

								{/* Notification */}
								<div className="relative" ref={notifRef}>
									<button
										onClick={handleBellClick}
										className="relative p-2.5 rounded-xl hover:bg-[#F0F4F8] dark:hover:bg-gray-800 transition-colors"
									>
										<Bell size={18} className="text-[#5A6B82] dark:text-gray-400" />
										{notifCount > 0 && (
											<span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
												{notifCount > 9 ? "9+" : notifCount}
											</span>
										)}
									</button>
									<AnimatePresence>
										{notifOpen && (
											<motion.div
												initial={{ opacity: 0, scale: 0.95, y: 10 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95, y: 10 }}
												className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50"
											>
												<div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
													<h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
													{notifications.length > 0 && (
														<button 
															onClick={() => setNotifications([])}
															className="text-[10px] text-[#0F4C75] dark:text-[#3282B8] font-semibold hover:underline"
														>
															Clear all
														</button>
													)}
												</div>
												<div className="max-h-80 overflow-y-auto">
													{notifications.length === 0 ? (
														<div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
															No recent activity.
														</div>
													) : (
														<div className="divide-y divide-gray-50 dark:divide-gray-700">
															{notifications.map((n) => (
																<div key={n.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex gap-3 items-start">
																	<div className="w-8 h-8 rounded-full bg-[#0F4C75]/10 dark:bg-[#3282B8]/20 flex items-center justify-center shrink-0">
																		<CheckCircle2 size={14} className="text-[#0F4C75] dark:text-[#3282B8]" />
																	</div>
																	<div>
																		<p className="text-sm font-semibold text-gray-900 dark:text-white">{n.message}</p>
																		<p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
																			{n.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
																		</p>
																	</div>
																</div>
															))}
														</div>
													)}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								{/* Profile */}
								<div className="relative" ref={profileRef}>
									<div
										role="button"
										onClick={() => setProfileOpen(!profileOpen)}
										className="flex items-center gap-2.5 p-1.5 pe-3 rounded-xl hover:bg-[#F0F4F8] dark:hover:bg-gray-800 transition-colors cursor-pointer"
									>
										<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F4C75] to-[#3282B8] flex items-center justify-center">
											<span className="text-white text-xs font-bold">A</span>
										</div>
										<div className="hidden md:block text-start">
											<span className="block text-xs font-semibold text-[#0A1628] dark:text-white leading-none">
												Admin
											</span>
											<span className="block text-[10px] text-[#7B8BA3] dark:text-gray-400">
												Settings
											</span>
										</div>
										<ChevronDown
											size={14}
											className="text-[#B0B8C4] dark:text-gray-500 hidden md:block"
										/>
									</div>
									<AnimatePresence>
										{profileOpen && (
											<motion.div
												initial={{ opacity: 0, scale: 0.95, y: 10 }}
												animate={{ opacity: 1, scale: 1, y: 0 }}
												exit={{ opacity: 0, scale: 0.95, y: 10 }}
												className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 p-2"
											>
												<ul className="space-y-1">
													<li>
														<button 
															onClick={() => { setSettingsView("email"); setSettingsModalOpen(true); setProfileOpen(false); }}
															className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
														>
															<Mail size={16} className="text-gray-400" />
															Change Email
														</button>
													</li>
													<li>
														<button 
															onClick={() => { setSettingsView("password"); setSettingsModalOpen(true); setProfileOpen(false); }}
															className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
														>
															<KeyRound size={16} className="text-gray-400" />
															Change Password
														</button>
													</li>
													<div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2" />
													<li>
														<Link 
															href="/"
															className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
														>
															<LogOut size={16} />
															Logout
														</Link>
													</li>
												</ul>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</div>
						</div>
					</header>

					{/* Settings Modal */}
					<AnimatePresence>
						{settingsModalOpen && (
							<>
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									onClick={() => setSettingsModalOpen(false)}
									className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
								/>
								<motion.div
									initial={{ opacity: 0, scale: 0.95, y: 20 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.95, y: 20 }}
									className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl z-50 border border-gray-100 dark:border-gray-700"
								>
									<div className="flex justify-between items-center mb-6">
										<h2 className="text-xl font-bold text-gray-900 dark:text-white">
											{settingsView === "email" ? "Change Email" : "Change Password"}
										</h2>
										<button onClick={() => setSettingsModalOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
											<X size={20} />
										</button>
									</div>
									<div className="space-y-4">
										<div>
											<label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
												{settingsView === "email" ? "New Email Address" : "New Password"}
											</label>
											{settingsView === "email" ? (
												<input
													type="email"
													value={emailInput}
													onChange={e => setEmailInput(e.target.value)}
													placeholder="admin@example.com"
													className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0F4C75] focus:border-transparent outline-none transition-all"
												/>
											) : (
												<input
													type="password"
													value={passwordInput}
													onChange={e => setPasswordInput(e.target.value)}
													placeholder="Min. 6 characters"
													className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0F4C75] focus:border-transparent outline-none transition-all"
												/>
											)}
										</div>
										<button
											onClick={handleUpdateAuth}
											disabled={savingAuth || (settingsView === "email" ? !emailInput : passwordInput.length < 6)}
											className="w-full py-3.5 mt-2 bg-[#0F4C75] text-white rounded-xl font-bold hover:bg-[#0A3558] disabled:opacity-50 transition-colors shadow-lg shadow-[#0F4C75]/20"
										>
											{savingAuth ? "Saving..." : "Update Credentials"}
										</button>
									</div>
								</motion.div>
							</>
						)}
					</AnimatePresence>

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
									className="relative w-[280px] bg-white dark:bg-gray-800 h-full shadow-2xl p-5 overflow-y-auto"
								>
									<div className="flex items-center justify-between mb-6">
										<span className="text-lg font-bold text-[#0A1628] dark:text-white">
											Tawla
										</span>
										<button
											onClick={() => setMobileOpen(false)}
											className="p-1.5 text-[#5A6B82] dark:text-gray-400"
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
															: "text-[#5A6B82] dark:text-gray-400 hover:bg-[#F0F4F8] dark:hover:bg-gray-700"
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
					<main className="flex-1 overflow-y-auto p-5 lg:p-8 relative z-0">{children}</main>
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
