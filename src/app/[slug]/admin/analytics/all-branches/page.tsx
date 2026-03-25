"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Building2, Layers3, Store, Wallet } from "lucide-react";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";

type BranchRow = {
	id: string;
	name: string;
	slug: string;
	parent_id: string | null;
};

type BranchMetric = BranchRow & {
	tableCount: number;
	orderCount: number;
	grossValue: number;
};

const supabase = createClient();

export default function AllBranchesAnalyticsPage() {
	const { restaurantId, isMaster, slug } = useRestaurant();
	const [loading, setLoading] = useState(true);
	const [metrics, setMetrics] = useState<BranchMetric[]>([]);

	useEffect(() => {
		if (!restaurantId || !isMaster) {
			setLoading(false);
			setMetrics([]);
			return;
		}

		let cancelled = false;

		(async () => {
			setLoading(true);
			const monthStart = new Date();
			monthStart.setDate(1);
			monthStart.setHours(0, 0, 0, 0);

			const { data: branchRows } = await supabase
				.from("restaurants")
				.select("id, name, slug, parent_id")
				.or(`id.eq.${restaurantId},parent_id.eq.${restaurantId}`)
				.order("created_at", { ascending: true });

			const branches = (branchRows as BranchRow[]) || [];
			const ids = branches.map((branch) => branch.id);

			const [{ data: tables }, { data: orders }] = await Promise.all([
				supabase.from("tables").select("restaurant_id").in("restaurant_id", ids),
				supabase
					.from("orders")
					.select("restaurant_id, total_amount, status, created_at")
					.in("restaurant_id", ids)
					.gte("created_at", monthStart.toISOString()),
			]);

			const tableCounts = new Map<string, number>();
			for (const row of tables || []) {
				tableCounts.set(row.restaurant_id, (tableCounts.get(row.restaurant_id) ?? 0) + 1);
			}

			const orderCounts = new Map<string, number>();
			const grossValues = new Map<string, number>();
			for (const row of orders || []) {
				orderCounts.set(row.restaurant_id, (orderCounts.get(row.restaurant_id) ?? 0) + 1);
				if (row.status !== "cancelled") {
					grossValues.set(
						row.restaurant_id,
						(grossValues.get(row.restaurant_id) ?? 0) + Number(row.total_amount ?? 0),
					);
				}
			}

			if (!cancelled) {
				setMetrics(
					branches.map((branch) => ({
						...branch,
						tableCount: tableCounts.get(branch.id) ?? 0,
						orderCount: orderCounts.get(branch.id) ?? 0,
						grossValue: grossValues.get(branch.id) ?? 0,
					})),
				);
				setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [isMaster, restaurantId]);

	const totals = useMemo(
		() => ({
			branches: metrics.length,
			tables: metrics.reduce((sum, branch) => sum + branch.tableCount, 0),
			orders: metrics.reduce((sum, branch) => sum + branch.orderCount, 0),
			grossValue: metrics.reduce((sum, branch) => sum + branch.grossValue, 0),
		}),
		[metrics],
	);

	if (!isMaster) {
		return (
			<div className="rounded-3xl border border-[#E8ECF1] bg-white p-8">
				<h1 className="text-2xl font-black text-[#0A1628]">All Branches</h1>
				<p className="mt-3 text-sm text-[#64748B]">
					This view is available only on the Enterprise master account.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="rounded-[28px] border border-[#E8ECF1] bg-[linear-gradient(135deg,#0A1628_0%,#0F4C75_100%)] p-7 text-white">
				<p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/65">
					Master Analytics
				</p>
				<h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
					All Branches Overview
				</h1>
				<p className="mt-3 max-w-2xl text-sm leading-6 text-white/72">
					Monthly rollup for <span className="font-bold text-white">{slug}</span> and
					all connected branch slugs.
				</p>
			</div>

			<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
				{[
					{ label: "Branch Slugs", value: totals.branches, icon: Layers3 },
					{ label: "Physical Tables", value: totals.tables, icon: Building2 },
					{ label: "Monthly Orders", value: totals.orders, icon: BarChart3 },
					{
						label: "Gross Order Value",
						value: `$${totals.grossValue.toFixed(2)}`,
						icon: Wallet,
					},
				].map((card) => {
					const Icon = card.icon;
					return (
						<div
							key={card.label}
							className="rounded-3xl border border-[#E8ECF1] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
						>
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94A3B8]">
										{card.label}
									</p>
									<p className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#0A1628]">
										{card.value}
									</p>
								</div>
								<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8F4FD] text-[#0F4C75]">
									<Icon size={20} />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="rounded-3xl border border-[#E8ECF1] bg-white p-6">
				<div className="flex items-center gap-2">
					<Store size={18} className="text-[#0F4C75]" />
					<h2 className="text-lg font-black tracking-[-0.02em] text-[#0A1628]">
						Branch Breakdown
					</h2>
				</div>

				<div className="mt-5 grid gap-3">
					{loading ? (
						<div className="rounded-2xl bg-[#F8FAFC] px-4 py-8 text-sm text-[#64748B]">
							Loading branch rollup…
						</div>
					) : (
						metrics.map((branch) => (
							<div
								key={branch.id}
								className="grid gap-3 rounded-2xl border border-[#E8ECF1] bg-[#FCFDFE] px-4 py-4 sm:grid-cols-[1.4fr_repeat(3,0.8fr)] sm:items-center"
							>
								<div>
									<p className="text-sm font-black text-[#0A1628]">
										{branch.parent_id ? branch.name : `${branch.name} HQ`}
									</p>
									<p className="mt-1 text-xs font-mono text-[#64748B]">
										/{branch.slug}/admin
									</p>
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
										Tables
									</p>
									<p className="mt-1 text-lg font-black text-[#0A1628]">{branch.tableCount}</p>
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
										Orders
									</p>
									<p className="mt-1 text-lg font-black text-[#0A1628]">{branch.orderCount}</p>
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#94A3B8]">
										Gross Value
									</p>
									<p className="mt-1 text-lg font-black text-[#0A1628]">
										${branch.grossValue.toFixed(2)}
									</p>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
