"use client";

import { CalendarIcon, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { adminOverrideRestaurantSubscription } from "./actions";
import type { SuperAdminRestaurant } from "./types";
import { PLAN_CATALOG, type RestaurantPlan } from "@/lib/billing/plans";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
	month: "long",
	day: "numeric",
	year: "numeric",
});

function getExpiryDate(restaurant: SuperAdminRestaurant) {
	return restaurant.plan === "trial"
		? restaurant.trialEndsAt
		: restaurant.currentPeriodEnd;
}

function toNoonIso(date: Date) {
	return new Date(
		Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0),
	).toISOString();
}

export function ManageRestaurantDialog({
	restaurant,
	open,
	onOpenChange,
	onUpdated,
}: {
	restaurant: SuperAdminRestaurant | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpdated: () => void;
}) {
	const [plan, setPlan] = useState<RestaurantPlan>("trial");
	const [isActive, setIsActive] = useState(true);
	const [expiresAt, setExpiresAt] = useState<Date>(new Date());
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		if (!restaurant) return;

		const nextExpiry = getExpiryDate(restaurant);
		setPlan(restaurant.plan ?? "trial");
		setIsActive(Boolean(restaurant.isActive));
		setExpiresAt(nextExpiry ? new Date(nextExpiry) : new Date());
	}, [restaurant]);

	const handleSave = () => {
		if (!restaurant) return;

		startTransition(async () => {
			const result = await adminOverrideRestaurantSubscription({
				restaurantId: restaurant.id,
				plan,
				expiresAt: toNoonIso(expiresAt),
				isActive,
			});

			if (result?.error) {
				toast.error(result.error);
				return;
			}

			toast.success("Restaurant subscription updated.");
			onUpdated();
			onOpenChange(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl rounded-[32px] border border-[#D6E4F0] bg-[#FFFDFC] p-0 shadow-[0_40px_140px_rgba(15,76,117,0.14)]">
				<div className="rounded-[32px] bg-[linear-gradient(180deg,rgba(240,247,252,0.9),rgba(255,255,255,0))] p-8">
					<DialogHeader className="gap-3">
						<div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#BBE1FA] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0F4C75]">
							Manual Override
						</div>
						<DialogTitle className="text-3xl font-bold tracking-tight text-[#0A1628]">
							{restaurant?.name ?? "Manage restaurant"}
						</DialogTitle>
						<DialogDescription className="max-w-xl text-sm leading-6 text-[#5B6B82]">
							Adjust plan, billing horizon, and operational status from one place.
							Overrides write through the `admin_override_subscription` RPC.
						</DialogDescription>
					</DialogHeader>

					{restaurant && (
						<div className="mt-6 grid gap-4 rounded-[28px] border border-[#E3EDF6] bg-white p-5 sm:grid-cols-3">
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3]">
									Slug
								</p>
								<p className="mt-2 text-sm font-semibold text-[#0A1628]">
									/{restaurant.slug}
								</p>
							</div>
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3]">
									Current Plan
								</p>
								<p className="mt-2 text-sm font-semibold text-[#0A1628]">
									{PLAN_CATALOG[restaurant.plan ?? "trial"].label}
								</p>
							</div>
							<div>
								<p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#7B8BA3]">
									Status
								</p>
								<p className="mt-2 text-sm font-semibold text-[#0A1628]">
									{restaurant.isActive ? "Active" : "Suspended"}
								</p>
							</div>
						</div>
					)}

					<div className="mt-8 grid gap-6">
						<div className="grid gap-2">
							<Label className="text-sm font-semibold text-[#0A1628]">
								Plan
							</Label>
							<NativeSelect
								value={plan}
								onChange={(event) =>
									setPlan(event.target.value as RestaurantPlan)
								}
								className="w-full"
							>
								{Object.values(PLAN_CATALOG).map((entry) => (
									<NativeSelectOption key={entry.id} value={entry.id}>
										{entry.label}
									</NativeSelectOption>
								))}
							</NativeSelect>
						</div>

						<div className="grid gap-2">
							<Label className="text-sm font-semibold text-[#0A1628]">
								Expiry Date
							</Label>
							<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
								<PopoverTrigger className="flex h-12 w-full items-center justify-between rounded-full border border-[#D6E4F0] bg-white px-5 text-left text-sm font-semibold text-[#0A1628] transition-colors hover:bg-[#F7FBFE]">
									<span>{DATE_FORMATTER.format(expiresAt)}</span>
									<CalendarIcon size={16} className="text-[#7B8BA3]" />
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="w-auto rounded-[24px] border border-[#D6E4F0] bg-white p-3 shadow-[0_24px_80px_rgba(15,76,117,0.14)]"
								>
									<Calendar
										mode="single"
										selected={expiresAt}
										onSelect={(date) => {
											if (!date) return;
											setExpiresAt(date);
											setCalendarOpen(false);
										}}
										className="rounded-[20px] bg-white"
									/>
								</PopoverContent>
							</Popover>
						</div>

						<div className="rounded-[28px] border border-[#E3EDF6] bg-[#F7FBFE] p-5">
							<div className="flex items-center justify-between gap-4">
								<div>
									<Label className="text-sm font-semibold text-[#0A1628]">
										Operational Status
									</Label>
									<p className="mt-2 text-sm leading-6 text-[#5B6B82]">
										Keep the restaurant live or suspend dashboard access without
										disrupting the manual billing record you set above.
									</p>
								</div>
								<div className="flex items-center gap-3 rounded-full border border-[#D6E4F0] bg-white px-4 py-2">
									<span className="text-sm font-semibold text-[#0A1628]">
										{isActive ? "Active" : "Suspended"}
									</span>
									<Switch checked={isActive} onCheckedChange={setIsActive} />
								</div>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="rounded-b-[32px] border-t border-[#E3EDF6] bg-white px-8 py-5">
					<Button
						type="button"
						variant="outline"
						className="h-11 rounded-full border-[#D6E4F0] px-5 text-sm font-semibold text-[#3D4F6F]"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={isPending || !restaurant}
						className="h-11 rounded-full bg-[#0F4C75] px-6 text-sm font-bold text-white hover:bg-[#0A3558]"
					>
						{isPending ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Saving
							</>
						) : (
							"Save Override"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
