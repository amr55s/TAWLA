"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";
import { useCartStore } from "@/store/cart";

function SuccessContent({ slug }: { slug: string }) {
	const router = useRouter();
	const { clearCart } = useCartStore();

	const handleDone = () => {
		clearCart();
		router.push(`/${slug}/menu`);
	};

	const handleViewOrders = () => {
		// Optionally clear cart if they are viewing orders,
		// but typically they might just want to check status.
		clearCart();
		router.push(`/${slug}/orders`);
	};

	return (
		<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
			{/* Success Icon */}
			<motion.div
				initial={{ opacity: 0, scale: 0.5 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{
					type: "spring",
					stiffness: 260,
					damping: 20,
					duration: 0.6,
				}}
				className="text-7xl mb-6 drop-shadow-sm"
			>
				🚀
			</motion.div>

			{/* Title */}
			<motion.h1
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
				className="text-3xl font-black text-text-heading mb-3 tracking-tight"
			>
				Order Sent Successfully!
			</motion.h1>

			{/* Subtitle Card */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.15 }}
				className="bg-primary/5 border border-primary/20 p-5 rounded-2xl mb-10 max-w-sm"
			>
				<p className="text-text-body text-sm leading-relaxed font-medium">
					Please wait, your waiter has been notified and will be at your table
					shortly to confirm your order.
				</p>
			</motion.div>

			{/* Action Buttons */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.4 }}
				className="flex flex-col gap-3 w-full max-w-xs"
			>
				<button
					onClick={handleViewOrders}
					className="w-full py-4 bg-primary rounded-2xl text-base font-bold text-white shadow-primary transition-transform active:scale-95 flex items-center justify-center gap-2"
				>
					View Order Status
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
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10 9 9 9 8 9" />
					</svg>
				</button>
				<button
					onClick={handleDone}
					className="w-full py-4 bg-background-card border border-border-light rounded-2xl text-base font-semibold text-text-body transition-transform active:scale-95"
				>
					New Order ✨
				</button>
			</motion.div>

			{/* Brand Footer */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.4, delay: 0.5 }}
				className="fixed bottom-8 text-center"
			>
				<p className="text-xl font-bold text-primary tracking-wider">TAWLA</p>
				<p className="text-[10px] text-text-muted tracking-widest uppercase mt-1">
					Digital Table
				</p>
			</motion.div>
		</div>
	);
}

export default function OrderSuccessPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = React.use(params);

	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-background flex items-center justify-center">
					<div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
				</div>
			}
		>
			<SuccessContent slug={slug} />
		</Suspense>
	);
}
