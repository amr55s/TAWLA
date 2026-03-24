"use client";

import { createBrowserClient } from "@supabase/ssr";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import posthog from "posthog-js";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MenuItemImage } from "@/components/ui/MenuItemImage";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";
import type { Category, MenuItem } from "@/types/database";

import { logger } from "@/lib/logger";
import { MenuFormModal } from "@/components/admin/MenuFormModal";
import { CategoryFormModal } from "@/components/admin/CategoryFormModal";

const supabase = createClient();

export default function AdminMenuPage() {
	const { restaurantId, loading: restLoading } = useRestaurant();
	const [items, setItems] = useState<MenuItem[]>([]);
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);

	// Category State
	const [showCategoryForm, setShowCategoryForm] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);


	const fetchData = useCallback(async () => {
		if (!restaurantId) return;
		setLoading(true);

		// First fetch categories for this restaurant
		const { data: categoriesData, error: catsError } = await supabase
			.from("categories")
			.select("*")
			.eq("restaurant_id", restaurantId)
			.order("sort_order", { ascending: true });

		if (catsError) {
			logger.error("Fetch categories error:", catsError);
		}

		const validCategories = categoriesData || [];
		setCategories(validCategories);

		if (validCategories.length === 0) {
			setItems([]);
			setLoading(false);
			return;
		}

		const categoryIds = validCategories.map((c: any) => c.id);

		// Then fetch only items for these categories
		const { data: itemsData, error: itemsError } = await supabase
			.from("menu_items")
			.select("*")
			.in("category_id", categoryIds)
			.order("created_at", { ascending: false });

		if (itemsError) {
			logger.error("Fetch menu_items error:", itemsError);
		}
		setItems(itemsData || []);
		setLoading(false);
	}, [supabase, restaurantId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const openCreate = () => {
		setEditingItem(null);
		setShowForm(true);
	};

	const openEdit = (item: MenuItem) => {
		setEditingItem(item);
		setShowForm(true);
	};

	const closeForm = () => {
		setShowForm(false);
		setEditingItem(null);
	};

	const openCategoryCreate = () => {
		setShowCategoryForm(true);
	};

	const closeCategoryForm = () => {
		setShowCategoryForm(false);
	};

	const handleDelete = async (id: string) => {
		setDeletingId(id);
		try {
			const { error } = await supabase.from("menu_items").delete().eq("id", id);
			if (error) throw error;
			posthog.capture("menu_item_deleted", {
				item_id: id,
				restaurant_id: restaurantId,
			});
			toast.success("Item deleted");
			fetchData();
		} catch (err: unknown) {
			logger.error("Menu delete failed", err);
			const message = err instanceof Error ? err.message : "Delete failed";
			toast.error(message);
		} finally {
			setDeletingId(null);
		}
	};

	const getCategoryName = (catId: string) =>
		categories.find((c) => c.id === catId)?.name_en || "Unknown";

	if (!mounted || restLoading || loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
			</div>
		);
	}

	return (
		<div>
			{/* Header */}
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-text-heading">Menu Items</h2>
				<div className="flex items-center gap-3">
					<motion.button
						whileTap={{ scale: 0.96 }}
						onClick={openCategoryCreate}
						className="px-4 py-2.5 bg-white border border-[#E8ECF1] text-[#0A1628] rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm hover:bg-[#F8FAFC] transition-colors"
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
						Add Category
					</motion.button>
					<motion.button
						whileTap={{ scale: 0.96 }}
						onClick={openCreate}
						className="px-4 py-2.5 bg-[#0F4C75] hover:bg-[#0A3558] text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
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
						Add Item
					</motion.button>
				</div>
			</div>

			{/* Items grid */}
			{categories.length === 0 ? (
				<div className="bg-white rounded-2xl border border-[#E8ECF1] p-12 text-center shadow-sm">
					<div className="w-16 h-16 rounded-2xl bg-[#BBE1FA]/20 border border-[#BBE1FA]/40 flex items-center justify-center mx-auto mb-5">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3282B8]"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
					</div>
					<h3 className="text-lg font-bold text-[#0A1628] mb-2">Your menu is waiting for its first masterpiece 🎨</h3>
					<p className="text-sm text-[#7B8BA3] mb-6 max-w-sm mx-auto">
						Start by creating a category (e.g. "Main Dishes", "Beverages"), then add your delicious items to it.
					</p>
					<motion.button
						whileTap={{ scale: 0.96 }}
						onClick={openCategoryCreate}
						className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F4C75] hover:bg-[#0A3558] text-white text-sm font-semibold transition-colors shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
						Add Your First Category
					</motion.button>
				</div>
			) : items.length === 0 ? (
				<div className="bg-white rounded-2xl border border-[#E8ECF1] p-12 text-center shadow-sm">
					<h3 className="text-lg font-bold text-[#0A1628] mb-2">No menu items yet</h3>
					<p className="text-sm text-[#7B8BA3] mb-6">
						You have {categories.length} categor{categories.length === 1 ? "y" : "ies"}. Add your first item to get started.
					</p>
					<motion.button
						whileTap={{ scale: 0.96 }}
						onClick={openCreate}
						className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0F4C75] hover:bg-[#0A3558] text-white text-sm font-semibold transition-colors shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
						Add First Menu Item
					</motion.button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{items.map((item) => (
						<motion.div
							key={item.id}
							layout
							initial={{ opacity: 0, scale: 0.96 }}
							animate={{ opacity: 1, scale: 1 }}
							className="bg-background-card rounded-2xl overflow-hidden shadow-card"
						>
							<div className="relative w-full h-36">
								<MenuItemImage
									src={item.image_url}
									alt={item.name_en}
									sizes="(max-width: 768px) 100vw, 33vw"
								/>
							</div>
							<div className="p-4">
								<div className="flex items-start justify-between mb-1">
									<h3 className="text-sm font-bold text-text-heading line-clamp-1">
										{item.name_en}
									</h3>
									<span
										className={clsx(
											"text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ms-2",
											item.is_available !== false
												? "bg-sky-100 text-sky-700"
												: "bg-red-100 text-red-600",
										)}
									>
										{item.is_available !== false ? "Available" : "Hidden"}
									</span>
								</div>
								{item.name_ar && (
									<p className="text-xs text-text-muted mb-1" dir="rtl">
										{item.name_ar}
									</p>
								)}
								<p className="text-xs text-text-muted mb-2">
									{getCategoryName(item.category_id)}
								</p>
								<div className="flex items-center justify-between">
									<span className="text-sm font-bold text-primary">
										{item.price.toFixed(3)} KD
									</span>
									<div className="flex gap-1">
										<button
											onClick={() => openEdit(item)}
											className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-text-secondary hover:bg-[#0F4C75] hover:text-white transition-colors"
											aria-label="Edit"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
											</svg>
										</button>
										<button
											onClick={() => handleDelete(item.id)}
											disabled={deletingId === item.id}
											className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-text-secondary hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
											aria-label="Delete"
										>
											{deletingId === item.id ? (
												<div className="animate-spin w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" />
											) : (
												<svg
													xmlns="http://www.w3.org/2000/svg"
													width="14"
													height="14"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													strokeWidth="2"
													strokeLinecap="round"
													strokeLinejoin="round"
												>
													<path d="M3 6h18" />
													<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
													<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
												</svg>
											)}
										</button>
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			)}

			{/* Form modal */}
			{/* Form modals */}
			<MenuFormModal
				isOpen={showForm}
				onClose={closeForm}
				restaurantId={restaurantId || ""}
				categories={categories}
				editingItem={editingItem}
				onSaveSuccess={fetchData}
				onOpenCategoryCreate={() => {
					closeForm();
					openCategoryCreate();
				}}
			/>

			<CategoryFormModal
				isOpen={showCategoryForm}
				onClose={closeCategoryForm}
				restaurantId={restaurantId || ""}
				categories={categories}
				onSaveSuccess={fetchData}
			/>
		</div>
	);
}