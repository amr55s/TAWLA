"use client";

import { RotateCcw } from "lucide-react";
import type { KdsOrderRow } from "@/types/kds";
import {
	formatElapsedMmSs,
	useElapsedSecondsSince,
} from "@/hooks/useElapsedSecondsSince";

export type SlaBand = "calm" | "warning" | "danger";

export function getSlaBand(elapsedMinutes: number): SlaBand {
	if (elapsedMinutes < 10) return "calm";
	if (elapsedMinutes < 20) return "warning";
	return "danger";
}

function shortOrderLabel(id: string): string {
	return `ORD-${id.slice(-4).toUpperCase()}`;
}

type OrderCardProps = {
	order: KdsOrderRow;
	onBump: () => void;
	onUndoPrep: () => void;
	bumping: boolean;
	undoing: boolean;
};

export function OrderCard({
	order,
	onBump,
	onUndoPrep,
	bumping,
	undoing,
}: OrderCardProps) {
	const elapsedSec = useElapsedSecondsSince(order.created_at);
	const elapsedMin = elapsedSec / 60;
	const band = getSlaBand(elapsedMin);
	const timeLabel = formatElapsedMmSs(elapsedSec);

	const borderClass =
		band === "calm"
			? "border-tawla-sky/80 ring-1 ring-tawla-deep/10"
			: band === "warning"
				? "border-amber-400 ring-2 ring-amber-200"
				: "border-rose-500 ring-2 ring-rose-300";

	const headerBg =
		band === "calm"
			? "bg-tawla-deep text-white"
			: band === "warning"
				? "bg-amber-500 text-white"
				: "bg-rose-600 text-white";

	const tableNum = order.table?.table_number;
	const tableLabel =
		tableNum != null ? `Table ${tableNum}` : "Takeaway / No table";

	const isInKitchen = order.status === "in_kitchen";
	const isReady = order.status === "ready";

	return (
		<article
			className={`flex flex-col rounded-2xl border-2 bg-white shadow-md overflow-hidden min-h-[280px] ${borderClass} ${isReady ? "opacity-75" : ""}`}
		>
			<header
				className={`flex items-start justify-between gap-3 px-4 py-3 ${headerBg}`}
			>
				<div className="min-w-0">
					<p className="text-lg font-bold tracking-tight truncate">
						{shortOrderLabel(order.id)}
					</p>
					<p className="text-sm font-semibold opacity-95">{tableLabel}</p>
				</div>
				<div
					className={`shrink-0 text-end ${band === "danger" ? "animate-pulse" : ""}`}
				>
					<p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
						Elapsed
					</p>
					<p className="text-2xl font-black tabular-nums leading-none mt-0.5">
						{timeLabel}
					</p>
				</div>
			</header>

			{order.special_requests ? (
				<div className="mx-3 mt-3 rounded-xl border-2 border-rose-500 bg-rose-50 px-3 py-2">
					<p className="text-xs font-bold uppercase text-rose-700 tracking-wide">
						Order note
					</p>
					<p className="text-base font-bold text-rose-800 leading-snug">
						{order.special_requests}
					</p>
				</div>
			) : null}

			<ul className="flex-1 space-y-2 px-4 py-3 overflow-y-auto max-h-[320px]">
				{(order.items ?? []).map((line: KdsOrderRow["items"][number]) => {
					const name =
						line.menu_item?.name_en || line.menu_item?.name_ar || "Item";
					const note = line.special_requests?.trim();
					return (
						<li
							key={line.id}
							className="rounded-xl bg-gray-50 border border-gray-200/80 px-3 py-2.5"
						>
							<div className="flex items-baseline justify-between gap-2">
								<span className="text-gray-800 font-bold text-lg leading-tight">
									{name}
								</span>
								<span className="text-tawla-deep font-black text-xl tabular-nums shrink-0">
									×{line.quantity}
								</span>
							</div>
							{note ? (
								<div className="mt-2 rounded-lg border-2 border-amber-400 bg-amber-100 px-2 py-1.5">
									<p className="text-xs font-extrabold uppercase text-amber-900 tracking-wide">
										Special
									</p>
									<p className="text-base font-bold text-red-700 leading-snug">
										{note}
									</p>
								</div>
							) : null}
						</li>
					);
				})}
			</ul>

		<footer className="mt-auto border-t border-gray-200 bg-gray-50 p-3 space-y-2">
			{isInKitchen && (
				<button
					type="button"
					onClick={onBump}
					disabled={bumping}
					className="w-full min-h-[52px] rounded-xl bg-tawla-deep text-white text-lg font-bold shadow-sm
            active:scale-[0.99] transition-transform disabled:opacity-60 disabled:pointer-events-none
            hover:bg-tawla-deep/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tawla-sky"
				>
					{bumping ? "Updating…" : "Mark as Ready"}
				</button>
			)}

			{isReady && (
				<button
					type="button"
					onClick={onUndoPrep}
					disabled={undoing}
					className="w-full flex items-center justify-center gap-2 min-h-[44px] rounded-xl border-2 border-amber-400
              bg-amber-50 text-amber-800 text-sm font-bold hover:bg-amber-100
              disabled:opacity-50"
				>
					<RotateCcw className="size-4 shrink-0" aria-hidden />
					{undoing ? "Recalling…" : "Recall (back to kitchen)"}
				</button>
			)}
		</footer>
		</article>
	);
}
