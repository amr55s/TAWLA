"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	CheckCheck,
	Clipboard,
	Eye,
	EyeOff,
	Link as LinkIcon,
	Pencil,
	Plus,
	Shield,
	Sparkles,
	Trash2,
	Users,
	X,
	ExternalLink,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRestaurant } from "@/lib/contexts/RestaurantContext";
import { createClient } from "@/lib/supabase/client";

interface StaffMember {
	id: string;
	restaurant_id: string;
	name: string;
	role: "waiter" | "cashier";
	pin_code: string;
	is_active: boolean;
	created_at: string | null;
}

export default function AdminStaffPage() {
	const supabase = createClient();
	const { restaurantId, loading: restLoading } = useRestaurant();
	const [staff, setStaff] = useState<StaffMember[]>([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [mounted, setMounted] = useState(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Form state
	const [name, setName] = useState("");
	const [role, setRole] = useState<"waiter" | "cashier">("waiter");
	const [pin, setPin] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [showPin, setShowPin] = useState(false);

	const fetchStaff = useCallback(async () => {
		if (!restaurantId) return;
		setLoading(true);

		const { data, error } = await supabase
			.from("restaurant_staff")
			.select("*")
			.eq("restaurant_id", restaurantId)
			.order("created_at", { ascending: false });

		if (error) console.error("Staff fetch error:", error.message || error);
		setStaff((data as StaffMember[]) || []);
		setLoading(false);
	}, [supabase, restaurantId]);

	useEffect(() => {
		fetchStaff();
	}, [fetchStaff]);

	const resetForm = () => {
		setName("");
		setRole("waiter");
		setPin("");
		setIsActive(true);
		setShowPin(false);
		setEditingStaff(null);
	};

	const openCreate = () => {
		resetForm();
		setShowForm(true);
	};

	const openEdit = (s: StaffMember) => {
		setEditingStaff(s);
		setName(s.name);
		setRole(s.role);
		setPin(s.pin_code);
		setIsActive(s.is_active);
		setShowForm(true);
	};

	const handleSave = async () => {
		if (!name.trim() || !pin.match(/^\d{4}$/)) {
			toast.error("Please enter a valid name and 4-digit PIN.");
			return;
		}

		setSaving(true);

		if (!restaurantId) {
			console.error("CRITICAL: No restaurant_id available for insert.");
			toast.error("Restaurant context missing. Please refresh the page.");
			setSaving(false);
			return;
		}

		const payload = {
			restaurant_id: restaurantId,
			name: name.trim(),
			role,
			pin_code: pin,
			is_active: isActive,
		};

		if (editingStaff) {
			const { error } = await supabase
				.from("restaurant_staff")
				.update(payload)
				.eq("id", editingStaff.id)
				.eq("restaurant_id", restaurantId);
			if (error) {
				console.error("Update staff error:", error.message || error);
				toast.error(`Update failed: ${error.message}`);
				setSaving(false);
				return;
			}
			toast.success("Staff member updated successfully");
		} else {
			console.log("Submitting Payload:", payload);
			const { error } = await supabase
				.from("restaurant_staff")
				.insert([payload]);
			if (error) {
				console.error("Insert staff error:", error.message || error);
				toast.error(`Insert failed: ${error.message}`);
				setSaving(false);
				return;
			}
			toast.success("Staff member created successfully");
		}

		setSaving(false);
		setShowForm(false);
		resetForm();
		fetchStaff(); // Re-fetch to update UI
	};

	const handleDelete = async (id: string) => {
		if (!restaurantId) return;
		setDeletingId(id);
		const { error } = await supabase
			.from("restaurant_staff")
			.delete()
			.eq("id", id)
			.eq("restaurant_id", restaurantId);

		if (error) {
			console.error("Delete staff error:", error.message || error);
			toast.error(`Delete failed: ${error.message}`);
		} else {
			toast.success("Staff member deleted");
		}
		setDeletingId(null);
		fetchStaff();
	};

	const waiters = staff.filter((s) => s.role === "waiter");
	const cashiers = staff.filter((s) => s.role === "cashier");

	if (!mounted || restLoading || loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Enhanced Staff Invite Banner */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-[#0F4C75] rounded-3xl p-8 text-white shadow-2xl shadow-[#0F4C75]/20 overflow-hidden relative border border-white/10"
			>
				{/* Decorative Background Elements */}
				<div className="absolute top-[-20%] right-[-5%] w-64 h-64 rounded-full bg-[#3282B8]/20 blur-[60px]" />
				<div className="absolute bottom-[-10%] left-[50%] w-32 h-32 rounded-full bg-[#BBE1FA]/10 blur-[40px]" />

				<div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#BBE1FA] text-[10px] font-bold uppercase tracking-widest">
							<Sparkles size={12} />
							Onboarding
						</div>
						<h2 className="text-2xl font-black tracking-tight">Invite Your Team</h2>
						<p className="text-sm text-[#BBE1FA]/70 max-w-md font-medium leading-relaxed">
							Share this link with your staff members. They'll need their registered Name and
							4-digit PIN to access their respective dashboards.
						</p>
					</div>

					<div className="flex flex-col sm:flex-row items-center gap-3 bg-black/20 backdrop-blur-xl border border-white/10 p-2 rounded-2xl w-full max-w-lg lg:w-auto">
						<div className="w-full sm:w-auto px-4 py-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3">
							<LinkIcon size={14} className="text-[#BBE1FA] shrink-0" />
							<code className="text-xs font-bold font-mono text-white/90 truncate block text-left w-full sm:max-w-[200px]">
								{typeof window !== "undefined"
									? `${window.location.origin}/${useRestaurant().slug}/login`
									: `.../${useRestaurant().slug}/login`}
							</code>
						</div>
						<div className="flex gap-2 w-full sm:w-auto">
							<button
								onClick={() => {
									const url = `${window.location.origin}/${useRestaurant().slug}/login`;
									navigator.clipboard.writeText(url);
									setCopied(true);
									toast.success("Staff login link copied!");
									setTimeout(() => setCopied(false), 2000);
								}}
								className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#0F4C75] text-sm font-black hover:bg-[#BBE1FA] transition-all active:scale-95 shadow-xl shadow-black/10"
							>
								{copied ? <CheckCheck size={16} /> : <Clipboard size={16} />}
								{copied ? "Copied" : "Copy"}
							</button>
							<a
								href={`/${useRestaurant().slug}/login`}
								target="_blank"
								rel="noopener noreferrer"
								className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#3282B8] text-white text-sm font-black hover:bg-[#BBE1FA] hover:text-[#0F4C75] transition-all active:scale-95 shadow-xl shadow-black/10"
							>
								<ExternalLink size={16} />
								Open
							</a>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold text-[#0A1628] dark:text-white tracking-tight">
						Staff
					</h1>
					<p className="text-xs text-[#7B8BA3] mt-1">
						{staff.length} team member{staff.length !== 1 ? "s" : ""}
					</p>
				</div>
				<button
					onClick={openCreate}
					className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F4C75] text-white text-sm font-semibold
                     hover:bg-[#0A3558] active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
				>
					<Plus size={16} /> Add Staff
				</button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8ECF1] dark:border-gray-700 p-5">
					<p className="text-[10px] text-[#B0B8C4] uppercase tracking-wider font-semibold">
						Total Staff
					</p>
					<p className="text-2xl font-bold text-[#0A1628] dark:text-white mt-1">
						{staff.length}
					</p>
				</div>
				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8ECF1] dark:border-gray-700 p-5">
					<p className="text-[10px] text-[#B0B8C4] uppercase tracking-wider font-semibold">
						Waiters
					</p>
					<p className="text-2xl font-bold text-[#0A1628] dark:text-white mt-1">
						{waiters.length}
					</p>
				</div>
				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8ECF1] dark:border-gray-700 p-5">
					<p className="text-[10px] text-[#B0B8C4] uppercase tracking-wider font-semibold">
						Cashiers
					</p>
					<p className="text-2xl font-bold text-[#0A1628] dark:text-white mt-1">
						{cashiers.length}
					</p>
				</div>
			</div>

			{/* Staff Grid */}
			{staff.length === 0 ? (
				<div className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8ECF1] dark:border-gray-700 p-12 text-center">
					<Users size={40} className="text-[#B0B8C4] mx-auto mb-3" />
					<p className="text-sm text-[#7B8BA3]">
						No staff members yet. Add your first team member.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{staff.map((s) => (
						<motion.div
							key={s.id}
							layout
							initial={{ opacity: 0, scale: 0.96 }}
							animate={{ opacity: 1, scale: 1 }}
							className="bg-white dark:bg-gray-800 rounded-2xl border border-[#E8ECF1] dark:border-gray-700 p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-shadow"
						>
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C75]/10 to-[#3282B8]/10 flex items-center justify-center">
										<span className="text-sm font-bold text-[#0F4C75]">
											{s.name
												.split(" ")
												.map((n) => n[0])
												.join("")
												.toUpperCase()}
										</span>
									</div>
									<div>
										<p className="text-sm font-semibold text-[#0A1628] dark:text-white">
											{s.name}
										</p>
										<div className="flex items-center gap-2 mt-0.5">
											<span
												className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
													s.role === "waiter"
														? "bg-blue-50 text-[#3282B8]"
														: "bg-amber-50 text-amber-600"
												}`}
											>
												{s.role.charAt(0).toUpperCase() + s.role.slice(1)}
											</span>
											<span
												className={`w-1.5 h-1.5 rounded-full ${s.is_active ? "bg-sky-400" : "bg-gray-300"}`}
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] mb-4 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0] w-fit">
								<Shield size={12} className="text-[#0F4C75]" />
								PIN:{" "}
								<span className="text-[#0F4C75] font-mono tracking-widest bg-white px-1.5 py-0.5 rounded shadow-sm">
									{s.pin_code}
								</span>
							</div>

							<div className="flex gap-2">
								<button
									onClick={() => openEdit(s)}
									className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#F5F7FA] text-xs font-medium text-[#5A6B82] hover:bg-[#E8ECF1] transition-colors"
								>
									<Pencil size={12} /> Edit
								</button>
								<button
									onClick={() => handleDelete(s.id)}
									disabled={deletingId === s.id}
									className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F5F7FA] text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
								>
									{deletingId === s.id ? (
										<span className="inline-block w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
									) : (
										<Trash2 size={12} />
									)}
								</button>
							</div>
						</motion.div>
					))}
				</div>
			)}

			{/* Form Modal */}
			<AnimatePresence>
				{showForm && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => {
								setShowForm(false);
								resetForm();
							}}
							className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
						/>
						<motion.div
							initial={{ opacity: 0, y: 40 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 40 }}
							transition={{ type: "spring", damping: 28, stiffness: 300 }}
							className="fixed inset-x-4 top-[15vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[440px] bg-white rounded-2xl z-50 shadow-2xl"
						>
							<div className="p-6">
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-lg font-bold text-[#0A1628] dark:text-white">
										{editingStaff ? "Edit Staff" : "Add Staff"}
									</h3>
									<button
										onClick={() => {
											setShowForm(false);
											resetForm();
										}}
										className="p-1.5 rounded-lg hover:bg-[#F0F4F8] text-[#5A6B82]"
									>
										<X size={18} />
									</button>
								</div>

								<div className="space-y-4">
									{/* Name */}
									<div>
										<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
											Name
										</label>
										<input
											type="text"
											value={name}
											onChange={(e) => setName(e.target.value)}
											placeholder="e.g. Ahmed K."
											className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8ECF1] text-sm text-[#0A1628]
                                 placeholder:text-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8] transition-all"
										/>
									</div>

									{/* Role */}
									<div>
										<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
											Role
										</label>
										<div className="flex gap-2">
											{(["waiter", "cashier"] as const).map((r) => (
												<button
													key={r}
													type="button"
													onClick={() => setRole(r)}
													className={`flex-1 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
														role === r
															? "bg-[#0F4C75] text-white shadow-sm"
															: "bg-[#F5F7FA] text-[#5A6B82] border border-[#E8ECF1] hover:border-[#3282B8]/40"
													}`}
												>
													{r}
												</button>
											))}
										</div>
									</div>

									{/* PIN */}
									<div>
										<label className="block text-xs font-semibold text-[#3D4F6F] mb-2 uppercase tracking-wider">
											4-Digit PIN
										</label>
										<div className="relative">
											<input
												type={showPin ? "text" : "password"}
												value={pin}
												onChange={(e) =>
													setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
												}
												placeholder="0000"
												maxLength={4}
												className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8ECF1] text-sm text-[#0A1628] font-mono tracking-[0.5em]
                                   placeholder:text-[#B0B8C4] focus:outline-none focus:ring-2 focus:ring-[#3282B8]/30 focus:border-[#3282B8] transition-all"
											/>
											<button
												type="button"
												onClick={() => setShowPin(!showPin)}
												className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8BA3] hover:text-[#3D4F6F]"
											>
												{showPin ? <EyeOff size={16} /> : <Eye size={16} />}
											</button>
										</div>
										{pin.length > 0 && pin.length < 4 && (
											<p className="text-[10px] text-amber-500 mt-1">
												PIN must be exactly 4 digits
											</p>
										)}
									</div>

									{/* Active toggle */}
									<div className="flex items-center justify-between py-1">
										<span className="text-xs font-medium text-[#5A6B82]">
											Active
										</span>
										<button
											type="button"
											onClick={() => setIsActive(!isActive)}
											className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-[#0F4C75]" : "bg-[#D1D5DB]"}`}
										>
											<span
												className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-[22px]" : "translate-x-0.5"}`}
											/>
										</button>
									</div>
								</div>

								{/* Actions */}
								<div className="flex gap-3 mt-6">
									<button
										onClick={() => {
											setShowForm(false);
											resetForm();
										}}
										className="flex-1 py-3 rounded-xl border border-[#E8ECF1] text-sm font-semibold text-[#5A6B82] hover:bg-[#F0F4F8] transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={handleSave}
										disabled={saving || !name.trim() || !pin.match(/^\d{4}$/)}
										className="flex-1 py-3 rounded-xl bg-[#0F4C75] text-white text-sm font-semibold disabled:opacity-40
                               hover:bg-[#0A3558] active:scale-[0.98] transition-all shadow-[0_4px_14px_rgba(15,76,117,0.25)]"
									>
										{saving ? "Saving..." : editingStaff ? "Update" : "Create"}
									</button>
								</div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}
