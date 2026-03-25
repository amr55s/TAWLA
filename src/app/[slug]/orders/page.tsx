"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatingNavBar } from "@/components/ui/FloatingNavBar";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";

const GUEST_SESSION_KEY = "tawla_guest_session_id";

interface OrderHistoryItem {
	id: string;
	order_number?: number | null;
	total_amount: number;
	created_at: string;
	status: string;
	order_items: {
		id: string;
		quantity: number;
		price_at_time: number;
		menu_items: { name_en: string; name_ar: string } | null;
	}[];
}

export default function GuestOrdersPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = React.use(params);
	const router = useRouter();
	const cartCount = useCartStore((s) => s.getTotalItems());

	const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchOrders = useCallback(async () => {
		// Resolve guestId: prefer cart store, fall back to localStorage
		let localGuestId = useCartStore.getState().guestId;
		if (!localGuestId && typeof window !== "undefined") {
			localGuestId = localStorage.getItem(GUEST_SESSION_KEY) || "";
		}

		if (!localGuestId) {
			console.warn("No guestId found, skipping fetch.");
			setLoading(false);
			return;
		}

		// Sync back to cart store in case it was read from localStorage
		if (!useCartStore.getState().guestId) {
			useCartStore.getState().setGuestId(localGuestId);
		}

		const supabase = createClient();

		const { data: restaurant } = await supabase
			.from("restaurants")
			.select("id")
			.eq("slug", slug)
			.single();

		if (!restaurant) {
			setLoading(false);
			return;
		}

		const { data, error } = await supabase
			.from("orders")
			.select("*, order_items(*, menu_items(*))")
			.eq("guest_id", localGuestId)
			.eq("restaurant_id", restaurant.id)
			.in("status", [
				"pending",
				"in_kitchen",
				"ready",
				"delivered",
			])
			// oldest first → Order #1, Order #2, …
			.order("created_at", { ascending: true });

		if (error) {
			console.error("Fetch orders failed:", JSON.stringify(error, null, 2), error);
			setOrders([]);
		} else {
			setOrders((data as unknown as OrderHistoryItem[]) || []);
		}
		setLoading(false);
	}, [slug]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	// Poll for status updates every 15 seconds
	useEffect(() => {
		const interval = setInterval(fetchOrders, 15_000);
		return () => clearInterval(interval);
	}, [fetchOrders]);

	const formatDate = (iso: string) => {
		const d = new Date(iso);
		return d.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const renderStatusChip = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase tracking-wider flex items-center gap-1">
						<span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
						Waiting for Waiter
					</span>
				);
			case "in_kitchen":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider flex items-center gap-1">
						<div className="w-3 h-3 rounded-full bg-blue-100 flex items-center justify-center">
							<span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
						</div>
						Being Prepared
					</span>
				);
			case "ready":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
						<div className="w-3 h-3 rounded-full bg-emerald-100 flex items-center justify-center">
							<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
						</div>
						Ready for Pickup
					</span>
				);
			case "delivered":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
						✓ Served
					</span>
				);
			case "completed":
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wider flex items-center gap-1">
						✓ Finished
					</span>
				);
			default:
				return (
					<span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
						{status.replace(/_/g, " ")}
					</span>
				);
		}
	};

	return (
		<div className="min-h-screen bg-background pb-32">
			<div className="bg-background px-5 pt-6 pb-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<button
						onClick={() => router.push(`/${slug}/menu`)}
						className="w-10 h-10 rounded-xl bg-background-card flex items-center justify-center text-text-heading"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</button>
					<h1 className="text-lg font-bold text-text-heading">My Orders</h1>
				</div>
				{/* Refresh indicator */}
				{!loading && orders.length > 0 && (
					<button
						onClick={fetchOrders}
						className="text-xs text-primary font-semibold flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-xl"
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
							<path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
						</svg>
						Refresh
					</button>
				)}
			</div>

			<main className="px-5">
				{loading ? (
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="bg-background-card rounded-2xl shadow-card p-4 border border-border-light space-y-4"
							>
								<div className="flex items-center justify-between border-b border-border-light pb-3">
									<div className="space-y-2">
										<Skeleton className="h-5 w-24 rounded" />
										<Skeleton className="h-3 w-32 rounded" />
									</div>
									<Skeleton className="h-6 w-28 rounded-md" />
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Skeleton className="h-4 w-1/3 rounded" />
										<Skeleton className="h-4 w-16 rounded" />
									</div>
								</div>
								<div className="border-t border-primary/20 pt-3 flex items-center justify-between mt-3">
									<Skeleton className="h-5 w-12 rounded" />
									<Skeleton className="h-6 w-20 rounded" />
								</div>
							</div>
						))}
					</div>
				) : orders.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="flex flex-col items-center justify-center py-24 text-center"
					>
						<div className="text-7xl mb-4 opacity-30">🧾</div>
						<h3 className="text-lg font-semibold text-text-heading mb-2">
							No orders found for this session
						</h3>
						<p className="text-text-muted text-sm mb-8">
							Place an order from the menu to see it here
						</p>
						<button
							onClick={() => router.push(`/${slug}/menu`)}
							className="px-6 py-3 bg-primary text-white font-bold rounded-2xl text-sm"
						>
							Browse Menu
						</button>
					</motion.div>
				) : (
					<div className="space-y-4">
						{/* Session banner */}
						<div className="bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-3">
							<span className="text-xl">🪑</span>
							<div>
								<p className="text-xs font-bold text-primary uppercase tracking-wider">
									Your Session
								</p>
								<p className="text-sm text-text-muted">
									{orders.length} order{orders.length !== 1 ? "s" : ""} placed
									this visit
								</p>
							</div>
						</div>

						<AnimatePresence>
							{orders.map((order, idx) => (
								<motion.div
									key={order.id}
									initial={{ opacity: 0, y: 12 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: idx * 0.05 }}
									className="bg-background-card rounded-2xl shadow-card p-4 border border-border-light"
								>
									<div className="flex items-center justify-between mb-3 border-b border-border-light pb-3">
										<div>
											<h3
												className="text-sm font-bold text-text-heading mb-0.5"
												style={{ direction: "ltr" }}
											>
												Order #{idx + 1}
											</h3>
											<span className="text-xs font-medium text-text-muted">
												{formatDate(order.created_at)}
											</span>
										</div>
										{renderStatusChip(order.status)}
									</div>

									<div className="divide-y divide-border-light">
										{(order.order_items || []).map((oi) => (
											<div
												key={oi.id}
												className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
											>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-text-heading truncate">
														{oi.menu_items?.name_en || "Unknown item"}
													</p>
													<p className="text-xs text-text-muted">
														x{oi.quantity}
													</p>
												</div>
												<p
													className="text-sm font-semibold text-text-heading ms-3"
													style={{ direction: "ltr" }}
												>
													{(oi.price_at_time * oi.quantity).toFixed(3)} KD
												</p>
											</div>
										))}
									</div>

									<div className="border-t border-primary/20 mt-3 pt-3 flex items-center justify-between">
										<span className="text-sm font-bold text-text-heading">
											Total
										</span>
										<span
											className="text-base font-bold text-primary"
											style={{ direction: "ltr" }}
										>
											{Number(order.total_amount).toFixed(3)} KD
										</span>
									</div>
								</motion.div>
							))}
						</AnimatePresence>

						{/* CTA to add another order */}
						<motion.div
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: orders.length * 0.05 + 0.1 }}
							className="pt-2 pb-4"
						>
							<button
								onClick={() => router.push(`/${slug}/menu`)}
								className="w-full py-4 border-2 border-dashed border-primary/30 rounded-2xl text-primary font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
							>
								<span className="text-lg">+</span>
								Order More Items
							</button>
						</motion.div>
					</div>
				)}
			</main>

			<FloatingNavBar restaurantSlug={slug} cartCount={cartCount} />
		</div>
	);
}
