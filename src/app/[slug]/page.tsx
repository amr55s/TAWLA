"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { NumericKeypad } from "@/components/ui";
import { getRestaurantBySlugClient } from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";

export default function OnboardingPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const router = useRouter();
	const { slug } = React.use(params);
	const [tableNumber, setTableNumber] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { setTableNumber: saveTableNumber, setRestaurantSlug } = useCartStore();

	const handleKeyPress = useCallback(
		(digit: string) => {
			if (tableNumber.length < 3) {
				setTableNumber((prev) => prev + digit);
			}
		},
		[tableNumber],
	);

	const handleBackspace = useCallback(() => {
		setTableNumber((prev) => prev.slice(0, -1));
	}, []);

	const handleProceed = useCallback(async () => {
		if (tableNumber.length === 0 || isSubmitting) return;

		setIsSubmitting(true);
		const num = parseInt(tableNumber, 10);

		try {
			const restaurant = await getRestaurantBySlugClient(slug);
			if (!restaurant) {
				toast.error("Restaurant not found.");
				return;
			}

			const supabase = createClient();
			const { data: tableData, error: tableError } = await supabase
				.from("tables")
				.select("id")
				.eq("restaurant_id", restaurant.id)
				.eq("table_number", num)
				.maybeSingle();

			if (tableError || !tableData) {
				toast.error(
					"Invalid table number. Please ask your waiter for the correct number.",
				);
				return;
			}

			saveTableNumber(tableNumber);
			setRestaurantSlug(slug);
			router.push(`/${slug}/menu?table=${tableNumber}`);
		} catch (error) {
			console.error("Validation error:", error);
			toast.error("Failed to validate table. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}, [
		tableNumber,
		isSubmitting,
		saveTableNumber,
		setRestaurantSlug,
		slug,
		router,
	]);

	return (
		<div
			className="min-h-screen bg-background flex flex-col items-center justify-center p-8"
			suppressHydrationWarning
		>
			{/* Icon */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.4 }}
				className="text-6xl mb-6"
			>
				🪑
			</motion.div>

			{/* Title */}
			<motion.h1
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
				className="text-2xl font-bold text-text-heading mb-2"
			>
				Table Number
			</motion.h1>

			{/* Subtitle */}
			<motion.p
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.15 }}
				className="text-text-muted text-sm mb-8"
			>
				Enter your table number to continue
			</motion.p>

			{/* Table Number Display */}
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.3, delay: 0.2 }}
				className="text-5xl font-bold text-primary tracking-widest mb-8 min-h-[64px] flex items-center justify-center"
				style={{ direction: "ltr", letterSpacing: "8px" }}
			>
				{tableNumber || "_"}
			</motion.div>

			{/* Numeric Keypad */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.3 }}
				className="w-full max-w-[300px]"
			>
				<NumericKeypad
					onKeyPress={handleKeyPress}
					onBackspace={handleBackspace}
					onConfirm={handleProceed}
					showConfirm={!isSubmitting}
				/>
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
					Digital Menu
				</p>
			</motion.div>
		</div>
	);
}
