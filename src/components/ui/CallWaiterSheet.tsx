"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, HandPlatter, ReceiptText, X } from "lucide-react";
import posthog from "posthog-js";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";

interface CallWaiterSheetProps {
	isOpen: boolean;
	onClose: () => void;
	restaurantSlug: string;
}

export function CallWaiterSheet({
	isOpen,
	onClose,
	restaurantSlug,
}: CallWaiterSheetProps) {
	const { tableNumber } = useCartStore();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successStatus, setSuccessStatus] = useState<
		"assistance" | "bill" | null
	>(null);

	const handleCall = async (type: "assistance" | "bill") => {
		if (!tableNumber) return; // In production, we'd handle no table ID better

		setIsSubmitting(true);

		try {
			const supabase = createClient();

			// Get the restuarant and table UUID first
			const { data: tableData } = await supabase
				.from("restaurants")
				.select("id, tables(id)")
				.eq("slug", restaurantSlug)
				.eq("tables.table_number", tableNumber)
				.single();

			if (tableData?.tables?.[0]?.id) {
				const { error: insertError } = await supabase
					.from("waiter_calls")
					.insert({
						restaurant_id: tableData.id,
						table_id: tableData.tables[0].id,
						type: type,
						status: "active",
					});

				if (insertError) {
					console.error("waiter_calls insert failed:", insertError);
					toast.error("Failed to call waiter. Please try again.");
					setIsSubmitting(false);
					return;
				}
			} else {
				console.error("Could not find table UUID for table:", tableNumber);
				toast.error("Table not found. Please try again.");
				setIsSubmitting(false);
				return;
			}

			posthog.capture("waiter_called", {
				call_type: type,
				table_number: tableNumber,
				restaurant_slug: restaurantSlug,
			});

			setSuccessStatus(type);
			toast.success("Your waiter has been notified!");
			setTimeout(() => {
				setSuccessStatus(null);
				onClose();
			}, 2000);
		} catch (error) {
			console.error("Failed to call waiter", error);
			posthog.captureException(error);
			toast.error("Failed to call waiter. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
						onClick={onClose}
					/>
					<motion.div
						initial={{ y: "100%" }}
						animate={{ y: 0 }}
						exit={{ y: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] p-6 pb-safe safe-bottom"
						style={{
							paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
						}}
					>
						<div className="flex justify-between items-center mb-6">
							<div>
								<h2 className="text-xl font-bold text-text-heading">
									Call Waiter
								</h2>
								<p className="text-sm text-text-muted mt-1">
									Table {tableNumber || "Unknown"}
								</p>
							</div>
							<button
								onClick={onClose}
								className="w-8 h-8 rounded-full bg-border-light flex items-center justify-center text-text-body"
							>
								<X size={18} />
							</button>
						</div>

						<div className="grid grid-cols-2 gap-4">
							{/* Assistance Button */}
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={() => handleCall("assistance")}
								disabled={isSubmitting || !tableNumber}
								className={clsx(
									"relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
									successStatus === "assistance"
										? "border-sky-500 bg-sky-50 text-sky-700"
										: "border-border-medium bg-background hover:border-primary/50 text-text-heading",
								)}
							>
								{successStatus === "assistance" ? (
									<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
										<CheckCircle2 size={32} className="text-sky-500" />
									</motion.div>
								) : (
									<HandPlatter size={32} className="text-primary" />
								)}
								<span className="font-semibold text-sm">Need Assistance</span>
							</motion.button>

							{/* Bill Button */}
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={() => handleCall("bill")}
								disabled={isSubmitting || !tableNumber}
								className={clsx(
									"relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all",
									successStatus === "bill"
										? "border-sky-500 bg-sky-50 text-sky-700"
										: "border-border-medium bg-background hover:border-primary/50 text-text-heading",
								)}
							>
								{successStatus === "bill" ? (
									<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
										<CheckCircle2 size={32} className="text-sky-500" />
									</motion.div>
								) : (
									<ReceiptText size={32} className="text-primary" />
								)}
								<span className="font-semibold text-sm">Request Bill</span>
							</motion.button>
						</div>

						{!tableNumber && (
							<p className="text-sm text-red-500 text-center mt-4">
								Please select a table first to call a waiter.
							</p>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
