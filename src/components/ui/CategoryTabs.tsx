"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Category } from "@/types/database";

interface CategoryTabsProps {
	categories: Category[];
	activeCategory: string;
	onCategoryChange: (categoryId: string) => void;
	locale?: "en" | "ar";
	showAllOption?: boolean;
}

export function CategoryTabs({
	categories,
	activeCategory,
	onCategoryChange,
	locale = "en",
	showAllOption = true,
}: CategoryTabsProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const activeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (activeRef.current && scrollRef.current) {
			const container = scrollRef.current;
			const activeTab = activeRef.current;
			const containerRect = container.getBoundingClientRect();
			const tabRect = activeTab.getBoundingClientRect();

			const scrollLeft =
				tabRect.left -
				containerRect.left -
				containerRect.width / 2 +
				tabRect.width / 2 +
				container.scrollLeft;

			container.scrollTo({
				left: scrollLeft,
				behavior: "smooth",
			});
		}
	}, []);

	const allCategories = showAllOption
		? [
				{
					id: "all",
					name_en: "All",
					name_ar: "الكل",
					restaurant_id: "",
					sort_order: 0,
					created_at: "",
					updated_at: "",
				},
				...categories,
			]
		: categories;

	return (
		<div className="px-5 py-3">
			<div
				ref={scrollRef}
				className="flex gap-2 overflow-x-auto whitespace-nowrap rounded-full bg-white/70 px-1 py-1 scrollbar-hide"
				style={{
					scrollSnapType: "x mandatory",
					WebkitOverflowScrolling: "touch",
				}}
			>
				{allCategories.map((category) => {
					const isActive =
						category.id === activeCategory ||
						(category.id === "all" && !activeCategory);
					const name = locale === "ar" ? category.name_ar : category.name_en;

					return (
						<motion.button
							key={category.id}
							ref={isActive ? activeRef : null}
							onClick={() =>
								onCategoryChange(category.id === "all" ? "" : category.id)
							}
							whileTap={{ scale: 0.97 }}
							className={clsx(
								"flex-shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap",
								isActive
									? "bg-tenant-primary text-white shadow-[0_10px_24px_-18px_rgba(10,22,40,0.28)]"
									: "bg-transparent text-[#5A6B82] hover:bg-[#F5F7FA]",
							)}
							style={{ scrollSnapAlign: "start" }}
						>
							{name}
						</motion.button>
					);
				})}
			</div>
		</div>
	);
}
