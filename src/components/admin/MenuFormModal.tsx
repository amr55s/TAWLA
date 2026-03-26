import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Trash2, X } from "lucide-react";
import {
	CldUploadWidget,
	type CldUploadWidgetPropsChildren,
	type CloudinaryUploadWidgetError,
	type CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MenuItemImage } from "@/components/ui/MenuItemImage";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
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
		"w-full rounded-xl border border-[#D6E4F0] bg-white px-4 py-3 text-sm text-[#0A1628] placeholder:text-[#8CA0B8] transition focus:border-[#0F4C75] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/10";

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
					className={clsx(className, "min-h-[112px] resize-none")}
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

function extractSecureUrl(
	result: CloudinaryUploadWidgetResults,
): string | undefined {
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
				className="fixed inset-0 z-50 bg-black/40"
			/>

			<motion.div
				key="menu-modal-panel"
				initial={{ opacity: 0, y: 40 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: 40 }}
				transition={{ type: "spring", damping: 28, stiffness: 300 }}
				className="fixed inset-x-4 top-[5vh] bottom-[5vh] z-50 overflow-y-auto rounded-2xl border border-[#E8ECF1] bg-white shadow-[0_20px_50px_-12px_rgba(15,76,117,0.15)] md:inset-x-auto md:left-1/2 md:w-[560px] md:-translate-x-1/2"
			>
				<div className="p-6">
					<div className="mb-6 flex items-center justify-between">
						<h3 className="text-lg font-bold text-[#0A1628]">
							{editingItem ? "تعديل صنف" : "إضافة صنف"} /{" "}
							<span className="text-[#0F4C75]">
								{editingItem ? "Edit item" : "Add item"}
							</span>
						</h3>
						<button
							type="button"
							onClick={onClose}
							className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#F4F7FA] text-[#5C6B7A] transition-colors hover:bg-[#E8ECF1]"
							aria-label="Close menu item form"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<div className="space-y-5">
						<div className="space-y-2">
							<label className="block text-sm font-semibold text-[#10233E]">
								الصورة · Image
							</label>
							<div className="rounded-xl border border-[#E8ECF1] bg-[#FAFCFE] p-4">
								<div className="relative mb-4 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[#EEF4F8]">
									{previewSrc ? (
										<>
											<MenuItemImage
												src={previewSrc}
												alt="Menu item preview"
												sizes="320px"
											/>
											<button
												type="button"
												onClick={() => setImageUrl(null)}
												className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#10233E] shadow-sm transition hover:bg-[#F8FAFC]"
												aria-label="Remove uploaded image"
											>
												<Trash2 className="h-4 w-4" />
											</button>
										</>
									) : (
										<div className="flex flex-col items-center gap-2 text-center text-[#70839A]">
											<ImagePlus className="h-7 w-7 text-[#0F4C75]" />
											<p className="text-sm">No image uploaded</p>
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
											toast.error(
												"Upload finished, but no secure image URL was returned.",
											);
											return;
										}
										setImageUrl(url);
										toast.success("Image uploaded successfully");
									}}
									onError={(err: CloudinaryUploadWidgetError) => {
										toast.error(getUploadErrorMessage(err));
									}}
								>
									{({ open, isLoading }: CldUploadWidgetPropsChildren) => (
										<div className="flex flex-wrap items-center gap-3">
											<button
												type="button"
												onClick={() => open()}
												disabled={isLoading}
												className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0F4C75] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0A3558] disabled:opacity-60"
											>
												<ImagePlus className="h-4 w-4" />
												{isLoading
													? "Opening..."
													: imageUrl
														? "Replace image"
														: "Upload image"}
											</button>
											{imageUrl ? (
												<button
													type="button"
													onClick={() => setImageUrl(null)}
													className="inline-flex min-h-[44px] items-center rounded-xl border border-[#E8ECF1] bg-white px-3 py-2 text-sm font-semibold text-[#5C6B7A] transition-colors hover:bg-[#F4F7FA]"
												>
													Remove
												</button>
											) : null}
										</div>
									)}
								</CldUploadWidget>
							</div>
						</div>

						<Field
							label="Name (English)"
							required
							value={form.name_en}
							onChange={(v) => setForm({ ...form, name_en: v })}
							placeholder="Classic burger"
						/>

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
								onChange={(e) =>
									setForm({ ...form, category_id: e.target.value })
								}
								className="w-full rounded-xl border border-[#D6E4F0] bg-white px-4 py-3 text-sm text-[#0A1628] transition focus:border-[#0F4C75] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/10"
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
							) : null}
						</div>

						<Field
							label="Price"
							required
							value={form.price}
							onChange={(v) => setForm({ ...form, price: v })}
							type="number"
							placeholder="0.000"
						/>

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

						<div className="flex items-center gap-3">
							<button
								type="button"
								role="switch"
								aria-checked={form.is_available}
								onClick={() =>
									setForm({ ...form, is_available: !form.is_available })
								}
								className={clsx(
									"relative h-6 w-11 rounded-full transition-colors",
									form.is_available ? "bg-[#0F4C75]" : "bg-[#CBD5E1]",
								)}
							>
								<span
									className={clsx(
										"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
										form.is_available
											? "translate-x-[22px]"
											: "translate-x-0.5",
									)}
								/>
							</button>
							<span className="text-sm text-[#0A1628]">Available on menu</span>
						</div>

						<div className="flex gap-3 pt-2">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 rounded-xl border border-[#D6E4F0] bg-white px-4 py-3 text-sm font-semibold text-[#4F647F] transition hover:bg-[#F8FAFC]"
							>
								Cancel
							</button>
							<motion.button
								type="button"
								whileTap={{ scale: 0.985 }}
								onClick={handleSave}
								disabled={saving || categories.length === 0}
								className="flex-1 rounded-xl bg-[#0F4C75] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0A3558] disabled:cursor-not-allowed disabled:opacity-60"
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
