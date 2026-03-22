"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BackButton, PageHeader } from "@/components/ui";
import { getRestaurantBySlugClient } from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";

interface ScannedOrder {
	orderId?: string;
	restaurantId?: string;
	restaurantSlug: string;
	tableNumber: string;
	timestamp: number;
	items: Array<{
		id: string;
		name: string;
		quantity: number;
		price: number;
		specialRequests?: string;
	}>;
	total: number;
}

export default function ConfirmOrderPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const router = useRouter();
	const { slug } = React.use(params);
	const resolvedSearchParams = React.use(searchParams);
	const tableParam = resolvedSearchParams?.table;
	const tableNumber =
		typeof tableParam === "string"
			? tableParam
			: Array.isArray(tableParam)
				? tableParam[0]
				: undefined;
	const orderIdParam = resolvedSearchParams?.orderId;
	const orderIdFromQuery =
		typeof orderIdParam === "string"
			? orderIdParam
			: Array.isArray(orderIdParam)
				? orderIdParam[0]
				: undefined;
	const supabase = createClient();

	const [order, setOrder] = useState<ScannedOrder | null>(null);
	const [isConfirming, setIsConfirming] = useState(false);
	const [isConfirmed, setIsConfirmed] = useState(false);

	useEffect(() => {
		const storedOrder = sessionStorage.getItem("scannedOrder");
		if (storedOrder) {
			setOrder(JSON.parse(storedOrder));
		} else if (!tableNumber) {
			router.push(`/${slug}/waiter`);
		}
	}, [tableNumber, slug, router]);

	const handleConfirm = async () => {
		if (isConfirming) return;
		setIsConfirming(true);

		try {
			const restaurantId =
				order?.restaurantId || (await getRestaurantBySlugClient(slug))?.id;
			const orderId = order?.orderId || orderIdFromQuery;

			if (!restaurantId || !orderId) {
				toast.error("Missing order context. Please rescan and try again.");
				return;
			}

			const { error } = await supabase
				.from("orders")
				.update({ status: "confirmed_by_waiter" })
				.eq("id", orderId)
				.eq("restaurant_id", restaurantId);

			if (error) {
				throw error;
			}

			sessionStorage.removeItem("scannedOrder");
			setIsConfirmed(true);
			toast.success("Order confirmed and sent to kitchen");

			setTimeout(() => {
				router.push(`/${slug}/waiter`);
			}, 2000);
		} catch (error) {
			console.error("Confirm order failed:", error);
			toast.error("Failed to confirm order. Please try again.");
		} finally {
			setIsConfirming(false);
		}
	};

	if (isConfirmed) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-6">
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					className="text-center"
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring" }}
						className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-[#3282B8]"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</motion.div>
					<h2 className="text-2xl font-bold text-text-heading mb-2">
						Order Confirmed!
					</h2>
					<p className="text-text-secondary">
						Sent to kitchen for Table #{tableNumber}
					</p>
				</motion.div>
			</div>
		);
	}

	if (!order) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background pb-32">
			{/* Header */}
			<PageHeader left={<BackButton variant="light" />} title="Confirm Order" />

			<main className="px-6 py-4">
				{/* Table Info */}
				<div className="bg-primary/10 rounded-2xl p-4 mb-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center">
							<span className="text-xl font-bold text-white">
								{order.tableNumber}
							</span>
						</div>
						<div>
							<p className="text-sm text-text-muted">Table Number</p>
							<p className="text-lg font-bold text-text-heading">
								Table #{order.tableNumber}
							</p>
						</div>
					</div>
				</div>

				{/* Order Items */}
				<h3 className="text-lg font-bold text-text-heading mb-4">
					Order Items
				</h3>
				<div className="space-y-3 mb-6">
					{order.items.map((item, index) => (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.1 }}
							className="flex items-center justify-between bg-white border border-border-light rounded-2xl p-4"
						>
							<div className="flex items-center gap-3">
								<div className="w-8 h-8 bg-border-light rounded-full flex items-center justify-center text-sm font-bold text-text-heading">
									{item.quantity}x
								</div>
								<div>
									<p className="font-semibold text-text-heading">{item.name}</p>
									{item.specialRequests && (
										<p className="text-xs text-primary">
											{item.specialRequests}
										</p>
									)}
								</div>
							</div>
							<p className="font-bold text-text-heading">
								{(item.price * item.quantity).toFixed(3)} KD
							</p>
						</motion.div>
					))}
				</div>

				{/* Total */}
				<div className="flex justify-between items-center py-4 border-t border-border-light">
					<span className="text-lg font-bold text-text-heading">Total</span>
					<span className="text-2xl font-bold text-primary">
						{order.total.toFixed(3)} KD
					</span>
				</div>
			</main>

			{/* Confirm Button */}
			<div className="fixed bottom-0 left-0 right-0 p-6 safe-bottom bg-white border-t border-border-light">
				<motion.button
					whileTap={{ scale: 0.98 }}
					onClick={handleConfirm}
					disabled={isConfirming}
					className="w-full h-14 bg-primary rounded-3xl flex items-center justify-center gap-2 shadow-primary disabled:opacity-70"
				>
					{isConfirming ? (
						<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
					) : (
						<>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-white"
							>
								<polyline points="20 6 9 17 4 12" />
							</svg>
							<span className="text-base font-bold text-white">
								Confirm & Send to Kitchen
							</span>
						</>
					)}
				</motion.button>
			</div>
		</div>
	);
}