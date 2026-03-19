"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	CategoryTabs,
	DishCard,
	FloatingNavBar,
	ItemDetailSheet,
} from "@/components/ui";
import { useCartStore } from "@/store/cart";
import type {
	Category,
	MenuItem,
	MenuItemWithCategory,
	Restaurant,
} from "@/types/database";

interface MenuContentClientProps {
	restaurant: Restaurant;
	categories: Category[];
	menuItems: MenuItemWithCategory[];
	slug: string;
}

export function MenuContentClient({
	restaurant,
	categories,
	menuItems,
	slug,
}: MenuContentClientProps) {
	const router = useRouter();

	const [activeCategory, setActiveCategory] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const cartStore = useCartStore();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const addItem = cartStore.addItem;
	const cartCount = mounted ? cartStore.getTotalItems() : 0;
	const tableNumber = mounted ? cartStore.tableNumber : null;

	const filteredItems = useMemo(() => {
		let items = menuItems;

		if (activeCategory) {
			items = items.filter((item) => item.category_id === activeCategory);
		}

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			items = items.filter(
				(item) =>
					item.name_en.toLowerCase().includes(query) ||
					item.name_ar.includes(query) ||
					(item.description_en &&
						item.description_en.toLowerCase().includes(query)) ||
					(item.description_ar && item.description_ar.includes(query)),
			);
		}

		return items;
	}, [menuItems, activeCategory, searchQuery]);

	const handleAddToCart = useCallback(
		(item: MenuItem) => {
			addItem(item);
			posthog.capture("item_added_to_cart", {
				item_id: item.id,
				item_name: item.name_en,
				item_price: item.price,
				restaurant_slug: slug,
				source: "menu_card",
			});
		},
		[addItem, slug],
	);

	const handleCardClick = useCallback((item: MenuItem) => {
		setSelectedItem(item);
		setIsSheetOpen(true);
	}, []);

	const handleSheetAddToCart = useCallback(
		(item: MenuItem, quantity: number) => {
			for (let i = 0; i < quantity; i++) {
				addItem(item);
			}
			posthog.capture("item_added_to_cart", {
				item_id: item.id,
				item_name: item.name_en,
				item_price: item.price,
				quantity,
				restaurant_slug: slug,
				source: "item_detail_sheet",
			});
		},
		[addItem, slug],
	);

	const handleCloseSheet = useCallback(() => {
		setIsSheetOpen(false);
		setSelectedItem(null);
	}, []);

	return (
		<div className="min-h-screen bg-background pb-28">
			{/* Header */}
			<header className="bg-background px-5 pt-6 pb-2">
				<div className="flex items-center justify-between mb-1">
					<div>
						<p className="text-sm text-text-muted">
							{tableNumber ? `Table ${tableNumber}` : "Welcome"} 👋
						</p>
						<h1 className="text-xl font-bold text-text-heading">Menu</h1>
					</div>
					<button
						onClick={() => router.push(`/${slug}`)}
						className="w-10 h-10 rounded-xl bg-background-card flex items-center justify-center text-text-muted hover:bg-border-light transition-colors"
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
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>

				{/* Search Bar */}
				<div className="flex items-center gap-3 px-4 py-3 bg-background-card rounded-2xl mt-4">
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
						className="text-text-muted flex-shrink-0"
					>
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search for your favorite dish..."
						className="flex-1 bg-transparent text-sm text-text-body placeholder:text-text-muted outline-none"
					/>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className="text-text-muted hover:text-text-body"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</button>
					)}
				</div>
			</header>

			{/* Category Tabs */}
			<CategoryTabs
				categories={categories}
				activeCategory={activeCategory}
				onCategoryChange={setActiveCategory}
				showAllOption={true}
			/>

			{/* Menu Grid */}
			<main className="px-4 pt-2 pb-4">
				{filteredItems.length > 0 ? (
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
						<AnimatePresence mode="popLayout">
							{filteredItems.map((item) => (
								<motion.div
									key={item.id}
									layout
									initial={{ opacity: 0, scale: 0.9, y: 10 }}
									animate={{ opacity: 1, scale: 1, y: 0 }}
									exit={{ opacity: 0, scale: 0.8 }}
									transition={{ duration: 0.25 }}
								>
									<DishCard
										item={{
											...item,
											badge:
												(item as MenuItem & { badge?: string }).badge || null,
										}}
										onAddToCart={handleAddToCart}
										onCardClick={handleCardClick}
									/>
								</motion.div>
							))}
						</AnimatePresence>
					</div>
				) : (
					<div className="text-center py-16">
						<div className="w-16 h-16 bg-border-light rounded-full flex items-center justify-center mx-auto mb-4">
							<span className="text-3xl">🍣</span>
						</div>
						<p className="text-text-muted">
							{searchQuery ? "No dishes found" : "No items in this category"}
						</p>
					</div>
				)}
			</main>

			{/* Floating Nav Bar */}
			<FloatingNavBar restaurantSlug={slug} cartCount={cartCount} />

			{/* Item Detail Sheet */}
			<ItemDetailSheet
				item={selectedItem}
				isOpen={isSheetOpen}
				onClose={handleCloseSheet}
				onAddToCart={handleSheetAddToCart}
			/>
		</div>
	);
}
