"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import {
	ArrowUpRight,
	BarChart3,
	CalendarIcon,
	DollarSign,
	Loader2,
	Minus,
	Plus,
	TrendingDown,
	TrendingUp,
	Clock,
	Users,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { DateRange } from "react-day-picker";

// ─── TypeScript Interfaces ───────────────────────────────────────────
interface PnlData {
	pos_revenue: number;
	manual_income: number;
	gross_revenue: number;
	total_expenses: number;
	net_profit: number;
}

interface TopSeller {
	name: string;
	total_qty: number;
}

interface CategoryBreakdown {
	category: string;
	revenue: number;
}

interface TableUsage {
	table_number: number;
	order_count: number;
}

interface HourlyDemand {
	hour: number;
	order_count: number;
}

interface AnalyticsData {
	pnl: PnlData;
	top_sellers: TopSeller[];
	category_breakdown: CategoryBreakdown[];
	table_usage: TableUsage[];
	hourly_demand: HourlyDemand[];
}

const EXPENSE_CATEGORIES = [
	"Rent",
	"Utilities",
	"Supplies",
	"Salaries",
	"Maintenance",
	"Other",
] as const;

const CHART_COLORS = ["#0F4C75", "#3282B8", "#5AA9D6", "#89C4E8", "#B7DDF0", "#D1E9F5"];

// ─── Helper: Format currency ─────────────────────────────────────────
function fmtCurrency(n: number) {
	return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtHour(h: number) {
	if (h === 0) return "12 AM";
	if (h < 12) return `${h} AM`;
	if (h === 12) return "12 PM";
	return `${h - 12} PM`;
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
	const params = useParams();
	const slug = params?.slug as string;
	const { restaurantId } = useRestaurant();
	const supabase = createClient();

	const [dateRange, setDateRange] = useState<DateRange>({
		from: subDays(new Date(), 30),
		to: new Date(),
	});
	const [data, setData] = useState<AnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [calOpen, setCalOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	// Expense modal
	const [expOpen, setExpOpen] = useState(false);
	const [expCategory, setExpCategory] = useState<string>("Rent");
	const [expAmount, setExpAmount] = useState("");
	const [expDesc, setExpDesc] = useState("");
	const [expDate, setExpDate] = useState(format(new Date(), "yyyy-MM-dd"));
	const [expSaving, setExpSaving] = useState(false);

	// Income modal
	const [incOpen, setIncOpen] = useState(false);
	const [incAmount, setIncAmount] = useState("");
	const [incDesc, setIncDesc] = useState("");
	const [incDate, setIncDate] = useState(format(new Date(), "yyyy-MM-dd"));
	const [incSaving, setIncSaving] = useState(false);

	// ─── Fetch analytics ─────────────────────────────────────────────
	const fetchAnalytics = useCallback(async () => {
		if (!restaurantId || !dateRange.from || !dateRange.to) return;
		setLoading(true);
		try {
			const { data: rpcData, error } = await supabase.rpc("get_advanced_analytics_v2", {
				p_restaurant_id: restaurantId,
				p_start_date: format(dateRange.from, "yyyy-MM-dd"),
				p_end_date: format(dateRange.to, "yyyy-MM-dd"),
			});
			if (error) throw error;
			setData(rpcData as AnalyticsData);
		} catch (err: any) {
			console.error("Analytics RPC error:", err);
			toast.error("Failed to load analytics");
		} finally {
			setLoading(false);
		}
	}, [restaurantId, dateRange, supabase]);

	useEffect(() => {
		fetchAnalytics();
	}, [fetchAnalytics]);

	// ─── Save expense ────────────────────────────────────────────────
	const handleSaveExpense = async () => {
		if (!restaurantId || !expAmount || Number(expAmount) <= 0) {
			toast.error("Enter a valid amount");
			return;
		}
		setExpSaving(true);
		const { error } = await supabase.from("expenses").insert({
			restaurant_id: restaurantId,
			category: expCategory,
			amount: Number(expAmount),
			description: expDesc || null,
			date: expDate,
		});
		setExpSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Expense recorded");
		setExpOpen(false);
		setExpAmount("");
		setExpDesc("");
		fetchAnalytics();
	};

	// ─── Save income ─────────────────────────────────────────────────
	const handleSaveIncome = async () => {
		if (!restaurantId || !incAmount || Number(incAmount) <= 0 || !incDesc.trim()) {
			toast.error("Fill in amount and description");
			return;
		}
		setIncSaving(true);
		const { error } = await supabase.from("manual_income").insert({
			restaurant_id: restaurantId,
			amount: Number(incAmount),
			description: incDesc.trim(),
			date: incDate,
		});
		setIncSaving(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Income recorded");
		setIncOpen(false);
		setIncAmount("");
		setIncDesc("");
		fetchAnalytics();
	};

	// ─── Derived values ──────────────────────────────────────────────
	const pnl = data?.pnl;
	const topSellers = data?.top_sellers ?? [];
	const categoryBreakdown = data?.category_breakdown ?? [];
	const tableUsage = data?.table_usage ?? [];
	const hourlyDemand = data?.hourly_demand ?? [];
	const topTables = tableUsage.slice(0, 5);
	const bottomTables = tableUsage.length > 5 ? tableUsage.slice(-5).reverse() : [];

	// ─── Render ──────────────────────────────────────────────────────
	return (
		<div className="max-w-6xl space-y-8">
			{/* Header + Date Range + Actions */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-black text-[#0A1628] tracking-tight">
						Analytics
					</h1>
					<p className="text-xs text-[#7B8BA3] mt-1">
						Financial insights & operational metrics
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					{/* Date Range Picker */}
					<Popover open={calOpen} onOpenChange={setCalOpen}>
						<PopoverTrigger className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8ECF1] bg-white text-sm font-medium text-[#0A1628] hover:bg-[#F5F7FA] transition-colors">
							<CalendarIcon size={14} className="text-[#7B8BA3]" />
							{mounted ? (
								dateRange.from && dateRange.to
									? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
									: "Select dates"
							) : (
								"Select dates"
							)}
						</PopoverTrigger>
						<PopoverContent className="w-auto p-0" align="end">
							<Calendar
								mode="range"
								selected={dateRange}
								onSelect={(range) => {
									if (range) setDateRange(range);
									if (range?.from && range?.to) setCalOpen(false);
								}}
								numberOfMonths={2}
							/>
						</PopoverContent>
					</Popover>

					{/* Action Buttons */}
					<Dialog open={expOpen} onOpenChange={setExpOpen}>
						<DialogTrigger>
							<button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors">
								<Minus size={14} /> Add Expense
							</button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Record Expense</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-2">
								<div>
									<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
										Category
									</label>
									<select
										value={expCategory}
										onChange={(e) => setExpCategory(e.target.value)}
										className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20"
									>
										{EXPENSE_CATEGORIES.map((c) => (
											<option key={c} value={c}>
												{c}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
										Amount
									</label>
									<input
										type="number"
										min="0"
										step="0.01"
										value={expAmount}
										onChange={(e) => setExpAmount(e.target.value)}
										placeholder="0.00"
										className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20"
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
										Description (Optional)
									</label>
									<input
										type="text"
										value={expDesc}
										onChange={(e) => setExpDesc(e.target.value)}
										placeholder="e.g. Monthly electricity bill"
										className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20"
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
										Date
									</label>
									<input
										type="date"
										value={expDate}
										onChange={(e) => setExpDate(e.target.value)}
										className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20"
									/>
								</div>
							</div>
							<DialogFooter>
								<button
									onClick={handleSaveExpense}
									disabled={expSaving}
									className="w-full py-2.5 bg-[#0F4C75] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors hover:bg-[#0A3558]"
								>
									{expSaving ? (
										<Loader2 size={16} className="animate-spin" />
									) : null}
									{expSaving ? "Saving..." : "Save Expense"}
								</button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Dialog open={incOpen} onOpenChange={setIncOpen}>
						<DialogTrigger>
							<button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-sm font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors">
								<Plus size={14} /> Add Income
							</button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Record Income</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-2">
								<div>
									<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
										Amount
									</label>
									<input
										type="number"
										min="0"
										step="0.01"
										value={incAmount}
										onChange={(e) => setIncAmount(e.target.value)}
										placeholder="0.00"
										className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20"
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
										Description
									</label>
									<input
										type="text"
										value={incDesc}
										onChange={(e) => setIncDesc(e.target.value)}
										placeholder="e.g. Private event catering"
										className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20"
									/>
								</div>
								<div>
									<label className="text-xs font-semibold text-[#64748B] mb-1.5 block">
										Date
									</label>
									<input
										type="date"
										value={incDate}
										onChange={(e) => setIncDate(e.target.value)}
										className="w-full py-2.5 px-3 bg-[#F8FAFC] border border-[#E8ECF1] rounded-xl text-sm text-[#0A1628] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20"
									/>
								</div>
							</div>
							<DialogFooter>
								<button
									onClick={handleSaveIncome}
									disabled={incSaving}
									className="w-full py-2.5 bg-[#0F4C75] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors hover:bg-[#0A3558]"
								>
									{incSaving ? (
										<Loader2 size={16} className="animate-spin" />
									) : null}
									{incSaving ? "Saving..." : "Save Income"}
								</button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Loading State */}
			{loading && (
				<div className="flex flex-col items-center justify-center py-20 gap-4">
					<div className="w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
					<p className="text-sm text-[#64748B]">Loading analytics…</p>
				</div>
			)}

			{!loading && pnl && (
				<>
					{/* ─── Financial Summary Cards ──────────────────────────── */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{/* Net Profit */}
						<Link
							href={`/${slug}/admin/analytics/profit-loss`}
							className="bg-white rounded-2xl border border-[#E8ECF1] p-6 relative group block hover:border-[#0F4C75]/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
						>
							<div className="flex items-center justify-between mb-3">
								<span className="text-[10px] font-bold text-[#7B8BA3] uppercase tracking-widest">
									Net Profit
								</span>
								<div
									className={`w-8 h-8 rounded-xl flex items-center justify-center ${pnl.net_profit >= 0 ? "bg-emerald-50" : "bg-red-50"}`}
								>
									{pnl.net_profit >= 0 ? (
										<TrendingUp size={16} className="text-emerald-500" />
									) : (
										<TrendingDown size={16} className="text-red-500" />
									)}
								</div>
							</div>
							<p
								className={`text-3xl font-black tracking-tight ${pnl.net_profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
							>
								{fmtCurrency(pnl.net_profit)}
							</p>
							<p className="text-[11px] text-[#94A3B8] mt-1 relative z-10 pr-8">
								Revenue − Expenses
							</p>
							<div className="absolute bottom-6 right-6 text-[#94A3B8] opacity-0 group-hover:opacity-100 group-hover:text-[#0F4C75] transition-all transform translate-x-1 group-hover:translate-x-0">
								<ArrowUpRight size={18} />
							</div>
						</Link>

						{/* Gross Revenue */}
						<Link
							href={`/${slug}/admin/analytics/revenue`}
							className="bg-white rounded-2xl border border-[#E8ECF1] p-6 relative group block hover:border-[#0F4C75]/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
						>
							<div className="flex items-center justify-between mb-3">
								<span className="text-[10px] font-bold text-[#7B8BA3] uppercase tracking-widest">
									Gross Revenue
								</span>
								<div className="w-8 h-8 rounded-xl bg-[#E8F4FD] flex items-center justify-center">
									<DollarSign size={16} className="text-[#0F4C75]" />
								</div>
							</div>
							<p className="text-3xl font-black text-[#0A1628] tracking-tight">
								{fmtCurrency(pnl.gross_revenue)}
							</p>
							<div className="flex gap-4 mt-1 relative z-10 pr-8">
								<span className="text-[11px] text-[#94A3B8]">
									POS: {fmtCurrency(pnl.pos_revenue)}
								</span>
								<span className="text-[11px] text-[#94A3B8]">
									Manual: {fmtCurrency(pnl.manual_income)}
								</span>
							</div>
							<div className="absolute bottom-6 right-6 text-[#94A3B8] opacity-0 group-hover:opacity-100 group-hover:text-[#0F4C75] transition-all transform translate-x-1 group-hover:translate-x-0">
								<ArrowUpRight size={18} />
							</div>
						</Link>

						{/* Total Expenses */}
						<Link
							href={`/${slug}/admin/analytics/expenses`}
							className="bg-white rounded-2xl border border-[#E8ECF1] p-6 relative group block hover:border-[#0F4C75]/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
						>
							<div className="flex items-center justify-between mb-3">
								<span className="text-[10px] font-bold text-[#7B8BA3] uppercase tracking-widest">
									Total Expenses
								</span>
								<div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
									<Minus size={16} className="text-red-500" />
								</div>
							</div>
							<p className="text-3xl font-black text-red-600 tracking-tight">
								{fmtCurrency(pnl.total_expenses)}
							</p>
							<p className="text-[11px] text-[#94A3B8] mt-1 relative z-10 pr-8">
								Recorded for this period
							</p>
							<div className="absolute bottom-6 right-6 text-[#94A3B8] opacity-0 group-hover:opacity-100 group-hover:text-[#0F4C75] transition-all transform translate-x-1 group-hover:translate-x-0">
								<ArrowUpRight size={18} />
							</div>
						</Link>
					</div>

					{/* ─── Charts Row ──────────────────────────────────────── */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Category Breakdown */}
						<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6">
							<div className="flex items-center gap-2 mb-5">
								<BarChart3 size={16} className="text-[#0F4C75]" />
								<h3 className="text-sm font-bold text-[#0A1628]">
									Sales by Category
								</h3>
							</div>
							{categoryBreakdown.length === 0 ? (
								<p className="text-sm text-[#94A3B8] text-center py-8">
									No sales data for this period
								</p>
							) : (
								<ResponsiveContainer width="100%" height={250}>
									<BarChart
										data={categoryBreakdown}
										margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#F1F5F9"
											vertical={false}
										/>
										<XAxis
											dataKey="category"
											tick={{ fontSize: 11, fill: "#64748B" }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											tick={{ fontSize: 11, fill: "#94A3B8" }}
											axisLine={false}
											tickLine={false}
										/>
										<Tooltip
											contentStyle={{
												borderRadius: 12,
												border: "1px solid #E8ECF1",
												boxShadow: "0 4px 12px rgba(0,0,0,.06)",
												fontSize: 12,
											}}
											formatter={(value: number) => [
												fmtCurrency(value),
												"Revenue",
											]}
										/>
										<Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
											{categoryBreakdown.map((_, i) => (
												<Cell
													key={`cat-${i}`}
													fill={CHART_COLORS[i % CHART_COLORS.length]}
												/>
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							)}
						</div>

						{/* Hourly Demand */}
						<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6">
							<div className="flex items-center gap-2 mb-5">
								<Clock size={16} className="text-[#0F4C75]" />
								<h3 className="text-sm font-bold text-[#0A1628]">
									Peak Hours
								</h3>
							</div>
							{hourlyDemand.length === 0 ? (
								<p className="text-sm text-[#94A3B8] text-center py-8">
									No order data for this period
								</p>
							) : (
								<ResponsiveContainer width="100%" height={250}>
									<BarChart
										data={hourlyDemand}
										margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
									>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#F1F5F9"
											vertical={false}
										/>
										<XAxis
											dataKey="hour"
											tickFormatter={fmtHour}
											tick={{ fontSize: 10, fill: "#64748B" }}
											axisLine={false}
											tickLine={false}
										/>
										<YAxis
											tick={{ fontSize: 11, fill: "#94A3B8" }}
											axisLine={false}
											tickLine={false}
											allowDecimals={false}
										/>
										<Tooltip
											contentStyle={{
												borderRadius: 12,
												border: "1px solid #E8ECF1",
												boxShadow: "0 4px 12px rgba(0,0,0,.06)",
												fontSize: 12,
											}}
											labelFormatter={fmtHour}
											formatter={(value: number) => [value, "Orders"]}
										/>
										<Bar
											dataKey="order_count"
											fill="#3282B8"
											radius={[6, 6, 0, 0]}
										/>
									</BarChart>
								</ResponsiveContainer>
							)}
						</div>
					</div>

					{/* ─── Tables Row ──────────────────────────────────────── */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Top 10 Selling Items */}
						<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6">
							<div className="flex items-center gap-2 mb-5">
								<TrendingUp size={16} className="text-[#0F4C75]" />
								<h3 className="text-sm font-bold text-[#0A1628]">
									Top Selling Items
								</h3>
							</div>
							{topSellers.length === 0 ? (
								<p className="text-sm text-[#94A3B8] text-center py-8">
									No sales data for this period
								</p>
							) : (
								<div className="space-y-0">
									{topSellers.map((item, i) => (
										<div
											key={item.name}
											className="flex items-center justify-between py-3 border-b border-[#F8FAFC] last:border-0"
										>
											<div className="flex items-center gap-3">
												<span className="w-6 h-6 rounded-lg bg-[#F0F4F8] flex items-center justify-center text-[10px] font-bold text-[#5A6B82]">
													{i + 1}
												</span>
												<span className="text-sm font-medium text-[#0A1628]">
													{item.name}
												</span>
											</div>
											<span className="text-sm font-bold text-[#0F4C75] tabular-nums">
												{item.total_qty} sold
											</span>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Table Usage */}
						<div className="bg-white rounded-2xl border border-[#E8ECF1] p-6">
							<div className="flex items-center gap-2 mb-5">
								<Users size={16} className="text-[#0F4C75]" />
								<h3 className="text-sm font-bold text-[#0A1628]">
									Table Turnover
								</h3>
							</div>
							{tableUsage.length === 0 ? (
								<p className="text-sm text-[#94A3B8] text-center py-8">
									No table data for this period
								</p>
							) : (
								<div className="space-y-4">
									{/* Most Used */}
									<div>
										<p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">
											Most Active
										</p>
										{topTables.map((t) => (
											<div
												key={t.table_number}
												className="flex items-center justify-between py-2 border-b border-[#F8FAFC] last:border-0"
											>
												<span className="text-sm text-[#0A1628]">
													Table {t.table_number}
												</span>
												<div className="flex items-center gap-2">
													<div className="w-24 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
														<div
															className="h-full bg-[#0F4C75] rounded-full"
															style={{
																width: `${Math.min(100, (t.order_count / (topTables[0]?.order_count || 1)) * 100)}%`,
															}}
														/>
													</div>
													<span className="text-xs font-bold text-[#5A6B82] tabular-nums w-8 text-right">
														{t.order_count}
													</span>
												</div>
											</div>
										))}
									</div>
									{/* Least Used */}
									{bottomTables.length > 0 && (
										<div>
											<p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">
												Least Active
											</p>
											{bottomTables.map((t) => (
												<div
													key={t.table_number}
													className="flex items-center justify-between py-2 border-b border-[#F8FAFC] last:border-0"
												>
													<span className="text-sm text-[#0A1628]">
														Table {t.table_number}
													</span>
													<span className="text-xs font-bold text-[#94A3B8] tabular-nums">
														{t.order_count} orders
													</span>
												</div>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* ─── Labor Overview Placeholder ──────────────────────── */}
					<div className="bg-white rounded-2xl border border-[#E8ECF1] p-8 text-center">
						<div className="w-12 h-12 rounded-2xl bg-[#F0F4F8] flex items-center justify-center mx-auto mb-4">
							<Users size={20} className="text-[#7B8BA3]" />
						</div>
						<h3 className="text-sm font-bold text-[#0A1628] mb-1">
							Labor Analytics
						</h3>
						<p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
							Staff shift tracking and smart presence analytics are coming soon.
							Once the staff shifts feature is enabled, hours worked and
							active/idle ratios will appear here.
						</p>
					</div>
				</>
			)}
		</div>
	);
}