import { createClient } from "@/lib/supabase/server";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Store, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { ActiveToggle } from "./ActiveToggle";

export default async function SuperAdminPage() {
	const supabase = await createClient();

	const { data: restaurants, error } = await supabase
		.from("restaurants")
		.select(
			"id, name, slug, subscription_plan, subscription_status, trial_ends_at, is_active, created_at",
		)
		.order("created_at", { ascending: false });

	const allRestaurants = restaurants ?? [];
	const totalCount = allRestaurants.length;
	const activeCount = allRestaurants.filter((r) => r.is_active).length;
	const trialCount = allRestaurants.filter(
		(r) => r.subscription_status === "trialing",
	).length;
	const suspendedCount = allRestaurants.filter((r) => !r.is_active).length;

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div>
				<h1 className="text-2xl font-bold text-white tracking-tight">
					Restaurant Management
				</h1>
				<p className="text-sm text-white/50 mt-1">
					Overview and control of all platform restaurants
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<StatCard
					label="Total Restaurants"
					value={totalCount}
					icon={<Store size={18} />}
					color="from-blue-500 to-cyan-500"
				/>
				<StatCard
					label="Active"
					value={activeCount}
					icon={<TrendingUp size={18} />}
					color="from-emerald-500 to-green-500"
				/>
				<StatCard
					label="On Trial"
					value={trialCount}
					icon={<Users size={18} />}
					color="from-amber-500 to-orange-500"
				/>
				<StatCard
					label="Suspended"
					value={suspendedCount}
					icon={<AlertTriangle size={18} />}
					color="from-rose-500 to-red-500"
				/>
			</div>

			{/* Restaurants Table */}
			<div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
				<div className="px-6 py-4 border-b border-white/10">
					<h2 className="text-sm font-semibold text-white/80">
						All Restaurants
					</h2>
				</div>

				{error ? (
					<div className="px-6 py-12 text-center text-sm text-red-400">
						Failed to load restaurants: {error.message}
					</div>
				) : allRestaurants.length === 0 ? (
					<div className="px-6 py-12 text-center text-sm text-white/40">
						No restaurants found.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow className="border-white/10 hover:bg-transparent">
								<TableHead className="text-white/50 font-semibold text-xs uppercase tracking-wider pl-6">
									Name
								</TableHead>
								<TableHead className="text-white/50 font-semibold text-xs uppercase tracking-wider">
									Slug
								</TableHead>
								<TableHead className="text-white/50 font-semibold text-xs uppercase tracking-wider">
									Plan
								</TableHead>
								<TableHead className="text-white/50 font-semibold text-xs uppercase tracking-wider">
									Status
								</TableHead>
								<TableHead className="text-white/50 font-semibold text-xs uppercase tracking-wider">
									Trial Ends
								</TableHead>
								<TableHead className="text-white/50 font-semibold text-xs uppercase tracking-wider text-center pr-6">
									Active
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{allRestaurants.map((restaurant) => (
								<TableRow
									key={restaurant.id}
									className="border-white/5 hover:bg-white/[0.03]"
								>
									<TableCell className="pl-6 font-medium text-white/90 text-sm">
										{restaurant.name}
									</TableCell>
									<TableCell className="text-white/50 text-sm font-mono">
										/{restaurant.slug}
									</TableCell>
									<TableCell>
										<PlanBadge plan={restaurant.subscription_plan} />
									</TableCell>
									<TableCell>
										<StatusBadge status={restaurant.subscription_status} />
									</TableCell>
									<TableCell className="text-white/50 text-sm">
										{restaurant.trial_ends_at
											? new Date(restaurant.trial_ends_at).toLocaleDateString(
													"en-US",
													{
														month: "short",
														day: "numeric",
														year: "numeric",
													},
												)
											: "—"}
									</TableCell>
									<TableCell className="text-center pr-6">
										<ActiveToggle
											restaurantId={restaurant.id}
											initialActive={restaurant.is_active ?? true}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</div>
		</div>
	);
}

/* ── Helper Components ── */

function StatCard({
	label,
	value,
	icon,
	color,
}: {
	label: string;
	value: number;
	icon: React.ReactNode;
	color: string;
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5">
			<div className="flex items-center justify-between mb-3">
				<div
					className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
				>
					<span className="text-white">{icon}</span>
				</div>
			</div>
			<p className="text-2xl font-bold text-white tracking-tight">{value}</p>
			<p className="text-xs text-white/40 font-medium mt-1">{label}</p>
		</div>
	);
}

function PlanBadge({ plan }: { plan: string | null }) {
	if (!plan)
		return <span className="text-xs text-white/30 italic">No plan</span>;
	const colors: Record<string, string> = {
		free: "bg-white/10 text-white/60",
		starter: "bg-blue-500/15 text-blue-400",
		pro: "bg-purple-500/15 text-purple-400",
		enterprise: "bg-amber-500/15 text-amber-400",
	};
	return (
		<Badge
			className={`${colors[plan] ?? "bg-white/10 text-white/60"} border-0 capitalize text-[11px] font-semibold`}
		>
			{plan}
		</Badge>
	);
}

function StatusBadge({ status }: { status: string | null }) {
	if (!status)
		return <span className="text-xs text-white/30 italic">—</span>;
	const colors: Record<string, string> = {
		active: "bg-emerald-500/15 text-emerald-400",
		trialing: "bg-amber-500/15 text-amber-400",
		past_due: "bg-rose-500/15 text-rose-400",
		canceled: "bg-red-500/15 text-red-400",
		inactive: "bg-white/10 text-white/40",
	};
	return (
		<Badge
			className={`${colors[status] ?? "bg-white/10 text-white/60"} border-0 capitalize text-[11px] font-semibold`}
		>
			{status.replace(/_/g, " ")}
		</Badge>
	);
}
