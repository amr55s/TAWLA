import React, { useState, useEffect } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { Category } from "@/types/database";

const supabase = createClient();

function Field({
	label,
	value,
	onChange,
	type = "text",
	dir,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	dir?: "rtl" | "ltr";
}) {
	const cls =
		"w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-primary transition-colors";
	return (
		<div className="mb-4">
			<label className="text-xs font-semibold text-text-secondary mb-1.5 block">
				{label}
			</label>
			<input
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				dir={dir}
				className={cls}
			/>
		</div>
	);
}

interface CategoryFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	restaurantId: string;
	categories: Category[];
	onSaveSuccess: () => void;
}

export function CategoryFormModal({
	isOpen,
	onClose,
	restaurantId,
	categories,
	onSaveSuccess,
}: CategoryFormModalProps) {
	const [categoryForm, setCategoryForm] = useState({
		name_en: "",
		name_ar: "",
	});
	const [savingCategory, setSavingCategory] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setCategoryForm({ name_en: "", name_ar: "" });
			setSavingCategory(false);
		}
	}, [isOpen]);

	const handleCategorySave = async () => {
		if (!categoryForm.name_en.trim()) {
			toast.error("Category name (English) is required");
			return;
		}

		if (!restaurantId) return;

		setSavingCategory(true);

		try {
			let nextSortOrder = 0;
			if (categories.length > 0) {
				nextSortOrder =
					Math.max(...categories.map((c) => c.sort_order || 0)) + 1;
			}

			const { error } = await supabase.from("categories").insert({
				restaurant_id: restaurantId,
				name_en: categoryForm.name_en.trim(),
				name_ar: categoryForm.name_ar.trim() || categoryForm.name_en.trim(),
				sort_order: nextSortOrder,
			});

			if (error) throw error;

			toast.success("Category created successfully");
			onSaveSuccess();
			onClose();
		} catch (err: unknown) {
			logger.error("Create category error:", err);
			toast.error(err instanceof Error ? `Create failed: ${err.message}` : "Create failed");
		} finally {
			setSavingCategory(false);
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 bg-black/40 z-50"
			/>
			<motion.div
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 40 }}
				transition={{ type: "spring", damping: 28, stiffness: 300 }}
				className="fixed inset-x-4 top-[15vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[480px] bg-background-card rounded-2xl z-50 shadow-float overflow-hidden"
			>
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-bold text-text-heading">Add Category</h3>
						<button
							onClick={onClose}
							className="w-8 h-8 rounded-lg bg-border-light flex items-center justify-center text-text-secondary hover:bg-border-medium transition-colors"
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
								<path d="M18 6 6 18" />
								<path d="m6 6 12 12" />
							</svg>
						</button>
					</div>

					<Field
						label="Name (English) *"
						value={categoryForm.name_en}
						onChange={(v) => setCategoryForm({ ...categoryForm, name_en: v })}
					/>
					<Field
						label="Name (Arabic)"
						value={categoryForm.name_ar}
						onChange={(v) => setCategoryForm({ ...categoryForm, name_ar: v })}
						dir="rtl"
					/>

					<div className="flex gap-3 mt-8">
						<button
							onClick={onClose}
							className="flex-1 py-3 rounded-xl border border-border-medium text-sm font-semibold text-text-secondary hover:bg-border-light transition-colors"
						>
							Cancel
						</button>
						<motion.button
							whileTap={{ scale: 0.97 }}
							onClick={handleCategorySave}
							disabled={savingCategory}
							className="flex-1 py-3 rounded-xl bg-[#0F4C75] hover:bg-[#0A3558] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
						>
							{savingCategory ? (
								<div className="flex items-center justify-center gap-2">
									<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
									Saving...
								</div>
							) : (
								"Create Category"
							)}
						</motion.button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
