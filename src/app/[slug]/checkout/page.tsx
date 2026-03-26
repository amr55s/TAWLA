"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MenuItemImage } from "@/components/ui/MenuItemImage";
import {
	createOrderWithItemsClient,
	getRestaurantBySlugClient,
	getTableByNumberClient,
} from "@/lib/data/orders.client";
import { isRestaurantOrderingUnavailable } from "@/lib/billing/subscription-status";
import { useCartStore } from "@/store/cart";

const SERVICE_FEE_PERCENTAGE = 10;
const GUEST_SESSION_KEY = "tawla_guest_session_id";

export default function CheckoutPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const router = useRouter();
	const { slug } = React.use(params);

	const [specialRequests, setSpecialRequests] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [navigatingToOrders, setNavigatingToOrders] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [orderingUnavailable, setOrderingUnavailable] = useState(false);
	const isSubmittingRef = useRef(false);

	const {
		items,
		getSubtotal,
		getServiceFee,
		getTotal,
		tableNumber,
		clearCart,
		guestId,
		setGuestId,
	} = useCartStore();

	const subtotal = getSubtotal();
	const serviceFee = getServiceFee(SERVICE_FEE_PERCENTAGE);
	const total = getTotal(SERVICE_FEE_PERCENTAGE);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			const restaurant = await getRestaurantBySlugClient(slug);
			if (!restaurant || cancelled) return;

			setOrderingUnavailable(
				isRestaurantOrderingUnavailable({
					plan: restaurant.plan,
					trialEndsAt: restaurant.trial_ends_at,
					subscriptionStatus: restaurant.subscription_status,
					isActive: restaurant.is_active,
				}),
			);
		})();

		return () => {
			cancelled = true;
		};
	}, [slug]);

	const handlePlaceOrder = async () => {
		if (isSubmittingRef.current) return;
		if (orderingUnavailable) {
			toast.error("Ordering is currently unavailable for this restaurant.");
			return;
		}
		if (!tableNumber) {
			toast.error("No table selected. Please go back and select a table.");
			return;
		}

		isSubmittingRef.current = true;
		setIsSubmitting(true);

		try {
			const restaurant = await getRestaurantBySlugClient(slug);
			if (!restaurant) {
				toast.error("Restaurant not found");
				return;
			}
			if (
				isRestaurantOrderingUnavailable({
					plan: restaurant.plan,
					trialEndsAt: restaurant.trial_ends_at,
					subscriptionStatus: restaurant.subscription_status,
					isActive: restaurant.is_active,
				})
			) {
				toast.error("Ordering is currently unavailable for this restaurant.");
				return;
			}

			const table = await getTableByNumberClient(
				restaurant.id,
				parseInt(tableNumber, 10),
			);
			if (!table) {
				toast.error(`Table #${tableNumber} not found in the system`);
				return;
			}

			// Resolve guest session ID — persist in localStorage for cross-page/refresh survival
			let finalGuestId = guestId || useCartStore.getState().guestId;
			if (!finalGuestId) {
				// Try restoring from localStorage first
				if (typeof window !== "undefined") {
					finalGuestId = localStorage.getItem(GUEST_SESSION_KEY) || "";
				}
			}
			if (!finalGuestId) {
				finalGuestId = "guest_" + Math.random().toString(36).substr(2, 9);
			}
			// Always persist in both locations
			if (typeof window !== "undefined") {
				localStorage.setItem(GUEST_SESSION_KEY, finalGuestId);
			}
			useCartStore.getState().setGuestId(finalGuestId);

			const order = await createOrderWithItemsClient({
				restaurant_id: restaurant.id,
				table_id: table.id,
				status: "pending",
				special_requests: specialRequests.trim() || undefined,
				guest_id: finalGuestId,
				items: items.map((ci) => ({
					menu_item_id: ci.menuItem.id,
					quantity: ci.quantity,
				})),
			});

			if (!order) {
				toast.error("Failed to submit order. Please try again.");
				return;
			}

			posthog.capture("order_placed", {
				restaurant_slug: slug,
				table_number: tableNumber,
				order_id: order.id,
				item_count: items.reduce((sum, ci) => sum + ci.quantity, 0),
				total_amount: total,
				has_special_requests: !!specialRequests.trim(),
				currency: "KWD",
			});

			// Show success screen for 3 seconds, then redirect
			setNavigatingToOrders(true);
			setShowSuccess(true);
			clearCart();

			setTimeout(() => {
				router.push(`/${slug}/orders`);
			}, 3000);
		} catch (err) {
			console.error("Checkout error:", err);
			posthog.captureException(err);
			toast.error("Something went wrong. Please try again.");
		} finally {
			isSubmittingRef.current = false;
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		if (items.length === 0 && !navigatingToOrders) {
			router.push(`/${slug}/cart`);
		}
	}, [items.length, navigatingToOrders, router, slug]);

	if (items.length === 0 && !showSuccess) {
		return null;
	}

	return (
		<>
			{/* ── 3-Second Success Overlay ── */}
			<AnimatePresence>
				{showSuccess && (
					<motion.div
						key="success-overlay"
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 1.02 }}
						transition={{ duration: 0.4, ease: "easeOut" }}
						className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
						style={{
							background:
								"linear-gradient(135deg, #0f4c75 0%, #1b6ca8 50%, #1fae8c 100%)",
						}}
					>
						{/* Radial glow */}
						<div
							className="absolute inset-0 opacity-20"
							style={{
								background:
									"radial-gradient(circle at 50% 40%, #4ADE80 0%, transparent 65%)",
							}}
						/>

						{/* Icon */}
						<motion.div
							initial={{ scale: 0, rotate: -20 }}
							animate={{ scale: 1, rotate: 0 }}
							transition={{
								delay: 0.2,
								type: "spring",
								stiffness: 200,
								damping: 14,
							}}
							className="relative mb-6 w-24 h-24 rounded-full flex items-center justify-center"
							style={{
								background: "rgba(255,255,255,0.15)",
								boxShadow: "0 0 40px rgba(74, 222, 128, 0.4)",
							}}
						>
							<span className="text-5xl">🎉</span>
						</motion.div>

						{/* Text */}
						<motion.div
							initial={{ opacity: 0, y: 16 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.35, duration: 0.5 }}
							className="text-center relative"
						>
							<h2 className="text-2xl font-bold text-white mb-3 leading-tight">
								Order Placed Successfully!
							</h2>
							<p className="text-white/80 text-sm leading-relaxed max-w-[260px] mx-auto">
								Please wait a moment while your waiter confirms it.
							</p>
						</motion.div>

						{/* Progress ring */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6 }}
							className="mt-12 flex flex-col items-center gap-3"
						>
							<div className="flex gap-1.5">
								{[0, 1, 2].map((i) => (
									<motion.div
										key={i}
										className="w-2 h-2 rounded-full bg-white"
										animate={{ opacity: [0.3, 1, 0.3] }}
										transition={{
											duration: 1.5,
											repeat: Infinity,
											delay: i * 0.3,
											ease: "easeInOut",
										}}
									/>
								))}
							</div>
							<p className="text-white/50 text-xs">
								Redirecting to your orders…
							</p>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* ── Main Checkout UI ── */}
			<div className="min-h-screen bg-background pb-32">
				{/* Header */}
				<div className="bg-background px-5 pt-6 pb-4 flex items-center gap-4">
					<button
						onClick={() => router.push(`/${slug}/cart`)}
						className="w-10 h-10 rounded-xl bg-background-card flex items-center justify-center text-text-heading"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</button>
					<h1 className="text-lg font-bold text-text-heading">Checkout</h1>
				</div>

				<main className="px-5">
					{/* Table Info */}
					{tableNumber && (
						<div className="bg-primary/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
							<div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
								<span className="text-xl font-bold text-white">
									{tableNumber}
								</span>
							</div>
							<div>
								<p className="text-xs text-text-muted">Table</p>
								<p className="text-base font-bold text-text-heading">
									Table #{tableNumber}
								</p>
							</div>
						</div>
					)}

					{/* Order Items */}
					<section className="bg-background-card rounded-2xl p-4 mb-6 shadow-card">
						<h2 className="text-base font-bold text-text-heading mb-4">
							Order Items
						</h2>

						<div className="divide-y divide-border-light">
							{items.map((item) => (
								<div
									key={item.menuItem.id}
									className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
								>
									<div className="flex items-center gap-3">
										<div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
											<MenuItemImage
												src={item.menuItem.image_url}
												alt={item.menuItem.name_en}
												sizes="48px"
											/>
										</div>
										<div>
											<p className="font-semibold text-sm text-text-heading">
												{item.menuItem.name_en}
											</p>
											<p className="text-xs text-text-muted">×{item.quantity}</p>
										</div>
									</div>
									<p
										className="font-bold text-sm text-text-heading"
										style={{ direction: "ltr" }}
									>
										{(item.menuItem.price * item.quantity).toFixed(3)} KD
									</p>
								</div>
							))}
						</div>

						{/* Totals */}
						<div className="border-t-2 border-primary mt-4 pt-4">
							<div className="flex justify-between items-center">
								<span className="font-bold text-text-heading">Total</span>
								<strong
									className="text-lg text-primary"
									style={{ direction: "ltr" }}
								>
									{total.toFixed(3)} KD
								</strong>
							</div>
						</div>
					</section>

					{/* Special Requests */}
					<section className="mb-6">
						<h2 className="text-base font-bold text-text-heading mb-3">
							Special Requests
						</h2>
						<textarea
							value={specialRequests}
							onChange={(e) => setSpecialRequests(e.target.value)}
							placeholder="Allergies, dietary requirements, or special notes..."
							className="w-full min-h-[100px] p-4 bg-background-card border border-border-light rounded-2xl text-sm text-text-body placeholder:text-text-muted resize-none focus:outline-none focus:border-primary transition-colors"
						/>
					</section>

					{/* Payment Note */}
					<p className="text-center text-xs text-text-muted">
						Payment will be collected at the cashier
					</p>
				</main>

				{/* Place Order Button */}
				<div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border-light px-5 pt-4 pb-6 safe-bottom">
					{orderingUnavailable ? (
						<div className="w-full rounded-2xl border border-[#F3C4A7] bg-[#FFF5EC] px-5 py-4 text-center text-sm font-semibold text-[#9A4D18]">
							Ordering is currently unavailable for this restaurant.
						</div>
					) : (
						<motion.button
							whileTap={{ scale: 0.98 }}
							onClick={handlePlaceOrder}
							disabled={isSubmitting}
							className="w-full py-4 bg-primary rounded-2xl text-white text-base font-bold transition-colors active:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
						>
							{isSubmitting ? (
								<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
							) : (
								<>
									Confirm Order
									<span>✓</span>
								</>
							)}
						</motion.button>
					)}
				</div>
			</div>
		</>
	);
}
