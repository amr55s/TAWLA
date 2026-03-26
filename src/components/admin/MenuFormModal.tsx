import React, { useEffect, useState } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
	CldUploadWidget,
	type CldUploadWidgetPropsChildren,
	type CloudinaryUploadWidgetError,
	type CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { ImagePlus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";
import type { Category, MenuItem } from "@/types/database";

const supabase = createClient();

const CLOUDINARY_UPLOAD_PRESET = "tawla_unsigned_preset";

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
	placeholder,
	required = false,
	helpText,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	multiline?: boolean;
	dir?: "rtl" | "ltr";
	placeholder?: string;
	required?: boolean;
	helpText?: string;
}) {
	const className =
		"w-full rounded-[22px] border border-[#D6E4F0] bg-white px-4 py-3 text-sm text-[#0A1628] placeholder:text-[#8CA0B8] shadow-[0_10px_30px_-24px_rgba(15,76,117,0.45)] transition focus:border-[#0F4C75] focus:outline-none focus:ring-4 focus:ring-[#0F4C75]/10";

	return (
		<div className="space-y-2">
			<label className="block text-sm font-semibold text-[#10233E]">
				{label}
				{required ? <span className="ml-1 text-[#0F4C75]">*</span> : null}
			</label>
			{multiline ? (
				<textarea
					value={value}
					onChange={(e) => onChange(e.target.value)}
					dir={dir}
					rows={4}
					placeholder={placeholder}
					className={clsx(className, "min-h-[124px] resize-none rounded-[28px] py-4")}
				/>
			) : (
				<input
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					dir={dir}
					placeholder={placeholder}
					step={type === "number" ? "0.001" : undefined}
					className={className}
				/>
			)}
			{helpText ? <p className="text-xs text-[#70839A]">{helpText}</p> : null}
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

function extractSecureUrl(result: CloudinaryUploadWidgetResults): string | undefined {
	if (!result || typeof result !== "object") return undefined;
	const info = (result as { info?: unknown }).info;
	if (!info || typeof info !== "object") return undefined;
	const url = (info as { secure_url?: unknown }).secure_url;
	return typeof url === "string" ? url : undefined;
}

function getUploadErrorMessage(error: CloudinaryUploadWidgetError): string {
	if (typeof error === "string") return error;
	if (
		error &&
		typeof error === "object" &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}
	if (
		error &&
		typeof error === "object" &&
		"statusText" in error &&
		typeof error.statusText === "string"
	) {
		return error.statusText;
	}
	return "Upload failed";
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
	const [imageUrl, setImageUrl] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!isOpen) return;

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
			setImageUrl(editingItem.image_url || null);
		} else {
			setForm(emptyForm);
			setImageUrl(null);
		}

		setSaving(false);
	}, [editingItem, isOpen]);

	const previewSrc = imageUrl ? getOptimizedImageUrl(imageUrl) : null;

	const handleSave = async () => {
		if (!form.name_en.trim() || !form.category_id || !form.price) {
			toast.error("Please fill in all required fields");
			return;
		}

		setSaving(true);

		try {
			const priceNum = parseFloat(form.price);
			if (Number.isNaN(priceNum) || priceNum < 0) {
				toast.error("Invalid price value");
				setSaving(false);
				return;
			}

			const nameEn = form.name_en.trim();
			const nameAr = form.name_ar.trim() || nameEn;
			const payload = {
				restaurant_id: restaurantId,
				name_en: nameEn,
				name_ar: nameAr,
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
				err instanceof Error ? err.message : "Save failed. Please try again.";
			toast.error(message);
		} finally {
			setSaving(false);
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			<motion.div
				key="menu-modal-backdrop"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				onClick={onClose}
				className="fixed inset-0 z-50 bg-[#0A1628]/28 backdrop-blur-[2px]"
			/>

			<motion.div
				key="menu-modal-panel"
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 40 }}
				transition={{ type: "spring", damping: 28, stiffness: 300 }}
				className="fixed inset-x-4 bottom-[3vh] top-[3vh] z-50 overflow-y-auto rounded-[32px] border border-[#DCE8F2] bg-white shadow-[0_40px_120px_-32px_rgba(10,22,40,0.22)] md:inset-x-auto md:left-1/2 md:w-[720px] md:-translate-x-1/2"
			>
				<div className="relative overflow-hidden">
					<div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_right,_rgba(187,225,250,0.9),_transparent_48%),linear-gradient(180deg,_rgba(240,247,252,0.92),_rgba(255,255,255,0))]" />

					<div className="relative space-y-8 p-6 md:p-8">
						<div className="flex items-start justify-between gap-4">
							<div className="space-y-3">
								<div className="inline-flex items-center gap-2 rounded-full border border-[#D6E4F0] bg-[#F5FAFE] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#0F4C75]">
									<Sparkles className="h-3.5 w-3.5" />
									Menu Studio
								</div>
								<div className="space-y-2">
									<h3 className="font-display text-2xl text-[#0A1628] md:text-[2rem]">
										{editingItem ? "Refine your dish details" : "Create a polished menu item"}
									</h3>
									<p className="max-w-2xl text-sm leading-6 text-[#5F7390]">
										Use the same clean, premium language your guests see across the
										Tawla experience. Add a strong image, a clear name, and the right
										category before publishing.
									</p>
								</div>
							</div>

							<button
								type="button"
								onClick={onClose}
								className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D6E4F0] bg-white text-[#5C6B7A] transition hover:border-[#0F4C75]/30 hover:text-[#0F4C75]"
								aria-label="Close menu item form"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
							<div className="space-y-6">
								<div className="rounded-[28px] border border-[#D6E4F0] bg-[linear-gradient(180deg,#F9FCFF_0%,#FFFFFF_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(15,76,117,0.45)]">
									<div className="mb-4 flex items-start justify-between gap-4">
										<div>
											<p className="text-sm font-semibold text-[#10233E]">Dish image</p>
											<p className="mt-1 text-xs leading-5 text-[#70839A]">
												Upload one clean hero shot. The preview stays inside the form,
												not as a raw Cloudinary link.
											</p>
										</div>
										<div className="rounded-full border border-[#DDEAF3] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6E84A1]">
											Cloudinary
										</div>
									</div>

									<div className="space-y-4">
										<div className="relative overflow-hidden rounded-[28px] border border-dashed border-[#BFD5E6] bg-[#F5FAFE]">
											{previewSrc ? (
												<div className="relative aspect-[16/10] w-full">
													{/* eslint-disable-next-line @next/next/no-img-element */}
													<img
														src={previewSrc}
														alt="Menu item preview"
														className="h-full w-full object-cover"
													/>
													<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A1628]/18 via-transparent to-white/10" />
													<button
														type="button"
														onClick={() => setImageUrl(null)}
														className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[#10233E] shadow-[0_18px_34px_-18px_rgba(10,22,40,0.5)] transition hover:bg-white"
														aria-label="Remove uploaded image"
													>
														<Trash2 className="h-4 w-4" />
													</button>
												</div>
											) : (
												<div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 px-6 text-center">
													<div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0F4C75] shadow-[0_18px_34px_-18px_rgba(15,76,117,0.45)]">
														<ImagePlus className="h-7 w-7" />
													</div>
													<div className="space-y-1">
														<p className="text-base font-semibold text-[#10233E]">
															Upload a polished item photo
														</p>
														<p className="text-sm leading-6 text-[#70839A]">
															Choose a bright, high-quality image that feels premium on
															mobile and tablet.
														</p>
													</div>
												</div>
											)}
										</div>

										<CldUploadWidget
											uploadPreset={CLOUDINARY_UPLOAD_PRESET}
											options={{
												multiple: false,
												maxFiles: 1,
												resourceType: "image",
											}}
											onSuccess={(result: CloudinaryUploadWidgetResults) => {
												const url = extractSecureUrl(result);
												if (!url) {
													toast.error("Upload finished, but no secure image URL was returned.");
													return;
												}
												setImageUrl(url);
												toast.success("Image uploaded successfully");
											}}
											onError={(err: CloudinaryUploadWidgetError) => {
												toast.error(getUploadErrorMessage(err));
											}}
										>
											{({
												open,
												isLoading,
											}: CldUploadWidgetPropsChildren) => (
												<div className="flex flex-wrap items-center gap-3">
													<button
														type="button"
														onClick={() => open()}
														disabled={isLoading}
														className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full bg-[#0A1628] px-5 text-sm font-semibold text-white shadow-[0_22px_44px_-24px_rgba(10,22,40,0.65)] transition hover:bg-[#102C46] disabled:cursor-not-allowed disabled:opacity-60"
													>
														{isLoading ? (
															<>
																<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
																Opening uploader
															</>
														) : (
															<>
																<ImagePlus className="h-4 w-4" />
																{imageUrl ? "Replace image" : "Upload image"}
															</>
														)}
													</button>
													<p className="text-xs leading-5 text-[#70839A]">
														Upload once and the secure Cloudinary URL is stored directly on
														the menu item record.
													</p>
												</div>
											)}
										</CldUploadWidget>
									</div>
								</div>

								<div className="grid gap-6 md:grid-cols-2">
									<Field
										label="Name (English)"
										required
										value={form.name_en}
										onChange={(v) => setForm({ ...form, name_en: v })}
										placeholder="Classic burger"
									/>
									<Field
										label="Price"
										required
										value={form.price}
										onChange={(v) => setForm({ ...form, price: v })}
										type="number"
										placeholder="0.000"
										helpText="Use your store currency format. Decimal values are supported."
									/>
								</div>

								<div className="grid gap-6 md:grid-cols-2">
									<Field
										label="الاسم (عربي)"
										value={form.name_ar}
										onChange={(v) => setForm({ ...form, name_ar: v })}
										dir="rtl"
										placeholder="برجر كلاسيك"
									/>
									<div className="space-y-2">
										<div className="flex items-center justify-between gap-3">
											<label className="block text-sm font-semibold text-[#10233E]">
												Category<span className="ml-1 text-[#0F4C75]">*</span>
											</label>
											<button
												type="button"
												onClick={() => {
													onClose();
													onOpenCategoryCreate();
												}}
												className="text-xs font-semibold text-[#0F4C75] transition hover:text-[#0A3558]"
											>
												+ New category
											</button>
										</div>
										<select
											value={form.category_id}
											onChange={(e) => setForm({ ...form, category_id: e.target.value })}
											className="w-full rounded-[22px] border border-[#D6E4F0] bg-white px-4 py-3 text-sm text-[#0A1628] shadow-[0_10px_30px_-24px_rgba(15,76,117,0.45)] transition focus:border-[#0F4C75] focus:outline-none focus:ring-4 focus:ring-[#0F4C75]/10"
										>
											<option value="">Select category</option>
											{categories.map((category) => (
												<option key={category.id} value={category.id}>
													{category.name_en}
												</option>
											))}
										</select>
										{categories.length === 0 ? (
											<p className="text-xs font-medium text-[#C25E3D]">
												Create a category first before saving this item.
											</p>
										) : (
											<p className="text-xs text-[#70839A]">
												Choose the collection where guests should find this dish.
											</p>
										)}
									</div>
								</div>

								<Field
									label="Description (English)"
									value={form.description_en}
									onChange={(v) => setForm({ ...form, description_en: v })}
									multiline
									placeholder="A concise description that helps guests choose quickly."
								/>

								<Field
									label="الوصف (عربي)"
									value={form.description_ar}
									onChange={(v) => setForm({ ...form, description_ar: v })}
									multiline
									dir="rtl"
									placeholder="وصف مختصر وواضح للصنف"
								/>
							</div>

							<div className="space-y-6">
								<div className="rounded-[28px] border border-[#D6E4F0] bg-white p-5 shadow-[0_24px_60px_-42px_rgba(15,76,117,0.45)]">
									<p className="text-sm font-semibold text-[#10233E]">Availability</p>
									<p className="mt-1 text-xs leading-5 text-[#70839A]">
										Toggle whether the dish appears immediately on the guest menu.
									</p>

									<div className="mt-5 rounded-[24px] border border-[#E3EDF5] bg-[#F8FBFE] p-4">
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="text-sm font-semibold text-[#10233E]">
													Visible to guests
												</p>
												<p className="mt-1 text-xs leading-5 text-[#70839A]">
													Turn this off for sold-out items, seasonal dishes, or menu drafts.
												</p>
											</div>
											<button
												type="button"
												role="switch"
												aria-checked={form.is_available}
												onClick={() =>
													setForm({ ...form, is_available: !form.is_available })
												}
												className={clsx(
													"relative h-7 w-12 rounded-full transition",
													form.is_available ? "bg-[#0F4C75]" : "bg-[#C7D4E2]",
												)}
											>
												<span
													className={clsx(
														"absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
														form.is_available ? "translate-x-6" : "translate-x-1",
													)}
												/>
											</button>
										</div>
										<div className="mt-4 inline-flex rounded-full border border-[#DCE8F2] bg-white px-3 py-1.5 text-xs font-semibold text-[#0F4C75]">
											{form.is_available ? "Currently available" : "Hidden from guests"}
										</div>
									</div>
								</div>

								<div className="rounded-[28px] border border-[#D6E4F0] bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFE_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(15,76,117,0.45)]">
									<p className="text-sm font-semibold text-[#10233E]">Publishing notes</p>
									<ul className="mt-4 space-y-3 text-sm leading-6 text-[#5F7390]">
										<li className="rounded-[20px] border border-[#E3EDF5] bg-white px-4 py-3">
											Use one strong, well-lit image instead of multiple inconsistent angles.
										</li>
										<li className="rounded-[20px] border border-[#E3EDF5] bg-white px-4 py-3">
											Keep titles short. Most guests scan menu cards quickly on mobile.
										</li>
										<li className="rounded-[20px] border border-[#E3EDF5] bg-white px-4 py-3">
											Write descriptions that explain taste or ingredients, not generic filler.
										</li>
									</ul>
								</div>
							</div>
						</div>

						<div className="flex flex-col-reverse gap-3 border-t border-[#E7EEF5] pt-6 sm:flex-row sm:justify-end">
							<button
								type="button"
								onClick={onClose}
								className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[#D6E4F0] bg-white px-6 text-sm font-semibold text-[#4F647F] transition hover:border-[#0F4C75]/20 hover:text-[#0F4C75]"
							>
								Cancel
							</button>
							<motion.button
								type="button"
								whileTap={{ scale: 0.985 }}
								onClick={handleSave}
								disabled={saving || categories.length === 0}
								className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#0A1628] px-6 text-sm font-semibold text-white shadow-[0_24px_46px_-24px_rgba(10,22,40,0.7)] transition hover:bg-[#102C46] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{saving ? (
									<>
										<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
										Saving item
									</>
								) : editingItem ? (
									"Save changes"
								) : (
									"Create item"
								)}
							</motion.button>
						</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
