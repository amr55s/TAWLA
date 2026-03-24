"use client";

import { Clock, DollarSign, ShoppingBag, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { BarChartCard, type BarChartData } from "@/components/admin/dashboard/BarChartCard";
import { DonutChartCard, type DonutSegment } from "@/components/admin/dashboard/DonutChartCard";
import { RecentOrdersCard, type RecentOrder } from "@/components/admin/dashboard/RecentOrdersCard";
import { StaffOnDutyCard, type StaffMember } from "@/components/admin/dashboard/StaffOnDutyCard";

const supabase = createClient();

interface DashboardMetrics {
	total_revenue: number;
	total_orders: number;
	active_tables: number;
	total_tables: number;
	staff_on_duty: StaffMember[];
	status_counts: Record<string, number>;
	monthly_revenue: BarChartData[];
	recent_orders: RecentOrder[];
}

export default function AdminDashboardPage() {
	const { restaurantId, slug, loading: ctxLoading } = useRestaurant();

	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	
	const [metrics, setMetrics] = useState<DashboardMetrics>({
		total_revenue: 0,
		total_orders: 0,
		active_tables: 0,
		total_tables: 20,
		staff_on_duty: [],
		status_counts: {},
		monthly_revenue: [],
		recent_orders: [],
	});

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!restaurantId) return;

		async function fetchDashboard(isInitial = false) {
			if (isInitial) setLoading(true);

			try {
				const { data, error } = await supabase.rpc("get_admin_dashboard_metrics", {
					p_restaurant_id: restaurantId,
				});

				if (error) {
					console.error("RPC Error:", JSON.stringify(error, null, 2));
					console.error("Original Error Object:", error);
				} else if (data) {
					setMetrics(data as unknown as DashboardMetrics);
				}
			} catch (err) {
				console.error("Dashboard fetch error:", err);
			} finally {
				if (isInitial) setLoading(false);
			}
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
				() => debouncedFetch(false),
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
				() => debouncedFetch(false),
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
				() => debouncedFetch(false),
			)
			.subscribe();

		return () => {
			clearTimeout(debounceTimer);
			supabase.removeChannel(ordersSub);
			supabase.removeChannel(callsSub);
			supabase.removeChannel(staffSub);
		};
	}, [restaurantId]);

	const currency = (metrics as any)?.currency_symbol || "$";

	// Calculate DonutChart Data
	const totalDonut = metrics.total_orders;
	const colors = ["#0F4C75", "#3282B8", "#BBE1FA", "#5A6B82", "#E8ECF1", "#A0ABC0"];
	const sortedStatuses = Object.entries(metrics.status_counts || {}).sort((a, b) => b[1] - a[1]);
	const donutSegments: DonutSegment[] = sortedStatuses.map(([status, count], idx) => ({
		label: status.replace("_", " "),
		pct: totalDonut > 0 ? Math.round((count / totalDonut) * 100) : 0,
		color: colors[idx % colors.length],
	}));

	// Calculate BarChart Data based on returned data format
	const maxRev = metrics.monthly_revenue.length > 0 
		? Math.max(...metrics.monthly_revenue.map((m: any) => m.value || 0), 1) 
		: 1;
		
	const barData: BarChartData[] = metrics.monthly_revenue.map((m: any) => ({
		label: m.label,
		value: m.value || 0,
		h: Math.round(((m.value || 0) / maxRev) * 100)
	}));
	
	// Fill missing months for the last 6 months to keep UI consistent
	const filledBarData: BarChartData[] = [];
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	const now = new Date();
	for (let i = 5; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const mName = monthNames[d.getMonth()];
		const existing = barData.find((b) => b.label === mName);
		filledBarData.push(existing || { label: mName, value: 0, h: 0 });
	}

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
					value={`${currency}${(metrics.total_revenue || 0).toFixed(2)}`}
					icon={DollarSign}
					iconBg="bg-sky-50 text-sky-600"
				/>
				<StatCard
					loading={ctxLoading || loading}
					title="Today's Orders"
					value={metrics.total_orders || 0}
					icon={ShoppingBag}
					iconBg="bg-blue-50 text-[#3282B8]"
				/>
				<StatCard
					loading={ctxLoading || loading}
					title="Active Tables"
					value={`${metrics.active_tables || 0} / ${metrics.total_tables || 20}`}
					icon={Utensils}
					iconBg="bg-amber-50 text-amber-600"
				/>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
				<div className="lg:col-span-3">
					<BarChartCard
						data={filledBarData}
						loading={ctxLoading || loading}
					/>
				</div>
				<div className="lg:col-span-2">
					<DonutChartCard
						segments={donutSegments}
						total={totalDonut}
						loading={ctxLoading || loading}
					/>
				</div>
			</div>

			{/* Bottom Row */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
				<div className="lg:col-span-3">
					<RecentOrdersCard
						orders={metrics.recent_orders || []}
						loading={ctxLoading || loading}
						slug={slug || ""}
						currency={currency}
						emptyMessage="The kitchen is quiet... for now. Take a deep breath! 🧘‍♂️"
					/>
				</div>
				<div className="lg:col-span-2">
					<StaffOnDutyCard
						staff={metrics.staff_on_duty || []}
						loading={ctxLoading || loading}
						slug={slug || ""}
						emptyMessage="No staff on duty yet. Time to assemble the team! 👨‍🍳"
					/>
				</div>
			</div>
		</div>
	);
}