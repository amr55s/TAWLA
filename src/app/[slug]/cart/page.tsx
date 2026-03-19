"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import {
	BackButton,
	CartItemCard,
	FloatingNavBar,
	PageHeader,
} from "@/components/ui";
import { useCartStore } from "@/store/cart";

const SERVICE_FEE_PERCENTAGE = 10;

export default function CartPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const router = useRouter();
	const { slug } = React.use(params);

	const {
		items,
		updateQuantity,
		removeItem,
		getSubtotal,
		getServiceFee,
		getTotal,
		getTotalItems,
	} = useCartStore();

	const subtotal = getSubtotal();
	const serviceFee = getServiceFee(SERVICE_FEE_PERCENTAGE);
	const total = getTotal(SERVICE_FEE_PERCENTAGE);
	const cartCount = getTotalItems();

	const handleProceed = () => {
		if (items.length > 0) {
			posthog.capture("checkout_started", {
				restaurant_slug: slug,
				item_count: items.reduce((sum, item) => sum + item.quantity, 0),
				total_amount: total,
				currency: "KWD",
			});
			router.push(`/${slug}/checkout`);
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="bg-background px-5 pt-6 pb-4 flex items-center gap-4">
				<button
					onClick={() => router.push(`/${slug}/menu`)}
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
				<h1 className="text-lg font-bold text-text-heading">Cart</h1>
			</div>

			{/* Cart Items */}
			<main className="px-5 pb-52">
				<AnimatePresence mode="popLayout">
					{items.length > 0 ? (
						<div>
							{items.map((item) => (
								<CartItemCard
									key={item.menuItem.id}
									item={item}
									onIncrement={() =>
										updateQuantity(item.menuItem.id, item.quantity + 1)
									}
									onDecrement={() =>
										updateQuantity(item.menuItem.id, item.quantity - 1)
									}
									onRemove={() => removeItem(item.menuItem.id)}
								/>
							))}
						</div>
					) : (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex flex-col items-center justify-center py-24 text-center"
						>
							<div className="text-7xl mb-4 opacity-30">🛒</div>
							<h3 className="text-lg font-semibold text-text-heading mb-2">
								Cart is empty
							</h3>
							<p className="text-text-muted text-sm">
								Add your favorite dishes from the menu
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</main>

			{/* Footer */}
			{items.length > 0 && (
				<div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border-light px-5 pt-4 pb-6 safe-bottom">
					{/* Total */}
					<div className="flex items-center justify-between mb-4">
						<span className="text-sm text-text-muted">Total</span>
						<strong
							className="text-xl font-bold text-text-heading"
							style={{ direction: "ltr" }}
						>
							{total.toFixed(3)} KD
						</strong>
					</div>

					{/* Checkout Button */}
					<motion.button
						whileTap={{ scale: 0.98 }}
						onClick={handleProceed}
						className="w-full py-4 bg-primary rounded-2xl text-white text-base font-bold transition-colors active:bg-primary/90"
					>
						Proceed to Checkout
					</motion.button>
				</div>
			)}

			{/* Floating Nav Bar - hidden when cart has items to avoid overlap */}
			{items.length === 0 && (
				<FloatingNavBar restaurantSlug={slug} cartCount={cartCount} />
			)}
		</div>
	);
}
