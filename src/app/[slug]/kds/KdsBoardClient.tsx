"use client";

import {
	ChefHat,
	ChevronLeft,
	ChevronRight,
	LogOut,
	PlayCircle,
	Volume2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useAudioAlert } from "@/hooks/useAudioAlert";
import {
	fetchActiveKdsOrders,
	updateOrderStatus,
} from "@/app/actions/kds.actions";
import { type KdsOrderRow } from "@/types/kds";
import { clearStaffSession } from "@/app/actions/staff-auth";
import { OrderCard } from "@/components/kds/OrderCard";
import { getRestaurantBySlugClient } from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant } from "@/types/database";


function aggregatePrepTotals(
	orders: KdsOrderRow[],
): { name: string; qty: number }[] {
	const map = new Map<string, number>();
	for (const o of orders) {
		for (const line of o.items ?? []) {
			const name = line.menu_item?.name_en || line.menu_item?.name_ar || "Item";
			map.set(name, (map.get(name) ?? 0) + (line.quantity ?? 0));
		}
	}
	return [...map.entries()]
		.map(([name, qty]) => ({ name, qty }))
		.sort((a, b) => b.qty - a.qty);
}

function useLiveClock() {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);
	return now;
}

type KdsBoardClientProps = {
	slug: string;
};

export function KdsBoardClient({ slug }: KdsBoardClientProps) {
	const router = useRouter();
	const supabase = useMemo(() => createClient(), []);
	const clock = useLiveClock();

	const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
	const [orders, setOrders] = useState<KdsOrderRow[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [bumpingId, setBumpingId] = useState<string | null>(null);
	const [undoPrepId, setUndoPrepId] = useState<string | null>(null);
	const [monthlyOrdersCount, setMonthlyOrdersCount] = useState(0);

	const seededOrdersRef = useRef(false);
	const { audioEnabled, enableAudio, playNotificationSound } = useAudioAlert();

	const prepTotals = useMemo(() => aggregatePrepTotals(orders), [orders]);


	const loadOrders = useCallback(
		async (opts?: { playOnNew?: boolean }) => {
			if (!restaurant?.id) return;
			const { data, error } = await fetchActiveKdsOrders(restaurant.id);
			if (error) {
				setLoadError(error);
				return;
			}
			setLoadError(null);
			const fresh = data ?? [];

			setOrders((prev) => {
				if (!seededOrdersRef.current) {
					seededOrdersRef.current = true;
					return fresh;
				}
				if (opts?.playOnNew && audioEnabled) {
					const prevIds = new Set(prev.map((o) => o.id));
					const hasNew = fresh.some((o) => !prevIds.has(o.id));
					if (hasNew) {
						playNotificationSound();
					}
				}
				return fresh;
			});
		},
		[restaurant?.id, audioEnabled, playNotificationSound],
	);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const res = await getRestaurantBySlugClient(slug);
			if (cancelled) return;
			if (!res) {
				router.replace("/");
				return;
			}
			setRestaurant(res);
		})();
		return () => {
			cancelled = true;
		};
	}, [slug, router]);

	useEffect(() => {
		if (!restaurant?.id) return;
		let cancelled = false;
		(async () => {
			setLoading(true);
			if (restaurant.plan === "pro") {
				const monthStart = new Date();
				monthStart.setDate(1);
				monthStart.setHours(0, 0, 0, 0);
				const { count } = await supabase
					.from("orders")
					.select("id", { count: "exact", head: true })
					.eq("restaurant_id", restaurant.id)
					.gte("created_at", monthStart.toISOString());
				if (!cancelled) {
					setMonthlyOrdersCount(count ?? 0);
				}
			} else if (!cancelled) {
				setMonthlyOrdersCount(0);
			}
			await loadOrders({ playOnNew: false });
			if (!cancelled) setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [restaurant?.id, loadOrders]);

	useEffect(() => {
		if (!restaurant?.id) return;

		const channel = supabase
			.channel(`kds-orders-${restaurant.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "orders",
					filter: `restaurant_id=eq.${restaurant.id}`,
				},
			(payload: any) => {
				if (payload.new?.status === "pending" || payload.new?.status === "delivered" || payload.new?.status === "cancelled") return;
				if (restaurant?.plan === "pro" && payload.new?.created_at) {
					const createdAt = new Date(payload.new.created_at);
					const monthStart = new Date();
					monthStart.setDate(1);
					monthStart.setHours(0, 0, 0, 0);
					if (createdAt >= monthStart) {
						setMonthlyOrdersCount((prev) => prev + 1);
					}
				}
				setTimeout(async () => {
					if (!restaurant?.id) return;
					const { data } = await fetchActiveKdsOrders(restaurant.id);
					if (data) {
						setOrders((prev) => {
							const existingIds = new Set(prev.map((o) => o.id));
							const newOnes = data.filter((o) => !existingIds.has(o.id));
							if (newOnes.length > 0 && audioEnabled) {
								playNotificationSound();
							}
							return [...prev, ...newOnes];
						});
					}
				}, 1500);
			},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "orders",
					filter: `restaurant_id=eq.${restaurant.id}`,
				},
			(payload: any) => {
				const newStatus = payload.new?.status;
				if (
					newStatus === "delivered" ||
					newStatus === "served" ||
					newStatus === "cancelled"
				) {
					setOrders((prev) => prev.filter((o) => o.id !== payload.new?.id));
					return;
				}
				if (newStatus === "pending") return;
				void loadOrders({ playOnNew: false });
			},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "orders",
					filter: `restaurant_id=eq.${restaurant.id}`,
				},
			(payload: any) => {
				setOrders((prev) => prev.filter((o) => o.id !== payload.old?.id));
			},
			)
			.subscribe();

		return () => {
			void supabase.removeChannel(channel);
		};
	}, [restaurant?.id, restaurant?.plan, supabase, loadOrders]);

	const handleArmSound = () => {
		enableAudio();
		playNotificationSound();
		toast.success("Kitchen alerts enabled");
	};

	const handleBump = async (order: KdsOrderRow) => {
		setBumpingId(order.id);
		const res = await updateOrderStatus(order.id, "ready");
		setBumpingId(null);
		if (!res.ok) {
			toast.error(res.error ?? "Could not update order");
			return;
		}
		setOrders((prev) =>
			prev.map((o) => (o.id === order.id ? { ...o, status: "ready" } : o)),
		);
		toast.success("Order marked ready", {
			description: `Ticket #${order.id.slice(-4).toUpperCase()} — tap Recall to undo`,
			duration: 12_000,
		});
	};

	const handleRecall = async (order: KdsOrderRow) => {
		setUndoPrepId(order.id);
		const res = await updateOrderStatus(order.id, "in_kitchen");
		setUndoPrepId(null);
		if (!res.ok) {
			toast.error(res.error ?? "Could not recall order");
			return;
		}
		await loadOrders({ playOnNew: false });
		toast.success("Order recalled back to kitchen");
	};

	const handleSignOut = async () => {
		await clearStaffSession();
		router.push(`/${slug}/login`);
	};

	const timeStr = clock.toLocaleTimeString(undefined, {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	return (
		<div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
			<header className="sticky top-0 z-20 border-b border-tawla-deep/10 bg-white shadow-sm">
				<div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
					<div className="flex items-center gap-2 min-w-0 flex-1">
						<div className="flex size-11 items-center justify-center rounded-xl bg-tawla-deep text-white shadow-sm shrink-0">
							<ChefHat className="size-6" aria-hidden />
						</div>
						<div className="min-w-0">
							<h1 className="text-lg md:text-xl font-bold text-tawla-deep truncate">
								{restaurant?.name ?? "Kitchen"}
							</h1>
							<p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
								Kitchen display
							</p>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2 md:gap-3">
						<div
							className="tabular-nums text-xl md:text-2xl font-black text-tawla-deep bg-tawla-sky/15 border border-tawla-sky/30 rounded-xl px-4 py-2"
							suppressHydrationWarning
						>
							{timeStr}
						</div>

						<button
							type="button"
							onClick={handleArmSound}
							className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-sm border-2 transition-colors min-h-[44px]
                ${
									audioEnabled
										? "bg-tawla-sky/20 border-tawla-sky text-tawla-deep"
										: "bg-white border-tawla-deep/20 text-tawla-deep hover:bg-gray-50"
								}`}
						>
							<Volume2 className="size-5 shrink-0" aria-hidden />
							{audioEnabled ? "Sound on" : "Sound off"}
						</button>

						<Link
							href={`/${slug}/waiter`}
							className="inline-flex items-center justify-center rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 min-h-[44px] hover:bg-gray-50"
						>
							Waiter
						</Link>

						<button
							type="button"
							onClick={() => void handleSignOut()}
							className="inline-flex items-center gap-2 rounded-xl bg-white border-2 border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 min-h-[44px] hover:bg-rose-50 hover:border-rose-200"
						>
							<LogOut className="size-4" aria-hidden />
							Out
						</button>
					</div>
				</div>
			</header>

			{restaurant?.plan === "pro" &&
				restaurant.max_orders_monthly != null &&
				monthlyOrdersCount > restaurant.max_orders_monthly && (
					<div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
						<div className="font-bold">High Volume Detected</div>
						<div className="text-xs text-amber-800">
							This branch has processed {monthlyOrdersCount} orders this month on
							Pro. Move to Enterprise after {restaurant.max_orders_monthly} orders
							to unlock larger capacity and branch controls.
						</div>
					</div>
				)}

			<div className="flex flex-1 min-h-0">
				<main className="flex-1 min-w-0 p-4 md:p-6 overflow-y-auto">
					{loadError ? (
						<div className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-rose-800 font-semibold">
							{loadError}
						</div>
					) : null}

					{loading ? (
						<p className="text-center text-gray-500 font-medium py-16 text-lg">
							Loading kitchen queue…
						</p>
					) : orders.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-20 text-center px-4">
							<p className="text-2xl font-bold text-tawla-deep">All clear</p>
							<p className="text-gray-500 mt-2 max-w-md">
								New orders appear here instantly. Tap &quot;Start sound&quot; so
								you hear the next ticket.
							</p>
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
							{/* masonry support limited — use dense grid */}
							{orders.map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									onBump={() => void handleBump(order)}
									onUndoPrep={() => void handleRecall(order)}
									bumping={bumpingId === order.id}
									undoing={undoPrepId === order.id}
								/>
							))}
						</div>
					)}
				</main>

				<aside
					className={`border-s border-tawla-deep/10 bg-white shadow-[ -4px_0_24px_rgba(15,76,117,0.06)] transition-[width,opacity] duration-200 overflow-hidden flex flex-col
            ${sidebarOpen ? "w-[min(100vw,320px)] opacity-100" : "w-0 opacity-0 pointer-events-none"}`}
				>
					<div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2 min-w-[280px]">
						<div>
							<h2 className="text-sm font-black text-tawla-deep uppercase tracking-wide">
								Prep totals
							</h2>
							<p className="text-xs text-gray-500 font-medium">
								All active tickets
							</p>
						</div>
						<button
							type="button"
							onClick={() => setSidebarOpen(false)}
							className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
							aria-label="Collapse prep sidebar"
						>
							<ChevronRight className="size-5 text-gray-600" />
						</button>
					</div>
					<div className="flex-1 overflow-y-auto p-4 min-w-[280px] space-y-2">
						{prepTotals.length === 0 ? (
							<p className="text-sm text-gray-500">No items in queue.</p>
						) : (
							prepTotals.map((row) => (
								<div
									key={`${row.name}-${row.qty}`}
									className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5"
								>
									<span className="font-bold text-gray-800 leading-snug">
										{row.name}
									</span>
									<span className="text-xl font-black text-tawla-deep tabular-nums shrink-0">
										×{row.qty}
									</span>
								</div>
							))
						)}
					</div>
				</aside>
			</div>

			{!sidebarOpen ? (
				<button
					type="button"
					onClick={() => setSidebarOpen(true)}
					className="fixed bottom-6 end-6 z-30 flex items-center gap-2 rounded-full bg-tawla-deep text-white px-5 py-3 shadow-lg font-bold text-sm min-h-[48px] hover:bg-tawla-deep/90"
				>
					<ChevronLeft className="size-5" aria-hidden />
					Prep totals
				</button>
			) : null}

			{/* -- Initialization Overlay -- */}
			{!audioEnabled && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center bg-tawla-deep/95 backdrop-blur-md p-6">
					<div className="max-w-md w-full text-center space-y-8">
						<div className="flex justify-center">
							<div className="relative">
								<div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
								<div className="relative size-24 rounded-3xl bg-white flex items-center justify-center text-tawla-deep shadow-2xl">
									<ChefHat className="size-12" />
								</div>
							</div>
						</div>
						
						<div className="space-y-3">
							<h2 className="text-3xl font-black text-white">
								Ready for service?
							</h2>
							<p className="text-white/70 font-medium text-lg leading-relaxed">
								Click below to initialize the Kitchen Display and enable real-time audio alerts for new tickets.
							</p>
						</div>

						<button
							type="button"
							onClick={handleArmSound}
							className="group relative w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-5 text-xl font-black text-tawla-deep shadow-xl transition-all hover:scale-[1.02] active:scale-95"
						>
							<PlayCircle className="size-7" />
							Start Kitchen Display
						</button>

						<p className="text-white/40 text-sm font-bold uppercase tracking-widest">
							Tawla KDS System v2.0
						</p>
					</div>
				</div>
			)}
		</div>
	);
}
