"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import type { MenuItem } from "@/types/database";
import { MenuItemImage } from "./MenuItemImage";

interface DishCardProps {
	item: MenuItem & { badge?: string | null };
	onAddToCart: (item: MenuItem) => void;
	onCardClick?: (item: MenuItem) => void;
	locale?: "en" | "ar";
	className?: string;
	disabled?: boolean;
}

export function DishCard({
	item,
	onAddToCart,
	onCardClick,
	locale = "en",
	className,
	disabled = false,
}: DishCardProps) {
	const name = locale === "ar" ? item.name_ar : item.name_en;
	const description =
		locale === "ar" ? item.description_ar : item.description_en;

	const getBadgeStyle = (badge: string | null | undefined) => {
		if (!badge) return null;

		const lowerBadge = badge.toLowerCase();
		if (lowerBadge.includes("chef") || lowerBadge.includes("choice")) {
			return "bg-primary text-white";
		}
		if (lowerBadge.includes("premium")) {
			return "bg-secondary text-white";
		}
		if (lowerBadge.includes("popular")) {
			return "bg-red-500 text-white";
		}
		return "bg-text-muted text-white";
	};

	const handleCardClick = () => {
		if (onCardClick) {
			onCardClick(item);
		}
	};

	const handleAddClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (disabled) return;
		onAddToCart(item);
	};

	return (
		<motion.div
			whileTap={{ scale: 0.98 }}
			onClick={handleCardClick}
			className={clsx(
				"bg-white rounded-2xl overflow-hidden shadow-card cursor-pointer transition-shadow hover:shadow-float",
				disabled && "opacity-70",
				className,
			)}
		>
			{/* Image Container */}
			<div className="relative w-full h-32 overflow-hidden">
				<MenuItemImage
					src={item.image_url}
					alt={name}
					sizes="(max-width: 768px) 50vw, 200px"
				/>

				{/* Badge */}
				{item.badge && (
					<span
						className={clsx(
							"absolute top-2 start-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
							getBadgeStyle(item.badge),
						)}
					>
						{item.badge}
					</span>
				)}
			</div>

			{/* Content */}
			<div className="p-3">
				{/* Title */}
				<h3 className="text-sm font-bold text-text-heading leading-tight mb-1 line-clamp-2">
					{name}
				</h3>

				{/* Description */}
				{description && (
					<p className="text-[11px] text-text-muted leading-snug line-clamp-2 mb-2">
						{description}
					</p>
				)}

				{/* Price Row */}
				<div className="flex items-center justify-between mt-auto">
					<div className="text-primary font-bold">
						<span className="text-base">{item.price.toFixed(3)}</span>
						<span className="text-[10px] text-text-muted ms-1 font-normal">
							KD
						</span>
					</div>

					{/* Add Button */}
					<motion.button
						whileTap={{ scale: 0.9 }}
						onClick={handleAddClick}
						disabled={disabled}
						className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm disabled:cursor-not-allowed disabled:bg-[#B0B8C4]"
						aria-label={`Add ${name} to cart`}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
					</motion.button>
				</div>
			</div>
		</motion.div>
	);
}
