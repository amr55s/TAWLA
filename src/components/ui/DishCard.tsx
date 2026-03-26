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
	disabledMessage?: string;
}

export function DishCard({
	item,
	onAddToCart,
	onCardClick,
	locale = "en",
	className,
	disabled = false,
	disabledMessage,
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
				"overflow-hidden rounded-[28px] border border-[#E8ECF1] bg-white shadow-[0_18px_45px_-30px_rgba(10,22,40,0.2)] transition-shadow hover:shadow-[0_22px_55px_-28px_rgba(10,22,40,0.24)]",
				"cursor-pointer",
				disabled && "opacity-70",
				className,
			)}
		>
			{/* Image Container */}
			<div className="relative h-36 w-full overflow-hidden bg-[#F6F8FB]">
				<MenuItemImage
					src={item.image_url}
					alt={name}
					sizes="(max-width: 768px) 50vw, 200px"
				/>

				{/* Badge */}
				{item.badge && (
					<span
						className={clsx(
							"absolute start-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
							getBadgeStyle(item.badge),
						)}
					>
						{item.badge}
					</span>
				)}
			</div>

			{/* Content */}
			<div className="space-y-3 p-4">
				{/* Title */}
				<h3 className="line-clamp-2 text-sm font-bold leading-tight text-[#0A1628]">
					{name}
				</h3>

				{/* Description */}
				{description && (
					<p className="line-clamp-2 text-[11px] leading-5 text-[#7B8BA3]">
						{description}
					</p>
				)}

				{/* Price Row */}
				<div className="flex items-end justify-between gap-3">
					<div className="font-bold text-[#0F4C75]">
						<span className="text-base">{item.price.toFixed(3)}</span>
						<span className="ms-1 text-[10px] font-normal text-[#7B8BA3]">
							KD
						</span>
					</div>

					{disabled ? (
						<div className="rounded-full border border-[#F3C4A7] bg-[#FFF5EC] px-3 py-1.5 text-[10px] font-semibold text-[#9A4D18]">
							{disabledMessage ?? "Service Temporarily Unavailable"}
						</div>
					) : (
						<motion.button
							whileTap={{ scale: 0.9 }}
							onClick={handleAddClick}
							disabled={disabled}
							className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F4C75] text-white shadow-sm"
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
					)}
				</div>
			</div>
		</motion.div>
	);
}
