import React, { useState, useEffect } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import type { Category, MenuItem } from "@/types/database";

const supabase = createClient();

interface FormData {
	name_en: string;
	name_ar: string;
	description_en: string;
	description_ar: string;
	category_id: string;
	price: string;
	is_available: boolean;
}

const emptyForm: FormData = {
	name_en: "",
	name_ar: "",
	description_en: "",
	description_ar: "",
	category_id: "",
	price: "",
	is_available: true,
};

function Field({
	label,
	value,
	onChange,
	type = "text",
	multiline = false,
	dir,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	multiline?: boolean;
	dir?: "rtl" | "ltr";
}) {
	const cls =
		"w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-primary transition-colors";
	return (
		<div className="mb-4">
			<label className="text-xs font-semibold text-text-secondary mb-1.5 block">
				{label}
			</label>
			{multiline ? (
				<textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					dir={dir}
					rows={3}
					className={clsx(cls, "resize-none")}
				/>
			) : (
				<input
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					dir={dir}
					step={type === "number" ? "0.001" : undefined}
					className={cls}
				/>
			)}
		</div>
	);
}

interface MenuFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	restaurantId: string;
	categories: Category[];
	editingItem: MenuItem | null;
	onSaveSuccess: () => void;
	onOpenCategoryCreate: () => void;
}

export function MenuFormModal({
	isOpen,
	onClose,
	restaurantId,
	categories,
	editingItem,
	onSaveSuccess,
	onOpenCategoryCreate,
}: MenuFormModalProps) {
	const [form, setForm] = useState<FormData>(emptyForm);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (isOpen) {
			if (editingItem) {
				setForm({
					name_en: editingItem.name_en,
					name_ar: editingItem.name_ar || "",
					description_en: editingItem.description_en || "",
					description_ar: editingItem.description_ar || "",
					category_id: editingItem.category_id,
					price: editingItem.price.toString(),
					is_available: editingItem.is_available ?? true,
				});
				setImagePreview(editingItem.image_url || null);
			} else {
				setForm(emptyForm);
				setImagePreview(null);
			}
			setImageFile(null);
			setSaving(false);
		}
	}, [isOpen, editingItem]);

	const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image must be under 5MB");
			return;
		}
		setImageFile(file);
		setImagePreview(URL.createObjectURL(file));
	};

	const uploadImage = async (file: File): Promise<string | null> => {
		const ext = file.name.split(".").pop() || "jpg";
		const path = `items/${uuidv4()}.${ext}`;

		const { error } = await supabase.storage
			.from("menu-images")
			.upload(path, file, { cacheControl: "3600", upsert: false });

		if (error) {
			logger.error("Upload error:", error);
			toast.error(`Image upload failed: ${error.message}`);
			return null;
		}

		const { data: urlData } = supabase.storage
			.from("menu-images")
			.getPublicUrl(path);

		return urlData.publicUrl;
	};

	const handleSave = async () => {
		if (!form.name_en.trim() || !form.category_id || !form.price) {
			toast.error("Please fill in all required fields");
			return;
		}

		setSaving(true);

		try {
			let imageUrl = editingItem?.image_url || null;

			if (imageFile) {
				const uploaded = await uploadImage(imageFile);
				if (uploaded) {
					imageUrl = uploaded;
				} else {
					setSaving(false);
					return;
				}
			}

			const priceNum = parseFloat(form.price);
			if (isNaN(priceNum) || priceNum < 0) {
				toast.error("Invalid price value");
				setSaving(false);
				return;
			}

			const payload = {
				restaurant_id: restaurantId,
				name_en: form.name_en.trim(),
				name_ar: form.name_ar.trim() || form.name_en.trim(),
				description_en: form.description_en.trim() || null,
				description_ar: form.description_ar.trim() || null,
				category_id: form.category_id,
				price: priceNum,
				is_available: form.is_available,
				image_url: imageUrl,
			};

			if (editingItem) {
				const { error } = await supabase
					.from("menu_items")
					.update(payload)
					.eq("id", editingItem.id);
				if (error) throw error;
				toast.success("Item updated successfully");
			} else {
				const { error } = await supabase.from("menu_items").insert(payload);
				if (error) throw error;
				toast.success("Item created successfully");
			}

			onClose();
			onSaveSuccess();
		} catch (err: unknown) {
			logger.error("Menu item save error:", err);
			const message =
				err instanceof Error ? err.message : "Save failed — check console for details";
			toast.error(message);
		} finally {
			setSaving(false);
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
				className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[540px] bg-background-card rounded-2xl z-50 shadow-float overflow-y-auto"
			>
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h3 className="text-lg font-bold text-text-heading">
							{editingItem ? "Edit Item" : "Add Item"}
						</h3>
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

					{/* Image upload */}
					<div className="mb-5">
						<label className="text-xs font-semibold text-text-secondary mb-2 block">
							Image
						</label>
						<div className="relative w-full h-40 rounded-2xl overflow-hidden bg-border-light mb-2">
							{imagePreview ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={imagePreview}
									alt="Preview"
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center text-text-muted">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="32"
										height="32"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
										<circle cx="9" cy="9" r="2" />
										<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
									</svg>
								</div>
							)}
						</div>
						<input
							type="file"
							accept="image/*"
							onChange={handleImageChange}
							className="text-xs text-text-secondary file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
						/>
					</div>

					<Field
						label="Name (English) *"
						value={form.name_en}
						onChange={(v) => setForm({ ...form, name_en: v })}
					/>
					<Field
						label="Name (Arabic)"
						value={form.name_ar}
						onChange={(v) => setForm({ ...form, name_ar: v })}
						dir="rtl"
					/>
					<Field
						label="Description (English)"
						value={form.description_en}
						onChange={(v) => setForm({ ...form, description_en: v })}
						multiline
					/>
					<Field
						label="Description (Arabic)"
						value={form.description_ar}
						onChange={(v) => setForm({ ...form, description_ar: v })}
						multiline
						dir="rtl"
					/>

					<div className="mb-4">
						<div className="flex items-center justify-between mb-1.5">
							<label className="text-xs font-semibold text-text-secondary block">
								Category *
							</label>
							<button
								onClick={() => {
									onClose();
									onOpenCategoryCreate();
								}}
								className="text-xs font-semibold text-[#0F4C75] hover:text-[#0A3558] transition-colors"
							>
								+ New Category
							</button>
						</div>
						<select
							value={form.category_id}
							onChange={(e) => setForm({ ...form, category_id: e.target.value })}
							className="w-full py-2.5 px-3 bg-background border border-border-light rounded-xl text-sm text-text-body focus:outline-none focus:border-[#0F4C75] transition-colors"
						>
							<option value="">Select category</option>
							{categories.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name_en}
								</option>
							))}
						</select>
						{categories.length === 0 && (
							<p className="text-xs text-red-500 mt-1.5 font-medium">
								Please construct a category first.
							</p>
						)}
					</div>

					<Field
						label="Price (KD) *"
						value={form.price}
						onChange={(v) => setForm({ ...form, price: v })}
						type="number"
					/>

					<div className="mb-6 flex items-center gap-3">
						<button
							type="button"
							role="switch"
							aria-checked={form.is_available}
							onClick={() => setForm({ ...form, is_available: !form.is_available })}
							className={clsx(
								"relative w-11 h-6 rounded-full transition-colors",
								form.is_available ? "bg-[#0F4C75]" : "bg-border-heavy"
							)}
						>
							<span
								className={clsx(
									"absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
									form.is_available ? "translate-x-[22px]" : "translate-x-0.5"
								)}
							/>
						</button>
						<span className="text-sm text-text-body">Available on menu</span>
					</div>

					<div className="flex gap-3">
						<button
							onClick={onClose}
							className="flex-1 py-3 rounded-xl border border-border-medium text-sm font-semibold text-text-secondary hover:bg-border-light transition-colors"
						>
							Cancel
						</button>
						<motion.button
							whileTap={{ scale: 0.97 }}
							onClick={handleSave}
							disabled={saving || categories.length === 0}
							className="flex-1 py-3 rounded-xl bg-[#0F4C75] hover:bg-[#0A3558] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
						>
							{saving ? (
								<div className="flex items-center justify-center gap-2">
									<div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
									Saving...
								</div>
							) : editingItem ? (
								"Update Item"
							) : (
								"Create Item"
							)}
						</motion.button>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
