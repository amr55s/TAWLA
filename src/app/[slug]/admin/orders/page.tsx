"use client";

import { motion } from "framer-motion";
import { Clock, Filter, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";

type OrderStatus =
	| "pending"
	| "in_kitchen"
	| "ready"
	| "delivered"
	| "paid"
	| "cancelled";

interface Order {
	id: string;
	table_id: string;
	status: OrderStatus;
	total_amount: number | null;
	created_at: string;
	items?: Array<{
		id: string;
		order_id: string;
		menu_item_id: string;
		quantity: number;
		price_at_time: number | null;
		menu_item?: {
			id: string;
			name_en: string;
			name_ar: string;
		} | null;
	}>;
	tables?: { table_number: number } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
	pending: { label: "Pending", color: "bg-amber-50 text-amber-600" },
	confirmed: { label: "Confirmed", color: "bg-blue-50 text-[#3282B8]" },
	confirmed_by_waiter: {
		label: "Confirmed",
		color: "bg-blue-50 text-[#3282B8]",
	},
	preparing: { label: "Preparing", color: "bg-amber-50 text-amber-600" },
	in_kitchen: { label: "In Kitchen", color: "bg-amber-50 text-amber-600" },
	ready: { label: "Ready", color: "bg-sky-50 text-sky-600" },
	served: { label: "Served", color: "bg-sky-50 text-sky-600" },
	completed: { label: "Completed", color: "bg-[#0F4C75]/10 text-[#0F4C75]" },
	paid: { label: "Paid", color: "bg-gray-50 text-[#5A6B82]" },
	cancelled: { label: "Cancelled", color: "bg-red-50 text-red-500" },
};

const supabase = createClient();

export default function AdminOrdersPage() {
	const { restaurantId, loading: restLoading } = useRestaurant();
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<string>("all");
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const fetchOrders = useCallback(async () => {
		if (!restaurantId) return;
		setLoading(true);
		const { data, error } = await supabase
			.from("orders")
			.select("*, tables(table_number)")
			.eq("restaurant_id", restaurantId)
			.order("created_at", { ascending: false })
			.limit(50);

		if (error) {
			console.error("Orders fetch error:", error);
		}
		setOrders((data as Order[]) || []);
		setLoading(false);
	}, [supabase, restaurantId]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	// Realtime subscription
	useEffect(() => {
		if (!mounted || !restaurantId) return;
		const channel = supabase
			.channel("admin-orders-realtime")
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "orders",
					filter: `restaurant_id=eq.${restaurantId}`,
				},
				() => {
					fetchOrders();
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [mounted, supabase, fetchOrders, restaurantId]);

	const filteredOrders =
		filter === "all" ? orders : orders.filter((o) => o.status === filter);

	const filters = [
		"all",
		"pending",
		"in_kitchen",
		"ready",
		"delivered",
		"paid",
		"cancelled",
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 className="text-xl font-bold text-[#0A1628] tracking-tight">
						Orders
					</h1>
					<p className="text-xs text-[#7B8BA3] mt-1" suppressHydrationWarning>
						<Clock size={12} className="inline mr-1" />
						{mounted ? `${orders.length} total orders` : "Loading..."}
					</p>
				</div>
				<button
					onClick={fetchOrders}
					className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E8ECF1] text-sm font-medium text-[#5A6B82] hover:bg-[#F0F4F8] transition-colors"
				>
					<RefreshCw size={14} /> Refresh
				</button>
			</div>

			{/* Filters */}
			<div className="flex items-center gap-2 overflow-x-auto pb-1">
				<Filter size={14} className="text-[#B0B8C4] shrink-0" />
				{filters.map((f) => (
					<button
						key={f}
						onClick={() => setFilter(f)}
						className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${filter === f
								? "bg-[#0F4C75] text-white shadow-sm"
								: "bg-white border border-[#E8ECF1] text-[#5A6B82] hover:border-[#3282B8]/40"
							}`}
					>
						{f}
					</button>
				))}
			</div>

			{/* Orders Table */}
			{loading || restLoading ? (
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
				</div>
			) : filteredOrders.length === 0 ? (
				<div className="bg-white rounded-2xl border border-[#E8ECF1] p-12 text-center">
					<p className="text-sm text-[#7B8BA3]">
						No orders found{filter !== "all" ? ` with status "${filter}"` : ""}.
					</p>
				</div>
			) : (
				<div className="bg-white rounded-2xl border border-[#E8ECF1] overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b border-[#F0F4F8]">
									<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider px-6 py-3">
										Order
									</th>
									<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider px-6 py-3">
										Table
									</th>
									<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider px-6 py-3">
										Items
									</th>
									<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider px-6 py-3">
										Total
									</th>
									<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider px-6 py-3">
										Status
									</th>
									<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider px-6 py-3">
										Time
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredOrders.map((order) => {
									const sc =
										STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
									return (
										<motion.tr
											key={order.id}
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											className="border-b border-[#F8FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors"
										>
											<td className="px-6 py-3.5 text-xs font-bold text-[#0A1628]">
												#{order.id.slice(0, 6)}
											</td>
											<td className="px-6 py-3.5 text-xs text-[#5A6B82] font-medium">
												T-{order.tables?.table_number ?? "?"}
											</td>
											<td className="px-6 py-3.5 text-xs text-[#5A6B82]">
												{Array.isArray(order.items) ? order.items.length : 0}
											</td>
											<td className="px-6 py-3.5 text-xs font-semibold text-[#0A1628]">
												{order.total_amount != null
													? `${order.total_amount.toFixed(2)}`
													: "—"}
											</td>
											<td className="px-6 py-3.5">
												<span
													className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.color}`}
												>
													{sc.label}
												</span>
											</td>
											<td
												className="px-6 py-3.5 text-xs text-[#7B8BA3]"
												suppressHydrationWarning
											>
												{mounted
													? new Date(order.created_at).toLocaleTimeString(
														"en-US",
														{ hour: "2-digit", minute: "2-digit" },
													)
													: ""}
											</td>
										</motion.tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}