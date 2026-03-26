"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Banknote,
	Bell,
	CheckCircle,
	CircleAlert,
	Clock,
	Hand,
	LogOut,
	PlayCircle,
	UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	clearTableServerSide,
	resolveWaiterCallServerSide,
	updateOrderStatusServerSide,
} from "@/app/actions/orders.actions";
import { useAudioAlert } from "@/hooks/useAudioAlert";
import { useRestaurantRealtime } from "@/hooks/useRestaurantRealtime";
import { useSmartPresence } from "@/hooks/useSmartPresence";
import { getRestaurantBySlugClient } from "@/lib/data/orders.client";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import type { OrderWithItems, Restaurant } from "@/types/database";

interface WaiterActiveOrder {
	id: string;
	table_id: string;
	status: string;
	tables: { table_number: number };
}

interface WaiterActiveCall {
	id: string;
	table_id: string;
	type: string;
	status: string;
	tables: { table_number: number };
}

const WAITER_ACTIVE_ORDER_STATUSES = [
	"in_kitchen",
	"ready",
	"delivered",
] as const;

const _supabase = createClient();

type TableStatus =
	| "empty"
	| "calling"
	| "pending"
	| "in_kitchen"
	| "food_ready"
	| "dining";
type StatusFilter = "all" | TableStatus;

interface TableWithStatus {
	id: string;
	table_number: number;
	status: TableStatus;
	callType?: "assistance" | "bill";
}

export default function WaiterDashboardPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const router = useRouter();
	const { slug } = React.use(params);
	// Anon client used only for READ operations (fetches, realtime). All writes go through Server Actions.
	const supabase = React.useMemo(() => createClient(), []);

	const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
	const [activeOrders, setActiveOrders] = useState<WaiterActiveOrder[]>([]);
	const [activeCalls, setActiveCalls] = useState<WaiterActiveCall[]>([]);
	const [physicalTables, setPhysicalTables] = useState<
		{ id: string; table_number: number }[]
	>([]);
	const [tableMap, setTableMap] = useState<Record<string, number>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [monthlyOrdersCount, setMonthlyOrdersCount] = useState(0);

	// Add Silent Smart Presence Tracker
	const staffId =
		typeof window !== "undefined" && restaurant?.id
			? localStorage.getItem(`tawla_staff_${restaurant.id}_waiter`)
			: null;
	useSmartPresence(staffId, restaurant?.id || null);

	// Modal State
	const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(
		null,
	);
	// Multiple orders (tickets) per table for multi-round ordering sessions
	const [tableOrders, setTableOrders] = useState<OrderWithItems[]>([]);
	const [isLoadingOrder, setIsLoadingOrder] = useState(false);
	const [isConfirming, setIsConfirming] = useState(false);
	const [isClearing, setIsClearing] = useState(false);
	const [isResolving, setIsResolving] = useState(false);
	const [isServing, setIsServing] = useState(false);

	// Custom Engine Hooks
	const { audioEnabled, enableAudio, playNotificationSound } = useAudioAlert();

	const loadData = React.useCallback(async () => {
		try {
			const restaurantData = await getRestaurantBySlugClient(slug);
			if (!restaurantData) {
				router.push("/");
				return;
			}

			const staffId = localStorage.getItem(
				`tawla_staff_${restaurantData.id}_waiter`,
			);
			if (!staffId) {
				router.push(`/${slug}/login`);
				return;
			}

			setRestaurant(restaurantData);

			if (restaurantData.plan === "pro") {
				const monthStart = new Date();
				monthStart.setDate(1);
				monthStart.setHours(0, 0, 0, 0);

				const { count: orderCount } = await supabase
					.from("orders")
					.select("id", { count: "exact", head: true })
					.eq("restaurant_id", restaurantData.id)
					.gte("created_at", monthStart.toISOString());

				setMonthlyOrdersCount(orderCount ?? 0);
			} else {
				setMonthlyOrdersCount(0);
			}

			let orders: any[] = [];
			let calls: any[] = [];
			const map: Record<string, number> = {};

			try {
				const { data: tablesData } = await supabase
					.from("tables")
					.select("id, table_number")
					.eq("restaurant_id", restaurantData.id);
				if (tablesData) {
					setPhysicalTables(tablesData);
					tablesData.forEach((t: { id: string; table_number: number }) => {
						map[t.id] = t.table_number;
					});
				}
			} catch (e) {
				logger.warn("Tables fetch soft fail", { error: e });
			}

			setTableMap(map);

			try {
				const { data: activeOrdersList, error: ordersError } = await supabase
					.from("orders")
					.select("id, table_id, status, tables!inner(table_number)")
					.eq("restaurant_id", restaurantData.id)
					.in("status", ["pending", ...WAITER_ACTIVE_ORDER_STATUSES]);

				if (!ordersError && activeOrdersList) orders = activeOrdersList;
			} catch (e) {
				logger.warn("Orders fetch soft fail", { error: e });
			}

			try {
				const { data: activeCallsList, error: callsError } = await supabase
					.from("waiter_calls")
					.select("id, table_id, type, status, tables!inner(table_number)")
					.eq("restaurant_id", restaurantData.id)
					.eq("status", "active");

				if (!callsError && activeCallsList) calls = activeCallsList;
			} catch (e) {
				logger.warn("Calls fetch soft fail", { error: e });
			}

			setActiveOrders(orders);
			setActiveCalls(calls);
		} catch (error) {
			logger.error("Error loading server data:", error);
		} finally {
			setIsLoading(false);
		}
	}, [slug, router, supabase.from]);

	const tables = React.useMemo(() => {
		const dynamicTables: TableWithStatus[] = [];
		if (physicalTables.length === 0) return dynamicTables;

		const sortedTables = [...physicalTables].sort(
			(a, b) => a.table_number - b.table_number,
		);

		for (const pt of sortedTables) {
			const i = pt.table_number;
			let status: TableStatus = "empty";
			const getTableNum = (item: any) =>
				item.tables?.table_number || tableMap[item.table_id];
			const currentCalls = activeCalls.filter(
				(c: any) => Number(getTableNum(c)) === i && c.status === "active",
			);
			const currentOrders = activeOrders.filter(
				(o: any) =>
					Number(getTableNum(o)) === i &&
					["pending", ...WAITER_ACTIVE_ORDER_STATUSES].includes(o.status),
			);

			let callType: "assistance" | "bill" | undefined;
			if (currentCalls.length > 0) {
				status = "calling";
				callType = currentCalls[0].type as "assistance" | "bill";
			} else if (currentOrders.some((o: any) => o.status === "ready")) {
				status = "food_ready";
			} else if (currentOrders.some((o: any) => o.status === "in_kitchen")) {
				status = "in_kitchen";
			} else if (currentOrders.some((o: any) => o.status === "pending")) {
				status = "pending";
			} else if (currentOrders.length > 0) {
				status = "dining";
			}

			dynamicTables.push({
				id: String(i),
				table_number: i,
				status,
				callType,
			});
		}
		return dynamicTables;
	}, [physicalTables, activeOrders, activeCalls, tableMap]);

	const filteredTables = React.useMemo(() => {
		if (statusFilter === "all") return tables;
		return tables.filter((t) => t.status === statusFilter);
	}, [tables, statusFilter]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useRestaurantRealtime(restaurant?.id, {
		onOrderChange: React.useCallback(
			(payload: any) => {
				if (
					restaurant?.plan === "pro" &&
					payload.eventType === "INSERT" &&
					payload.new?.created_at
				) {
					const createdAt = new Date(payload.new.created_at);
					const monthStart = new Date();
					monthStart.setDate(1);
					monthStart.setHours(0, 0, 0, 0);
					if (createdAt >= monthStart) {
						setMonthlyOrdersCount((prev) => prev + 1);
					}
				}
				if (payload.eventType === "INSERT") playNotificationSound();
				if (
					payload.eventType === "UPDATE" &&
					payload.new?.status === "ready" &&
					payload.old?.status !== "ready"
				) {
					playNotificationSound();
				}
				setActiveOrders((prev) => {
					if (payload.eventType === "INSERT")
						return [payload.new as WaiterActiveOrder, ...prev];
					if (payload.eventType === "UPDATE") {
						const exists = prev.some((o) => o.id === payload.new.id);
						if (exists)
							return prev.map((o) =>
								o.id === payload.new.id ? { ...o, ...payload.new } : o,
							);
						return [payload.new as WaiterActiveOrder, ...prev];
					}
					if (payload.eventType === "DELETE")
						return prev.filter((o) => o.id !== payload.old.id);
					return prev;
				});
			},
			[playNotificationSound, restaurant?.plan],
		),

		onCallChange: React.useCallback(
			(payload: any) => {
				if (payload.eventType === "INSERT") playNotificationSound();
				setActiveCalls((prev) => {
					if (payload.eventType === "INSERT")
						return [payload.new as WaiterActiveCall, ...prev];
					if (payload.eventType === "UPDATE") {
						const exists = prev.some((c) => c.id === payload.new.id);
						if (exists)
							return prev.map((c) =>
								c.id === payload.new.id ? { ...c, ...payload.new } : c,
							);
						return [payload.new as WaiterActiveCall, ...prev];
					}
					if (payload.eventType === "DELETE")
						return prev.filter((c) => c.id !== payload.old.id);
					return prev;
				});
			},
			[playNotificationSound],
		),

		onRestaurantChange: React.useCallback((payload: any) => {
			setRestaurant((prev) => ({ ...(prev as any), ...(payload.new as any) }));
		}, []),
	});

	const _getOrderTableNum = (o: any): string =>
		String(o.tables?.table_number ?? tableMap[o.table_id] ?? "");

	const handleTableClick = async (table: TableWithStatus) => {
		const clickedTableNum = String(table.table_number);

		setSelectedTable(table);
		setTableOrders([]);

		if (table.status === "empty") return;

		setIsLoadingOrder(true);

		try {
			const tableUuid = Object.keys(tableMap).find(
				(key) => String(tableMap[key]) === clickedTableNum,
			);

			if (!tableUuid) {
				setIsLoadingOrder(false);
				return;
			}

			const allActiveStatuses = [
				"pending",
				...WAITER_ACTIVE_ORDER_STATUSES,
			] as string[];

			// Fetch ALL active orders for this table to support multi-round ordering
			const { data: ordersData, error } = await supabase
				.from("orders")
				.select(`*, items:order_items(*, menu_item:menu_items(*))`)
				.eq("table_id", tableUuid)
				.in("status", allActiveStatuses)
				.order("created_at", { ascending: true });

			if (error) throw error;
			setTableOrders((ordersData as unknown as OrderWithItems[]) || []);
		} catch (e: any) {
			console.error("Failed to fetch table orders:", e.message || e);
			toast.error("Could not load table details.");
		} finally {
			setIsLoadingOrder(false);
		}
	};

	const handleConfirmOrder = async () => {
		if (!selectedTable || !restaurant?.id) return;
		setIsConfirming(true);

		const pendingOrderIds = tableOrders
			.filter((o) => o.status === "pending")
			.map((o) => o.id);

		if (pendingOrderIds.length === 0) {
			toast.error("No pending orders to confirm for this table");
			setIsConfirming(false);
			return;
		}

		try {
			const results = await Promise.all(
				pendingOrderIds.map((id) =>
					updateOrderStatusServerSide(id, "in_kitchen", restaurant.id),
				),
			);

			const failed = results.filter((r) => !r.ok);
			if (failed.length > 0) {
				toast.error(failed[0]?.error ?? "Failed to confirm order");
				return;
			}

			posthog.capture("waiter_order_confirmed", {
				table_number: selectedTable?.table_number,
				order_ids: pendingOrderIds,
				restaurant_slug: slug,
			});
			toast.success(
				`${pendingOrderIds.length > 1 ? `${pendingOrderIds.length} orders` : "Order"} moved to preparing`,
			);
			setSelectedTable(null);
			setTableOrders([]);
		} catch (e) {
			logger.error("Confirm failed", e);
			toast.error("Failed to confirm order");
		} finally {
			setIsConfirming(false);
		}
	};

	const handleClearTable = async () => {
		if (!selectedTable || !restaurant?.id) return;

		const confirmClear = window.confirm(
			`Are you sure you want to completely clear Table ${selectedTable.table_number}?`,
		);
		if (!confirmClear) return;

		const clickedTableNum = String(selectedTable.table_number);
		setSelectedTable(null);
		setTableOrders([]);
		setIsClearing(true);

		try {
			const tableUuid = Object.keys(tableMap).find(
				(key) => String(tableMap[key]) === clickedTableNum,
			);

			if (tableUuid) {
				const result = await clearTableServerSide(tableUuid, restaurant.id);
				if (!result.ok) {
					toast.error(result.error ?? "Failed to clear table");
					return;
				}
			}

			toast.success("Table cleared");
		} catch (e) {
			logger.error("Clear table failed", e);
			toast.error("Failed to clear table");
		} finally {
			setIsClearing(false);
		}
	};

	const handleMarkServed = async () => {
		if (!restaurant?.id) return;
		setIsServing(true);
		try {
			const readyOrders = tableOrders.filter((o) => o.status === "ready");
			const results = await Promise.all(
				readyOrders.map((o) =>
					updateOrderStatusServerSide(o.id, "delivered", restaurant.id),
				),
			);
			const failed = results.filter((r) => !r.ok);
			if (failed.length > 0) {
				toast.error(failed[0]?.error ?? "Failed to mark as served");
				return;
			}
			setTableOrders((prev) =>
				prev.map((o) =>
					o.status === "ready" ? { ...o, status: "delivered" } : o,
				),
			);
			toast.success("Marked as served!");
		} catch (e) {
			logger.error("Failed to mark as served", e);
			toast.error("Failed to mark as served");
		} finally {
			setIsServing(false);
		}
	};

	const handleResolveCall = async () => {
		if (!selectedTable || !restaurant?.id) return;
		setIsResolving(true);
		const clickedTableNum = String(selectedTable.table_number);
		try {
			const tableUuid = Object.keys(tableMap).find(
				(key) => String(tableMap[key]) === clickedTableNum,
			);
			if (tableUuid) {
				const result = await resolveWaiterCallServerSide(
					tableUuid,
					restaurant.id,
				);
				if (!result.ok) {
					toast.error(result.error ?? "Failed to resolve call");
					return;
				}
			}
			posthog.capture("waiter_call_resolved", {
				table_number: selectedTable.table_number,
				restaurant_slug: slug,
			});
			toast.success(`Resolved call for Table ${selectedTable.table_number}`);
			setSelectedTable(null);
			setTableOrders([]);
		} catch (e) {
			logger.error("Failed to resolve call:", e);
			toast.error("Failed to resolve call");
		} finally {
			setIsResolving(false);
		}
	};

	// -- Status helpers --
	const statusCounts = React.useMemo(() => {
		const counts = {
			calling: 0,
			pending: 0,
			in_kitchen: 0,
			food_ready: 0,
			dining: 0,
			empty: 0,
		};
		tables.forEach((t) => {
			counts[t.status]++;
		});
		return counts;
	}, [tables]);

	const getCardStyle = (status: TableStatus) => {
		switch (status) {
			case "calling":
				return "bg-red-50 border-red-400 text-red-700 shadow-[0_0_20px_rgba(248,113,113,0.4)]";
			case "pending":
				return "bg-[#E8F4FD] border-[#3282B8] text-[#0F4C75]";
			case "in_kitchen":
				return "bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-300";
			case "food_ready":
				return "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-[0_0_0_3px_rgba(16,185,129,0.45)] ring-2 ring-emerald-400 animate-pulse";
			case "dining":
				return "bg-[#F0F9FF] border-[#0F4C75] text-[#0F4C75]";
			default:
				return "bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]";
		}
	};

	const getStatusLabel = (
		status: TableStatus,
		callType?: "assistance" | "bill",
	) => {
		switch (status) {
			case "calling":
				return (
					<span className="flex items-center justify-center gap-1 text-[10px]">
						{callType === "bill" ? <Banknote size={12} /> : <Hand size={12} />}
						<span>{callType === "bill" ? "Bill" : "Assist"}</span>
					</span>
				);
			case "pending":
				return "New Order";
			case "in_kitchen":
				return "Preparing";
			case "food_ready":
				return "🔔 Food Ready!";
			case "dining":
				return "Seated";
			default:
				return "Empty";
		}
	};

	// -- Render --
	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#F5F7FA]">
				<div className="bg-gradient-to-r from-[#0F4C75] to-[#3282B8] px-5 pt-12 pb-5">
					<div className="animate-pulse space-y-2">
						<div className="h-5 w-40 rounded-lg bg-white/30" />
						<div className="h-3 w-28 rounded bg-white/20" />
					</div>
				</div>
				<div className="px-4 pt-4 flex gap-2">
					{[1, 2, 3, 4].map((i) => (
						<div
							key={i}
							className="h-8 w-20 rounded-full bg-gray-200 animate-pulse"
						/>
					))}
				</div>
				<div className="grid grid-cols-3 gap-3 p-4">
					{Array.from({ length: 9 }).map((_, i) => (
						<div
							key={i}
							className="aspect-square rounded-2xl bg-white border border-gray-200 animate-pulse"
						/>
					))}
				</div>
			</div>
		);
	}

	const filterOptions: {
		value: StatusFilter;
		label: React.ReactNode;
		count: number;
		color: string;
	}[] = [
		{
			value: "all",
			label: "All",
			count: tables.length,
			color: "bg-[#0F4C75] text-white",
		},
		{
			value: "calling",
			label: (
				<span className="flex items-center gap-1">
					<CircleAlert size={14} /> Calls
				</span>
			),
			count: statusCounts.calling,
			color: "bg-red-500 text-white",
		},
		{
			value: "pending",
			label: (
				<span className="flex items-center gap-1">
					<Clock size={14} /> Pending
				</span>
			),
			count: statusCounts.pending,
			color: "bg-[#3282B8] text-white",
		},
		{
			value: "in_kitchen",
			label: (
				<span className="flex items-center gap-1">
					<UtensilsCrossed size={14} /> Preparing
				</span>
			),
			count: statusCounts.in_kitchen,
			color: "bg-amber-500 text-white",
		},
		{
			value: "food_ready",
			label: (
				<span className="flex items-center gap-1">
					<Bell size={14} /> Ready
				</span>
			),
			count: statusCounts.food_ready,
			color: "bg-emerald-500 text-white",
		},
		{
			value: "dining",
			label: (
				<span className="flex items-center gap-1">
					<PlayCircle size={14} /> Seated
				</span>
			),
			count: statusCounts.dining,
			color: "bg-teal-500 text-white",
		},
	];

	return (
		<div className="min-h-screen bg-[#F5F7FA] pb-6">
			{/* ── Brand Header ── */}
			<header className="bg-gradient-to-r from-[#0F4C75] to-[#3282B8] px-5 pt-12 pb-5 relative">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-bold text-white tracking-tight">
							{restaurant?.name}
						</h1>
						<div className="flex items-center gap-1.5 mt-0.5">
							<span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
							<span className="text-xs text-white/70 font-medium">
								Live Dashboard
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								localStorage.removeItem(`tawla_staff_${restaurant?.id}_waiter`);
								router.push(`/${slug}/waiter/login`);
							}}
							className="w-10 h-10 rounded-full flex items-center justify-center bg-white/15 text-white hover:bg-white/25 transition-colors"
							title="Logout"
						>
							<LogOut size={18} />
						</button>
					</div>
				</div>
			</header>

			{/* ── Audio Setup Banner ── */}
			<AnimatePresence>
				{!audioEnabled && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						exit={{ opacity: 0, height: 0 }}
						className="bg-[#E8F4FD] border-b border-[#BBE1FA] px-5 py-3 flex items-center justify-between"
					>
						<span className="text-xs text-[#0F4C75] font-medium">
							Enable sound alerts for new orders?
						</span>
						<button
							onClick={enableAudio}
							className="px-4 py-2 bg-[#0F4C75] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 min-h-[44px]"
						>
							Turn On <Bell size={14} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			{restaurant?.plan === "pro" &&
				restaurant.max_orders_monthly != null &&
				monthlyOrdersCount >= restaurant.max_orders_monthly && (
					<div className="border-b border-[#F9D7AE] bg-[#FFF4E8] px-5 py-3">
						<div className="flex items-center gap-2 text-sm font-semibold text-[#A15C17]">
							<CircleAlert size={16} />
							High Volume Detected
						</div>
						<p className="mt-1 text-xs leading-5 text-[#8A5A26]">
							You&apos;ve processed {monthlyOrdersCount} orders this month on
							Pro. Enterprise is recommended after{" "}
							{restaurant.max_orders_monthly} orders for busier operations.
						</p>
					</div>
				)}

			{/* ── Status Filter Pills ── */}
			<div className="px-4 pt-4 pb-2 overflow-x-auto">
				<div className="flex gap-2 min-w-max">
					{filterOptions.map((opt) => (
						<button
							key={opt.value}
							onClick={() => setStatusFilter(opt.value)}
							className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
								statusFilter === opt.value
									? `${opt.color} shadow-md`
									: "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#CBD5E1]"
							}`}
						>
							{opt.label}
							<span
								className={`min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
									statusFilter === opt.value
										? "bg-white/25 text-white"
										: "bg-[#F1F5F9] text-[#64748B]"
								}`}
							>
								{opt.count}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* ── Tables Grid ── */}
			<main className="px-4 pt-2">
				{filteredTables.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-[#94A3B8]">
						<UtensilsCrossed size={40} className="mb-3 opacity-50" />
						<p className="text-sm font-medium">No tables match this filter</p>
					</div>
				) : (
					<div className="grid grid-cols-3 gap-3">
						{filteredTables.map((table, index) => (
							<motion.button
								key={`table-${table.table_number}`}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: index * 0.03 }}
								whileTap={{ scale: 0.93 }}
								className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all
                  ${getCardStyle(table.status)}
                  ${table.status === "calling" ? "animate-pulse" : ""}
                `}
								onClick={() => handleTableClick(table)}
							>
								{table.status === "calling" && (
									<span className="absolute top-2 end-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
								)}
								{table.status === "pending" && (
									<span className="absolute top-2 end-2 w-2 h-2 bg-[#3282B8] rounded-full animate-pulse" />
								)}
								<span className="text-2xl font-black">
									{table.table_number}
								</span>
								<span className="text-[10px] font-semibold uppercase tracking-wide mt-1 text-center leading-tight">
									{getStatusLabel(table.status, table.callType)}
								</span>
							</motion.button>
						))}
					</div>
				)}
			</main>

			{/* ── Slide-up Modal ── */}
			<AnimatePresence>
				{selectedTable && (
					<motion.div
						key={`backdrop-${selectedTable?.table_number}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={() => setSelectedTable(null)}
						className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
					/>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{selectedTable && (
					<motion.div
						key={`drawer-${selectedTable?.table_number}`}
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 300 }}
						className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[2rem] max-h-[85vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.15)]"
					>
						{/* Drawer Handle */}
						<div className="flex justify-center pt-3 pb-1">
							<div className="w-10 h-1 rounded-full bg-[#E2E8F0]" />
						</div>

						{/* Drawer Header */}
						<div className="flex-shrink-0 flex items-center justify-between px-6 pb-4 border-b border-[#F1F5F9]">
							<div>
								<h3 className="text-2xl font-black text-[#0A1628]">
									Table {selectedTable.table_number}
								</h3>
								<p className="text-sm text-[#64748B] mt-0.5 uppercase tracking-wider font-semibold">
									{selectedTable.status === "calling"
										? "Waiter Call"
										: selectedTable.status === "pending"
											? "Review Order"
											: "Active Order"}
								</p>
							</div>
							<button
								onClick={() => setSelectedTable(null)}
								className="w-10 h-10 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#E2E8F0] transition-colors"
							>
								✕
							</button>
						</div>

						{/* Drawer Body */}
						<div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
							{selectedTable.status === "empty" ? (
								<div className="flex flex-col items-center justify-center py-10 space-y-4">
									<div className="w-20 h-20 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#94A3B8]">
										<UtensilsCrossed size={40} />
									</div>
									<div className="text-center">
										<p className="text-lg font-bold text-[#0A1628]">
											Currently Empty
										</p>
										<p className="text-sm text-[#64748B]">
											No active session for this table
										</p>
									</div>
								</div>
							) : (
								selectedTable.status === "calling" && (
									<motion.div
										initial={{ opacity: 0, y: -8 }}
										animate={{ opacity: 1, y: 0 }}
										className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4"
									>
										<div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 text-red-500">
											{selectedTable.callType === "bill" ? (
												<Banknote size={24} />
											) : (
												<Hand size={24} />
											)}
										</div>
										<div>
											<p className="text-xs font-bold text-red-800 uppercase tracking-wide">
												Guest Requested
											</p>
											<p className="text-base font-bold text-red-700 mt-0.5">
												{selectedTable.callType === "bill"
													? "Bill / Check"
													: "Assistance"}
											</p>
										</div>
									</motion.div>
								)
							)}

							{selectedTable.status !== "empty" &&
								(isLoadingOrder ? (
									<div className="flex justify-center py-10">
										<div className="animate-spin w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full" />
									</div>
								) : tableOrders.length === 0 ? (
									selectedTable.status !== "calling" && (
										<div className="text-center py-10 text-[#94A3B8]">
											No active ticket found for this table.
										</div>
									)
								) : (
									<>
										<div className="space-y-3">
											{(tableOrders[0]?.items || []).map((item: any) => (
												<div
													key={`item-${item.id}`}
													className="flex gap-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl"
												>
													<div className="w-12 h-12 bg-[#E8F4FD] rounded-xl flex items-center justify-center font-bold text-[#0F4C75] text-lg flex-shrink-0">
														x{item.quantity}
													</div>
													<div className="flex-1 pt-1">
														<p className="font-bold text-[#0A1628] leading-tight">
															{item.menu_item?.name_en || "Unknown Item"}
														</p>
														{item.special_requests && (
															<p className="text-xs text-red-500 font-medium mt-1">
																Note: {item.special_requests}
															</p>
														)}
													</div>
												</div>
											))}
										</div>

										{tableOrders[0]?.special_requests && (
											<div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
												<p className="text-xs font-bold text-amber-800 uppercase mb-1">
													Table Note
												</p>
												<p className="text-sm text-amber-900">
													{tableOrders[0]?.special_requests}
												</p>
											</div>
										)}

										<div className="flex justify-between items-center py-4 px-2 border-t-2 border-dashed border-[#E2E8F0]">
											<span className="font-bold text-[#64748B]">
												Total Value
											</span>
											<span
												className="text-2xl font-black text-[#0F4C75]"
												style={{ direction: "ltr" }}
											>
												{tableOrders
													.reduce((s, o) => s + Number(o.total_amount), 0)
													.toFixed(3)}{" "}
												KD
											</span>
										</div>
									</>
								))}
						</div>

						{/* ── Action Footer ── */}
						{selectedTable.status === "empty" && (
							<div
								className="px-6 py-5 bg-white border-t border-[#F1F5F9] flex flex-col gap-3"
								style={{
									paddingBottom: "max(20px, env(safe-area-inset-bottom))",
								}}
							>
								<button
									onClick={() => {
										router.push(
											`/${slug}/menu?table=${selectedTable.table_number}&waiter_mode=true`,
										);
									}}
									className="w-full h-14 bg-[#0F4C75] rounded-2xl text-white font-bold text-lg flex justify-center items-center gap-2 transition-transform active:scale-95 active:bg-[#0A3558]"
								>
									<span>Take Order</span>
									<PlayCircle size={20} />
								</button>
							</div>
						)}

						{selectedTable.status === "calling" && (
							<div
								className="px-6 py-5 bg-white border-t border-[#F1F5F9] flex flex-col gap-3"
								style={{
									paddingBottom: "max(20px, env(safe-area-inset-bottom))",
								}}
							>
								<button
									onClick={handleResolveCall}
									disabled={isResolving}
									className="w-full h-14 bg-[#0F4C75] rounded-2xl text-white font-bold text-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95 active:bg-[#0A3558]"
								>
									{isResolving ? (
										<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
									) : (
										<>
											<span>Resolve Call</span>
											<CheckCircle size={20} />
										</>
									)}
								</button>
							</div>
						)}
						{tableOrders.some((o) => o.status === "pending") &&
							selectedTable.status === "pending" && (
								<div
									className="px-6 py-5 bg-white border-t border-[#F1F5F9] flex flex-col gap-3"
									style={{
										paddingBottom: "max(20px, env(safe-area-inset-bottom))",
									}}
								>
									<button
										onClick={handleConfirmOrder}
										disabled={isConfirming || isClearing}
										className="w-full h-14 bg-[#0F4C75] rounded-2xl text-white font-bold text-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95 active:bg-[#0A3558]"
									>
										{isConfirming ? (
											<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
										) : (
											<>
												<span>Confirm & Start Preparing</span>
												<CheckCircle size={20} />
											</>
										)}
									</button>
									<button
										onClick={handleClearTable}
										disabled={isClearing || isConfirming}
										className="w-full h-12 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95"
									>
										{isClearing ? (
											<span className="animate-pulse">Clearing...</span>
										) : (
											<span>Clear Table (Cancel All)</span>
										)}
									</button>
								</div>
							)}
						{tableOrders.some((o) => o.status === "ready") &&
							selectedTable.status === "food_ready" && (
								<div
									className="px-6 py-5 bg-white border-t border-[#F1F5F9] flex flex-col gap-3"
									style={{
										paddingBottom: "max(20px, env(safe-area-inset-bottom))",
									}}
								>
									<button
										onClick={handleMarkServed}
										disabled={isServing}
										className="w-full h-14 bg-emerald-600 rounded-2xl text-white font-bold text-lg flex justify-center items-center gap-2 transition-transform active:scale-95 hover:bg-emerald-700"
									>
										{isServing ? "Updating..." : "Mark as Served (Pickup Food)"}
										<CheckCircle size={20} />
									</button>
								</div>
							)}
						{tableOrders.length > 0 &&
							["in_kitchen", "dining", "food_ready"].includes(
								selectedTable.status,
							) && (
								<div
									className="px-6 py-5 bg-white border-t border-[#F1F5F9]"
									style={{
										paddingBottom: "max(20px, env(safe-area-inset-bottom))",
									}}
								>
									<button
										onClick={handleClearTable}
										disabled={isClearing}
										className="w-full h-12 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95"
									>
										{isClearing ? (
											<span className="animate-pulse">Clearing...</span>
										) : (
											<span>Clear Table (Cancel Session)</span>
										)}
									</button>
								</div>
							)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
