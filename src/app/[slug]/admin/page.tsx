"use client";

import { motion } from "framer-motion";
import {
	ArrowUpRight,
	Clock,
	DollarSign,
	ShoppingBag,
	TrendingDown,
	TrendingUp,
	Utensils,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";

/* ═══════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════ */
function StatCard({
	title,
	value,
	change,
	trend,
	icon: Icon,
	iconBg,
	loading,
}: {
	title: string;
	value: string | number;
	change?: string;
	trend?: "up" | "down";
	icon: React.ElementType;
	iconBg: string;
	loading?: boolean;
}) {
	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-shadow duration-300">
			<div className="flex items-start justify-between mb-4">
				<div
					className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
				>
					<Icon size={20} className="text-current" />
				</div>
				{!loading && change && (
					<div
						className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
							trend === "up"
								? "bg-sky-50 text-sky-600"
								: "bg-red-50 text-red-500"
						}`}
					>
						{trend === "up" ? (
							<TrendingUp size={12} />
						) : (
							<TrendingDown size={12} />
						)}
						{change}
					</div>
				)}
			</div>
			{loading ? (
				<div className="h-8 w-24 bg-[#F0F4F8] rounded animate-pulse mb-1" />
			) : (
				<p className="text-[26px] font-bold text-[#0A1628] tracking-tight mb-1">
					{value}
				</p>
			)}
			<p className="text-xs text-[#7B8BA3] font-medium">{title}</p>
		</div>
	);
}

/* ═══════════════════════════════════════════════════
   BAR CHART
   ═══════════════════════════════════════════════════ */
function BarChartCard({
	data,
	loading,
}: {
	data: { label: string; h: number; value: number }[];
	loading: boolean;
}) {
	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Revenue Trends</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						Revenue over last 6 months
					</p>
				</div>
			</div>
			{loading ? (
				<div className="flex flex-1 items-center justify-center min-h-[180px]">
					<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
				</div>
			) : data.length === 0 || data.every((d) => d.value === 0) ? (
				<div className="flex flex-1 items-center justify-center text-sm text-[#7B8BA3] min-h-[180px]">
					No revenue data available
				</div>
			) : (
				<div className="flex items-end justify-between gap-2 h-[180px] mt-auto">
					{data.map((bar) => (
						<div
							key={bar.label}
							className="flex-1 flex flex-col items-center gap-2 group relative"
						>
							<div className="absolute -top-8 bg-[#0A1628] text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
								${bar.value.toFixed(2)}
							</div>
							<motion.div
								initial={{ height: 0 }}
								animate={{ height: `${bar.h}%` }}
								transition={{ duration: 0.6, delay: 0.1 }}
								className="w-full rounded-t-md bg-gradient-to-t from-[#0F4C75] to-[#3282B8] min-h-[4px]"
							/>
							<span className="text-[9px] text-[#B0B8C4] font-medium">
								{bar.label}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

/* ═══════════════════════════════════════════════════
   DONUT CHART
   ═══════════════════════════════════════════════════ */
function DonutChartCard({
	segments,
	total,
	loading,
}: {
	segments: { label: string; pct: number; color: string }[];
	total: number;
	loading: boolean;
}) {
	let gradient = "";
	if (segments.length > 0) {
		let currentPct = 0;
		const gradientStops = segments.map((seg) => {
			const start = currentPct;
			const end = currentPct + seg.pct;
			currentPct = end;
			return `${seg.color} ${start}% ${end}%`;
		});
		gradient = `conic-gradient(${gradientStops.join(", ")})`;
	} else {
		gradient = `conic-gradient(#E8ECF1 0% 100%)`;
	}

	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Order Status</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						Breakdown of all orders
					</p>
				</div>
			</div>

			{loading ? (
				<div className="flex flex-1 items-center justify-center min-h-[140px]">
					<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
				</div>
			) : total === 0 ? (
				<div className="flex flex-1 items-center justify-center text-sm text-[#7B8BA3] min-h-[140px]">
					No orders recorded
				</div>
			) : (
				<div className="flex flex-col xl:flex-row items-center gap-8 mt-auto xl:mt-2">
					<div className="relative w-[140px] h-[140px] shrink-0">
						<div
							className="w-full h-full rounded-full"
							style={{ background: gradient }}
						/>
						<div className="absolute inset-[25%] rounded-full bg-white flex items-center justify-center shadow-inner">
							<div className="text-center">
								<p className="text-lg font-bold text-[#0A1628]">{total}</p>
								<p className="text-[9px] text-[#7B8BA3] font-medium uppercase tracking-wider">
									Total
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-3 flex-1 w-full">
						{segments.map((seg) => (
							<div
								key={seg.label}
								className="flex items-center justify-between"
							>
								<div className="flex items-center gap-2.5">
									<div
										className="w-2.5 h-2.5 rounded-full shadow-sm"
										style={{ background: seg.color }}
									/>
									<span className="text-xs text-[#5A6B82] font-medium capitalize">
										{seg.label}
									</span>
								</div>
								<span className="text-xs font-bold text-[#0A1628]">
									{seg.pct}%
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

/* ═══════════════════════════════════════════════════
   RECENT ORDERS TABLE
   ═══════════════════════════════════════════════════ */
function RecentOrdersCard({
	orders,
	loading,
	slug,
}: {
	orders: any[];
	loading: boolean;
	slug: string;
}) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-gray-50 text-[#5A6B82]";
			case "completed":
				return "bg-blue-50 text-[#3282B8]";
			case "served":
				return "bg-sky-50 text-sky-600";
			default:
				return "bg-amber-50 text-amber-600";
		}
	};

	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Recent Orders</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						Latest activity across tables
					</p>
				</div>
				<Link
					href={`/${slug}/admin/orders`}
					className="flex items-center gap-1.5 text-xs font-semibold text-[#3282B8] hover:text-[#0F4C75] transition-colors"
				>
					View All <ArrowUpRight size={13} />
				</Link>
			</div>

			<div className="overflow-x-auto flex-1 min-h-[200px]">
				{loading ? (
					<div className="flex h-full items-center justify-center p-8">
						<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
					</div>
				) : orders.length === 0 ? (
					<div className="flex h-full items-center justify-center p-8 text-center text-sm text-[#7B8BA3]">
						No recent orders
					</div>
				) : (
					<table className="w-full">
						<thead>
							<tr className="border-b border-[#F0F4F8]">
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Order
								</th>
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Table
								</th>
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Total
								</th>
								<th className="text-start text-[10px] font-semibold text-[#B0B8C4] uppercase tracking-wider pb-3">
									Status
								</th>
							</tr>
						</thead>
						<tbody>
							{orders.map((o) => (
								<tr
									key={o.id}
									className="border-b border-[#F8FAFB] last:border-0 hover:bg-[#FAFBFC] transition-colors"
								>
									<td className="py-3 text-xs font-bold text-[#0A1628]">
										#{o.order_number || o.id.slice(0, 4)}
									</td>
									<td className="py-3 text-xs text-[#5A6B82] font-medium">
										{o.tables?.table_number
											? `T-${o.tables.table_number}`
											: "Takeaway"}
									</td>
									<td className="py-3 text-xs font-semibold text-[#0A1628]">
										${Number(o.total_amount).toFixed(2)}
									</td>
									<td className="py-3">
										<span
											className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusColor(o.status)} capitalize`}
										>
											{o.status.replace("_", " ")}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════
   STAFF ON DUTY
   ═══════════════════════════════════════════════════ */
function StaffOnDutyCard({
	staff,
	loading,
	slug,
}: {
	staff: any[];
	loading: boolean;
	slug: string;
}) {
	return (
		<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6 h-full flex flex-col">
			<div className="flex items-center justify-between mb-5">
				<div>
					<h3 className="text-sm font-bold text-[#0A1628]">Staff On Duty</h3>
					<p className="text-xs text-[#7B8BA3] mt-0.5">
						{staff.length} active now
					</p>
				</div>
				<Link
					href={`/${slug}/admin/staff`}
					className="flex items-center gap-1.5 text-xs font-semibold text-[#3282B8] hover:text-[#0F4C75] transition-colors"
				>
					Manage <ArrowUpRight size={13} />
				</Link>
			</div>

			<div className="space-y-3 flex-1 min-h-[200px]">
				{loading ? (
					<div className="flex h-full items-center justify-center p-8">
						<div className="w-6 h-6 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
					</div>
				) : staff.length === 0 ? (
					<div className="flex h-full items-center justify-center p-8 text-center text-sm text-[#7B8BA3]">
						No staff on duty
					</div>
				) : (
					staff.map((s) => (
						<div
							key={s.id}
							className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFB] hover:bg-[#F0F4F8] transition-colors"
						>
							<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F4C75]/10 to-[#3282B8]/10 flex items-center justify-center">
								<span className="text-xs font-bold text-[#0F4C75]">
									{s.name.charAt(0)}
								</span>
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-xs font-semibold text-[#0A1628]">{s.name}</p>
								<p className="text-[10px] text-[#7B8BA3] capitalize">
									{s.role}
								</p>
							</div>
							<div className="flex items-center gap-1.5">
								<div className="w-2 h-2 rounded-full bg-sky-400" />
								<span className="text-[10px] font-semibold text-sky-600">
									Active
								</span>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}

/* ═══════════════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════════════ */
const supabase = createClient();

export default function AdminDashboardPage() {
	const { restaurantId, slug, loading: ctxLoading } = useRestaurant();

	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [metrics, setMetrics] = useState({
		revenue: 0,
		totalOrders: 0,
		activeTables: 0,
		totalTables: 20,
		totalStaff: 0,
	});
	const [recentOrders, setRecentOrders] = useState<any[]>([]);
	const [staffOnDuty, setStaffOnDuty] = useState<any[]>([]);
	const [chartData, setChartData] = useState<{
		barData: { label: string; h: number; value: number }[];
		donutSegments: { label: string; pct: number; color: string }[];
		totalDonut: number;
	}>({
		barData: [],
		donutSegments: [],
		totalDonut: 0,
	});

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!restaurantId) return;

		async function fetchDashboard(isInitial = false) {
			if (isInitial) setLoading(true);

			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const thirtyDaysAgo = new Date();
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			// Bound dataset to last 30 days to prevent unbounded browser memory growth.
			const { data: allOrdersData } = await supabase
				.from("orders")
				.select("*")
				.eq("restaurant_id", restaurantId)
				.gte("created_at", thirtyDaysAgo.toISOString());

			const allOrders = allOrdersData || [];

			let revenue = 0;
			let todayOrdersCount = 0;
			const activeTablesCount = new Set();

			// Calculate Status for Donut
			const statusCounts: Record<string, number> = {};

			allOrders.forEach((o) => {
				const orderDate = new Date(o.created_at);
				if (orderDate >= today) {
					todayOrdersCount++;
					if (o.status === "paid" || o.status === "completed") {
						revenue += Number(o.total_amount) || 0;
					}
					if (
						!["paid", "completed", "cancelled"].includes(o.status) &&
						o.table_id
					) {
						activeTablesCount.add(o.table_id);
					}
				}

				const status = o.status || "unknown";
				statusCounts[status] = (statusCounts[status] || 0) + 1;
			});

			// Calculate DonutChart Data
			const totalOrdersCount = allOrders.length;
			const colors = [
				"#0F4C75",
				"#3282B8",
				"#BBE1FA",
				"#5A6B82",
				"#E8ECF1",
				"#A0ABC0",
			];
			const sortedStatuses = Object.entries(statusCounts).sort(
				(a, b) => b[1] - a[1],
			);

			const donutSegments = sortedStatuses.map(([status, count], idx) => ({
				label: status.replace("_", " "),
				pct:
					totalOrdersCount > 0
						? Math.round((count / totalOrdersCount) * 100)
						: 0,
				color: colors[idx % colors.length],
			}));

			// Calculate BarChart Data (last 6 months)
			const monthNames = [
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"May",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec",
			];
			const monthlyRevenue = new Map<string, number>();

			const now = new Date();
			for (let i = 5; i >= 0; i--) {
				const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
				monthlyRevenue.set(`${monthNames[d.getMonth()]}`, 0);
			}

			allOrders.forEach((o) => {
				if (o.status === "paid" || o.status === "completed") {
					const d = new Date(o.created_at);
					const mName = monthNames[d.getMonth()];
					if (monthlyRevenue.has(mName)) {
						monthlyRevenue.set(
							mName,
							monthlyRevenue.get(mName)! + (Number(o.total_amount) || 0),
						);
					}
				}
			});

			const maxRev = Math.max(...Array.from(monthlyRevenue.values()), 1);
			const barData = Array.from(monthlyRevenue.entries()).map(
				([label, rev]) => ({
					label,
					h: Math.round((rev / maxRev) * 100),
					value: rev,
				}),
			);

			// Fetch total tables
			const { count: totalTbls } = await supabase
				.from("tables")
				.select("*", { count: "exact", head: true })
				.eq("restaurant_id", restaurantId);

			// Total staff check
			const { count: totalStaffCount } = await supabase
				.from("restaurant_staff")
				.select("*", { count: "exact", head: true })
				.eq("restaurant_id", restaurantId);

			setMetrics({
				revenue,
				totalOrders: todayOrdersCount,
				activeTables: activeTablesCount.size,
				totalTables: totalTbls || 20,
				totalStaff: totalStaffCount || 0,
			});

			setChartData({
				barData,
				donutSegments,
				totalDonut: totalOrdersCount,
			});

			// Recent Orders - strict restaurant_id check
			const { data: recent } = await supabase
				.from("orders")
				.select("*, tables(table_number)")
				.eq("restaurant_id", restaurantId)
				.order("created_at", { ascending: false })
				.limit(5);

			setRecentOrders(recent || []);

			// Staff On Duty - strict restaurant_id check
			const { data: staff } = await supabase
				.from("restaurant_staff")
				.select("*")
				.eq("restaurant_id", restaurantId)
				.eq("is_active", true);

			setStaffOnDuty(staff || []);
			if (isInitial) setLoading(false);
		}

		let debounceTimer: NodeJS.Timeout;
		const debouncedFetch = (isInitial = false) => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				fetchDashboard(isInitial);
			}, 1000); // 1s debounce
		};

		fetchDashboard(true);

		const ordersSub = supabase
			.channel(`admin-orders-${restaurantId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "orders",
					filter: `restaurant_id=eq.${restaurantId}`,
				},
				() => {
					debouncedFetch(false);
				},
			)
			.subscribe();

		const callsSub = supabase
			.channel(`admin-calls-${restaurantId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "waiter_calls",
					filter: `restaurant_id=eq.${restaurantId}`,
				},
				() => {
					debouncedFetch(false);
				},
			)
			.subscribe();

		const staffSub = supabase
			.channel(`admin-staff-${restaurantId}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "restaurant_staff",
					filter: `restaurant_id=eq.${restaurantId}`,
				},
				() => {
					debouncedFetch(false);
				},
			)
			.subscribe();

		return () => {
			clearTimeout(debounceTimer);
			supabase.removeChannel(ordersSub);
			supabase.removeChannel(callsSub);
			supabase.removeChannel(staffSub);
		};
	}, [restaurantId]);

	const currency = "$"; // Could fetch from restaurants table later

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h1 className="text-xl font-bold text-[#0A1628] tracking-tight">
						Dashboard
					</h1>
					<p className="text-xs text-[#7B8BA3] mt-1" suppressHydrationWarning>
						<Clock size={12} className="inline mr-1" />
						{mounted
							? `Today, ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}`
							: "Today"}
					</p>
				</div>
			</div>

			{/* Stats Row */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				<StatCard
					loading={ctxLoading || loading}
					title="Today's Revenue"
					value={`${currency}${metrics.revenue.toFixed(2)}`}
					icon={DollarSign}
					iconBg="bg-sky-50 text-sky-600"
				/>
				<StatCard
					loading={ctxLoading || loading}
					title="Today's Orders"
					value={metrics.totalOrders}
					icon={ShoppingBag}
					iconBg="bg-blue-50 text-[#3282B8]"
				/>
				<StatCard
					loading={ctxLoading || loading}
					title="Active Tables"
					value={`${metrics.activeTables} / ${metrics.totalTables}`}
					icon={Utensils}
					iconBg="bg-amber-50 text-amber-600"
				/>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
				<div className="lg:col-span-3">
					<BarChartCard
						data={chartData.barData}
						loading={ctxLoading || loading}
					/>
				</div>
				<div className="lg:col-span-2">
					<DonutChartCard
						segments={chartData.donutSegments}
						total={chartData.totalDonut}
						loading={ctxLoading || loading}
					/>
				</div>
			</div>

			{/* Bottom Row */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
				<div className="lg:col-span-3">
					<RecentOrdersCard
						orders={recentOrders}
						loading={ctxLoading || loading}
						slug={slug || ""}
					/>
				</div>
				<div className="lg:col-span-2">
					<StaffOnDutyCard
						staff={staffOnDuty}
						loading={ctxLoading || loading}
						slug={slug || ""}
					/>
				</div>
			</div>
		</div>
	);
}
