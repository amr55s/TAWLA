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
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
	const [notifOpen, setNotifOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [recentNotifOrders, setRecentNotifOrders] = useState<any[]>([]);
	const [notifLoading, setNotifLoading] = useState(false);
	const [clearedAt, setClearedAt] = useState<Date | null>(null);

	const [passwordModalOpen, setPasswordModalOpen] = useState(false);
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [passwordLoading, setPasswordLoading] = useState(false);

	const router = useRouter();

	useEffect(() => setMounted(true), []);

	const handlePasswordSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordError("");
		
		if (newPassword.length < 6) {
			setPasswordError("Password must be at least 6 characters long.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setPasswordError("Passwords do not match.");
			return;
		}

		setPasswordLoading(true);
		const supabase = createClient();
		
		const { error } = await supabase.auth.updateUser({
			password: newPassword
		});

		setPasswordLoading(false);

		if (error) {
			setPasswordError(error.message || "Failed to update password.");
			return;
		}

		setPasswordModalOpen(false);
		setNewPassword("");
		setConfirmPassword("");
		toast.success("Password updated successfully!");
	};

	useEffect(() => {
		if (!notifOpen || !restaurantId) return;
		setNotifLoading(true);
		const fetchNotifs = async () => {
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
			const supabase = createClient();
			const { data } = await supabase
				.from("orders")
				.select(`
					id,
					order_number,
					created_at,
					status,
					total_amount,
					tables ( table_number ),
					order_items ( id )
				`)
				.eq("restaurant_id", restaurantId)
				.gte("created_at", yesterday)
				.in("status", ["pending", "confirmed"])
				.order("created_at", { ascending: false })
				.limit(5);
			setRecentNotifOrders(data || []);
			setNotifLoading(false);
		};
		fetchNotifs();
	}, [notifOpen, restaurantId]);

	const formatTimeAgo = (dateString: string) => {
		const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
		if (diff < 1) return "Just now";
		if (diff < 60) return `${diff} mins ago`;
		const hours = Math.floor(diff / 60);
		if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
		const days = Math.floor(hours / 24);
		return `${days} ${days === 1 ? 'day' : 'days'} ago`;
	};

	const handleLogout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/login"); // or a generic login route
	};

	const handleClearNotifs = (e: React.MouseEvent) => {
		e.stopPropagation();
		setClearedAt(new Date());
		setNotifCount(0);
	};

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
									className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${active
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
									className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${active
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
							<div className="flex items-center gap-3 relative">
								{/* Notification */}
								<div className="relative">
									<button
										onClick={() => {
											setNotifOpen(!notifOpen);
											setProfileOpen(false);
											setNotifCount(0);
										}}
										className="relative p-2.5 rounded-xl hover:bg-[#F0F4F8] transition-colors"
									>
										<Bell size={18} className="text-[#5A6B82]" />
										{notifCount > 0 && (
											<span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
												{notifCount > 9 ? "9+" : notifCount}
											</span>
										)}
									</button>

									<AnimatePresence>
										{notifOpen && (
											<motion.div
												initial={{ opacity: 0, y: 10, scale: 0.95 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: 10, scale: 0.95 }}
												transition={{ duration: 0.2 }}
												className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E8ECF1] overflow-hidden z-50"
											>
												<div className="flex items-center justify-between p-4 border-b border-[#E8ECF1]">
													<h3 className="text-sm font-bold text-[#0A1628]">Notifications</h3>
													<button
														onClick={handleClearNotifs}
														className="text-xs font-semibold text-[#94A3B8] hover:text-[#0F4C75] transition-colors"
													>
														Clear All
													</button>
												</div>
												<div className="max-h-[300px] overflow-y-auto">
													{notifLoading ? (
														<div className="p-8 flex justify-center">
															<div className="w-5 h-5 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
														</div>
													) : (() => {
														const visibleNotifs = recentNotifOrders.filter(
															(o) => !clearedAt || new Date(o.created_at) > clearedAt
														);
														
														if (visibleNotifs.length === 0) {
															return (
																<div className="px-6 py-10 flex flex-col items-center justify-center text-center">
																	<div className="w-10 h-10 rounded-full bg-[#F5F7FA] flex items-center justify-center mb-3">
																		<Bell size={18} className="text-[#B0B8C4]" />
																	</div>
																	<p className="text-sm font-semibold text-[#0A1628] mb-0.5">All caught up!</p>
																	<p className="text-xs text-[#94A3B8]">No new notifications to show.</p>
																</div>
															);
														}

														return (
															<div className="flex flex-col">
																{visibleNotifs.map((order) => {
																const tableNum = order.tables?.table_number;
																const itemCount = order.order_items?.length || 0;
																const amount = Number(order.total_amount || 0).toFixed(2);
																const statusText = order.status.replace(/_/g, " ");

																return (
																	<Link
																		key={order.id}
																		href={`/${slug}/admin/orders`}
																		onClick={() => setNotifOpen(false)}
																		className="flex items-start gap-3 px-4 py-3 hover:bg-[#F0F4F8] border-b border-[#E8ECF1] last:border-0 transition-colors group"
																	>
																		<div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-[#0F4C75] shadow-[0_0_8px_rgba(15,76,117,0.4)]" />
																		
																		<div className="flex-1 min-w-0">
																			<div className="flex items-center justify-between gap-2 mb-0.5">
																				<span className="text-sm font-bold text-[#0A1628] truncate group-hover:text-[#0F4C75] transition-colors">
																					Order #{order.order_number || order.id.slice(0, 4)} • {tableNum ? `Table ${tableNum}` : "Takeaway"}
																				</span>
																				<span className="text-[10px] font-medium text-[#94A3B8] shrink-0 whitespace-nowrap">
																					{formatTimeAgo(order.created_at)}
																				</span>
																			</div>
																			
																			<div className="flex items-center gap-1.5 text-xs text-[#7B8BA3] truncate">
																				<span className="font-semibold text-[#0F4C75]">${amount}</span>
																				<span>•</span>
																				<span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
																				<span>•</span>
																				<span className="capitalize truncate">{statusText}</span>
																			</div>
																		</div>
																	</Link>
																);
															})}
															</div>
														);
													})()}
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>

								{/* Profile */}
								<div className="relative">
									<div
										role="button"
										onClick={() => {
											setProfileOpen(!profileOpen);
											setNotifOpen(false);
										}}
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
											className={`text-[#B0B8C4] hidden md:block transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
										/>
									</div>

									<AnimatePresence>
										{profileOpen && (
											<motion.div
												initial={{ opacity: 0, y: 10, scale: 0.95 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: 10, scale: 0.95 }}
												transition={{ duration: 0.2 }}
												className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E8ECF1] overflow-hidden z-50 p-1.5"
											>
												<button
													onClick={() => {
														setProfileOpen(false);
														setPasswordModalOpen(true);
													}}
													className="w-full text-left px-3 py-2 text-sm font-medium text-[#0A1628] hover:bg-[#F0F4F8] rounded-xl transition-colors"
												>
													Change Password
												</button>
												<div className="h-px bg-[#E8ECF1] my-1.5 mx-2" />
												<button
													onClick={handleLogout}
													className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
												>
													<LogOut size={16} />
													Log Out
												</button>
											</motion.div>
										)}
									</AnimatePresence>
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
													className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all ${active
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

					{/* Change Password Modal */}
					<AnimatePresence>
						{passwordModalOpen && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 z-[100] flex items-center justify-center px-4"
							>
								{/* Backdrop */}
								<div 
									className="absolute inset-0 bg-black/20 backdrop-blur-sm"
									onClick={() => !passwordLoading && setPasswordModalOpen(false)}
								/>
								
								{/* Modal Panel */}
								<motion.div
									initial={{ opacity: 0, y: 20, scale: 0.95 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
									exit={{ opacity: 0, y: 20, scale: 0.95 }}
									className="relative bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E8ECF1] p-6 max-w-md w-full"
								>
									<div className="flex items-center justify-between mb-5">
										<h2 className="text-lg font-bold text-[#0A1628]">Change Password</h2>
										<button
											onClick={() => !passwordLoading && setPasswordModalOpen(false)}
											className="p-1 text-[#7B8BA3] hover:text-[#0A1628] transition-colors rounded-lg hover:bg-[#F5F7FA]"
										>
											<X size={18} />
										</button>
									</div>

									<form onSubmit={handlePasswordSubmit} className="space-y-4">
										<div>
											<label className="text-xs font-semibold text-[#5A6B82] mb-1.5 block">
												New Password
											</label>
											<input
												type="password"
												value={newPassword}
												onChange={(e) => {
													setNewPassword(e.target.value);
													if (passwordError) setPasswordError("");
												}}
												disabled={passwordLoading}
												placeholder="••••••••"
												className="w-full py-2.5 px-3 bg-[#F5F7FA] border border-transparent rounded-xl text-sm text-[#0A1628] placeholder:text-[#B0B8C4] focus:outline-none focus:bg-white focus:border-[#E8ECF1] focus:ring-1 focus:ring-[#3282B8]/20 transition-all"
											/>
										</div>

										<div>
											<label className="text-xs font-semibold text-[#5A6B82] mb-1.5 block">
												Confirm New Password
											</label>
											<input
												type="password"
												value={confirmPassword}
												onChange={(e) => {
													setConfirmPassword(e.target.value);
													if (passwordError) setPasswordError("");
												}}
												disabled={passwordLoading}
												placeholder="••••••••"
												className="w-full py-2.5 px-3 bg-[#F5F7FA] border border-transparent rounded-xl text-sm text-[#0A1628] placeholder:text-[#B0B8C4] focus:outline-none focus:bg-white focus:border-[#E8ECF1] focus:ring-1 focus:ring-[#3282B8]/20 transition-all"
											/>
										</div>

										{passwordError && (
											<p className="text-xs font-medium text-red-500 mt-1">
												{passwordError}
											</p>
										)}

										<div className="pt-2">
											<button
												type="submit"
												disabled={passwordLoading}
												className="w-full py-2.5 bg-[#0F4C75] text-white rounded-xl text-sm font-semibold hover:bg-[#0A3558] disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
											>
												{passwordLoading ? (
													<span className="flex items-center justify-center gap-2">
														<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
														Updating...
													</span>
												) : (
													"Update Password"
												)}
											</button>
										</div>
									</form>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
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
		<RestaurantProvider initialSlug={slug} requireAdmin>
			<AdminLayoutInner>{children}</AdminLayoutInner>
		</RestaurantProvider>
	);
}