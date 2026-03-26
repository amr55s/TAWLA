"use client";

import {
	AlertTriangle,
	ArrowUpRight,
	Clock3,
	Search,
	ShieldCheck,
	Sparkles,
	Store,
} from "lucide-react";
import { startTransition, useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ManageRestaurantDialog } from "./ManageRestaurantDialog";
import type { SuperAdminRestaurant } from "./types";
import { PLAN_CATALOG } from "@/lib/billing/plans";
import { isRestaurantExpired } from "@/lib/billing/subscription-status";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
});

function getExpiryDate(restaurant: SuperAdminRestaurant) {
	return restaurant.plan === "trial"
		? restaurant.trialEndsAt
		: restaurant.currentPeriodEnd;
}

function isExpired(restaurant: SuperAdminRestaurant) {
	return isRestaurantExpired({
		plan: restaurant.plan,
		trialEndsAt: restaurant.trialEndsAt,
		subscriptionStatus: restaurant.subscriptionStatus,
	});
}

function getDisplayStatus(restaurant: SuperAdminRestaurant) {
	if (!restaurant.isActive) {
		return {
			label: "Suspended",
			className: "bg-[#FFF1EE] text-[#B93815]",
		};
	}

	if (isExpired(restaurant)) {
		return {
			label: "Expired",
			className: "bg-[#FFF7E7] text-[#A45A00]",
		};
	}

	if (restaurant.plan === "trial") {
		return {
			label: "Trialing",
			className: "bg-[#EEF7FF] text-[#0F4C75]",
		};
	}

	return {
		label: "Active",
		className: "bg-[#ECFDF3] text-[#027A48]",
	};
}

function formatExpiryDate(restaurant: SuperAdminRestaurant) {
	const expiryDate = getExpiryDate(restaurant);
	return expiryDate ? DATE_FORMATTER.format(new Date(expiryDate)) : "—";
}

function MetricCard({
	label,
	value,
	icon,
	tone,
}: {
	label: string;
	value: number;
	icon: React.ReactNode;
	tone: string;
}) {
	return (
		<div className="overflow-hidden rounded-[32px] border border-[#D6E4F0] bg-white shadow-[0_24px_70px_rgba(15,76,117,0.08)]">
			<div className={`h-1.5 w-full ${tone}`} />
			<div className="p-6">
				<div className="flex items-center justify-between">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F7FC] text-[#0F4C75]">
						{icon}
					</div>
					<div className="rounded-full border border-[#E3EDF6] bg-[#FCFEFF] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7B8BA3]">
						Live
					</div>
				</div>
				<p className="mt-5 text-4xl font-bold tracking-[-0.04em] text-[#0A1628]">
					{value}
				</p>
				<p className="mt-2 text-sm font-medium text-[#5B6B82]">{label}</p>
			</div>
		</div>
	);
}

export function SuperAdminDashboard({
	restaurants,
	error,
}: {
	restaurants: SuperAdminRestaurant[];
	error: string | null;
}) {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [selectedRestaurant, setSelectedRestaurant] =
		useState<SuperAdminRestaurant | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const deferredSearch = useDeferredValue(search.trim().toLowerCase());

	const filteredRestaurants = restaurants.filter((restaurant) => {
		if (!deferredSearch) return true;

		return (
			restaurant.name.toLowerCase().includes(deferredSearch) ||
			restaurant.slug.toLowerCase().includes(deferredSearch)
		);
	});

	const totalRestaurants = restaurants.length;
	const activePaidSubscriptions = restaurants.filter(
		(restaurant) =>
			restaurant.isActive &&
			restaurant.plan !== "trial" &&
			!isExpired(restaurant),
	).length;
	const expiredAccounts = restaurants.filter((restaurant) =>
		isExpired(restaurant),
	).length;
	const newSignups = restaurants.filter((restaurant) => {
		if (!restaurant.createdAt) return false;
		return (
			new Date(restaurant.createdAt).getTime() >=
			Date.now() - 7 * 24 * 60 * 60 * 1000
		);
	}).length;

	return (
		<div className="space-y-8 pb-10">
			<section
				id="overview"
				className="overflow-hidden rounded-[36px] border border-[#D6E4F0] bg-white shadow-[0_30px_100px_rgba(15,76,117,0.1)]"
			>
				<div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
					<div>
						<div className="inline-flex items-center gap-2 rounded-full border border-[#BBE1FA] bg-[#F7FBFE] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#0F4C75]">
							<ShieldCheck size={14} />
							Private Platform Console
						</div>
						<h1 className="mt-5 max-w-3xl text-[40px] font-bold leading-[1.02] tracking-[-0.05em] text-[#0A1628] md:text-[56px]">
							Manual control for every restaurant, without touching the public flow.
						</h1>
						<p className="mt-5 max-w-2xl text-base leading-7 text-[#4E6078] md:text-lg">
							Search tenants, review subscription exposure, and fix plan state
							directly from one light-mode operations surface built for platform
							oversight.
						</p>
					</div>

					<div className="grid gap-4 rounded-[30px] border border-[#D6E4F0] bg-[linear-gradient(135deg,#0F4C75_0%,#3282B8_100%)] p-6 text-white">
						<div className="flex items-center justify-between">
							<div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#E8F4FD]">
								<Sparkles size={14} />
								Recovery Safe
							</div>
							<ArrowUpRight size={18} className="text-[#E8F4FD]" />
						</div>
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">
								Current Guardrail
							</p>
							<p className="mt-3 text-2xl font-bold tracking-tight">
								Super admin bypasses subscription redirects.
							</p>
						</div>
						<p className="text-sm leading-6 text-white/80">
							Expired trials can still reach subscribe and billing flows. This
							console stays outside that loop entirely.
						</p>
					</div>
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Total Restaurants"
					value={totalRestaurants}
					icon={<Store size={20} />}
					tone="bg-gradient-to-r from-[#0F4C75] to-[#3282B8]"
				/>
				<MetricCard
					label="Active Paid Subs"
					value={activePaidSubscriptions}
					icon={<ShieldCheck size={20} />}
					tone="bg-gradient-to-r from-[#027A48] to-[#12B76A]"
				/>
				<MetricCard
					label="Expired Accounts"
					value={expiredAccounts}
					icon={<AlertTriangle size={20} />}
					tone="bg-gradient-to-r from-[#C2410C] to-[#F59E0B]"
				/>
				<MetricCard
					label="New Signups · 7 Days"
					value={newSignups}
					icon={<Clock3 size={20} />}
					tone="bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
				/>
			</section>

			<section
				id="restaurants"
				className="rounded-[36px] border border-[#D6E4F0] bg-white shadow-[0_24px_80px_rgba(15,76,117,0.08)]"
			>
				<div className="flex flex-col gap-5 border-b border-[#E3EDF6] px-6 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
					<div>
						<p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#7B8BA3]">
							Restaurants
						</p>
						<h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0A1628]">
							Subscriptions at a glance
						</h2>
						<p className="mt-2 text-sm leading-6 text-[#5B6B82]">
							Filter by restaurant name or slug, then open a manual override for
							plan, expiry date, and operational status.
						</p>
					</div>

					<div className="relative w-full max-w-md">
						<Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#7B8BA3]" />
						<Input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search by restaurant name or slug"
							className="h-12 rounded-full border-[#D6E4F0] bg-[#FCFEFF] pl-11 pr-4 text-sm text-[#0A1628] placeholder:text-[#7B8BA3]"
						/>
					</div>
				</div>

				{error ? (
					<div className="px-8 py-16 text-center">
						<p className="text-base font-semibold text-[#B93815]">
							Failed to load restaurants
						</p>
						<p className="mt-2 text-sm text-[#7B8BA3]">{error}</p>
					</div>
				) : filteredRestaurants.length === 0 ? (
					<div className="px-8 py-16 text-center">
						<p className="text-base font-semibold text-[#0A1628]">
							No restaurants match this search.
						</p>
						<p className="mt-2 text-sm text-[#7B8BA3]">
							Try a different restaurant name or slug.
						</p>
					</div>
				) : (
					<Table>
						<TableHeader className="bg-[#F8FBFD]">
							<TableRow className="border-[#E3EDF6] hover:bg-transparent">
								<TableHead className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3] lg:px-8">
									Restaurant Name
								</TableHead>
								<TableHead className="py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3]">
									Slug
								</TableHead>
								<TableHead className="py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3]">
									Plan
								</TableHead>
								<TableHead className="py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3]">
									Status
								</TableHead>
								<TableHead className="py-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3]">
									Expiry Date
								</TableHead>
								<TableHead className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3] lg:px-8">
									Manage
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredRestaurants.map((restaurant) => {
								const status = getDisplayStatus(restaurant);
								return (
									<TableRow
										key={restaurant.id}
										className="border-[#EEF3F8] hover:bg-[#FBFDFF]"
									>
										<TableCell className="px-6 py-5 lg:px-8">
											<div>
												<p className="text-sm font-bold text-[#0A1628]">
													{restaurant.name}
												</p>
												<p className="mt-1 text-xs text-[#7B8BA3]">
													Created{" "}
													{restaurant.createdAt
														? DATE_FORMATTER.format(new Date(restaurant.createdAt))
														: "—"}
												</p>
											</div>
										</TableCell>
										<TableCell className="py-5 text-sm font-semibold text-[#3D4F6F]">
											/{restaurant.slug}
										</TableCell>
										<TableCell className="py-5">
											<span className="inline-flex rounded-full bg-[#EEF7FF] px-3 py-1 text-xs font-bold text-[#0F4C75]">
												{PLAN_CATALOG[restaurant.plan ?? "trial"].label}
											</span>
										</TableCell>
										<TableCell className="py-5">
											<span
												className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
											>
												{status.label}
											</span>
										</TableCell>
										<TableCell className="py-5 text-sm font-semibold text-[#3D4F6F]">
											{formatExpiryDate(restaurant)}
										</TableCell>
										<TableCell className="px-6 py-5 text-right lg:px-8">
											<Button
												type="button"
												onClick={() =>
													startTransition(() => {
														setSelectedRestaurant(restaurant);
														setDialogOpen(true);
													})
												}
												className="h-10 rounded-full bg-[#0F4C75] px-5 text-sm font-bold text-white hover:bg-[#0A3558]"
											>
												Manage
											</Button>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</section>

			<ManageRestaurantDialog
				restaurant={selectedRestaurant}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onUpdated={() => router.refresh()}
			/>
		</div>
	);
}
