"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Clock,
	LogOut,
	Minus,
	Plus,
	Printer,
	Trash2,
	UtensilsCrossed,
	Search,
	CreditCard,
	ArrowRight,
	ChefHat,
	Coffee,
	CircleSlash,
	Sun,
	Moon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { useEffect, useRef, useState, useMemo } from "react";
import { toast } from "sonner";
import { ReceiptPrint } from "@/components/pos/ReceiptPrint";
import {
	getRestaurantBySlugClient,
	getTablesByRestaurantClient,
} from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import type { Restaurant, Table } from "@/types/database";
import { useSmartPresence } from "@/hooks/useSmartPresence";
import { useRestaurantRealtime } from "@/hooks/useRestaurantRealtime";
import { logger } from "@/lib/logger";

const supabase = createClient();

interface OrderItem {
	id: string;
	name: string;
	quantity: number;
	price: number;
	specialRequests?: string;
}

interface TableOrder {
	id: string;
	tableNumber: number | null; // null for takeaway
	status: string;
	items: OrderItem[];
	total: number;
	createdAt: Date;
}

const CASHIER_ACTIVE_ORDER_STATUSES = [
	"confirmed",
	"preparing",
	"served",
	"confirmed_by_waiter",
	"in_kitchen",
	"ready",
	"pending", // Sometimes orders arrive as pending
] as const;

// Generates a short order ID from UUID, e.g. "ORD-4A2F"
function shortOrderId(uuid: string): string {
	return "ORD-" + uuid.slice(-4).toUpperCase();
}

interface CartItem {
	menuItemId: string;
	name: string;
	price: number;
	quantity: number;
}

interface MenuCategory {
	id: string;
	name_en: string;
}

interface MenuItemRow {
	id: string;
	name_en: string;
	price: number;
	category_id: string;
	is_available: boolean;
	image_url?: string;
}

export default function CashierDashboardPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const router = useRouter();
	const { slug } = React.use(params);
	const { theme, setTheme } = useTheme();

	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
	const [tables, setTables] = useState<Table[]>([]);
	const [orders, setOrders] = useState<TableOrder[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Add Silent Smart Presence Tracker
	const staffId =
		typeof window !== "undefined" && restaurant?.id
			? localStorage.getItem(`tawla_staff_${restaurant.id}_cashier`)
			: null;
	useSmartPresence(staffId, restaurant?.id || null);

	// Multi-column POS State
	const [activeOrderType, setActiveOrderType] = useState<"dine_in" | "takeaway" | "existing">("takeaway");
	const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
	const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
	const [cart, setCart] = useState<CartItem[]>([]);
	const [searchQuery, setSearchQuery] = useState("");
	
	const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
	const [isProcessingPayment, setIsProcessingPayment] = useState(false);
	const [isVoiding, setIsVoiding] = useState(false);
	const isSubmittingOrderRef = useRef(false);

	// Menu Data
	const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
	const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	// Print State


	// ───────────────── Data fetching ─────────────────
	const fetchActiveOrders = React.useCallback(async (restaurantId: string) => {
		const { data, error } = await supabase
			.from("orders")
			.select(`
          id,
          status,
          total_amount,
          created_at,
          table:tables(id, table_number),
          items:order_items(
            id,
            quantity,
            price_at_time,
            special_requests,
            menu_item:menu_items(id, name_en)
          )
        `)
			.eq("restaurant_id", restaurantId)
			.in("status", [...CASHIER_ACTIVE_ORDER_STATUSES])
			.order("created_at", { ascending: false });

		if (error || !data) {
			logger.error("Cashier orders fetch failed:", error);
			return [];
		}

		const formattedOrders: TableOrder[] = data.map((row: any) => ({
			id: row.id,
			tableNumber: row.table?.table_number ?? null,
			status: row.status,
			total: row.total_amount,
			createdAt: new Date(row.created_at),
			items: (row.items || []).map((oi: any) => ({
				id: oi.id,
				name: oi.menu_item?.name_en ?? "Unknown item",
				quantity: oi.quantity,
				price: oi.price_at_time,
				specialRequests: oi.special_requests || undefined,
			})),
		}));

		return formattedOrders;
	}, []);

	const fetchMenuData = React.useCallback(async (restaurantId: string) => {
		const { data, error } = await supabase
			.from("categories")
			.select("id, name_en, menu_items(id, name_en, price, category_id, is_available, image_url)")
			.eq("restaurant_id", restaurantId)
			.order("sort_order");

		if (error || !data) {
			logger.error("Menu data fetch failed:", error);
			setMenuCategories([]);
			setMenuItems([]);
			return;
		}

		setMenuCategories(data.map((c) => ({ id: c.id, name_en: c.name_en })));
		const allItems = data.flatMap((c) => (c.menu_items || []) as any[]);
		setMenuItems(allItems.filter((i) => i.is_available));
	}, []);

	// Realtime Subscriptions via Engine Hook
	useRestaurantRealtime(restaurant?.id, {
		onOrderChange: async () => {
			if (!restaurant?.id) return;
			const ords = await fetchActiveOrders(restaurant.id);
			setOrders(ords);
		}
	});

	// Initial load
	useEffect(() => {
		let cancelled = false;

		async function loadData() {
			try {
				const restaurantData = await getRestaurantBySlugClient(slug);
				if (!restaurantData) {
					router.push("/");
					return;
				}

				const staffId = localStorage.getItem(`tawla_staff_${restaurantData.id}_cashier`);
				if (!staffId) {
					router.push(`/${slug}/login`);
					return;
				} 

				if (cancelled) return;
				setRestaurant(restaurantData);

				const [tablesData, ords] = await Promise.all([
					getTablesByRestaurantClient(restaurantData.id),
					fetchActiveOrders(restaurantData.id),
					fetchMenuData(restaurantData.id),
				]);

				if (cancelled) return;
				setTables(tablesData);
				setOrders(ords);
			} catch (error) {
				logger.error("Error loading cashier data:", error);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}

		loadData();
		return () => { cancelled = true; };
	}, [slug, router, fetchActiveOrders, fetchMenuData]);


	// ───────────────── Handlers ─────────────────

	const handleCollectPayment = async () => {
		if (!restaurant?.id || !activeOrderId) return;
		setIsProcessingPayment(true);
		try {
			const orderToPay = orders.find((o) => o.id === activeOrderId);
			const { error } = await supabase
				.from("orders")
				.update({ status: "paid" })
				.eq("id", activeOrderId)
				.eq("restaurant_id", restaurant.id);
			if (error) throw error;

			if (orderToPay?.tableNumber) {
				const targetTable = tables.find((t) => t.table_number === orderToPay.tableNumber);
				if (targetTable) {
					await supabase
						.from("waiter_calls")
						.update({ status: "resolved" })
						.eq("table_id", targetTable.id)
						.eq("status", "active")
						.eq("restaurant_id", restaurant.id);
				}
			}

			toast.success("Payment successful! Order closed.");
			setActiveOrderId(null);
			setCart([]);
			setActiveOrderType("takeaway");
			
			
			// Trigger browser print for the current ticket before navigating away
			if(orderToPay) {
				window.print();
			}
		} catch (error) {
			logger.error("Failed to mark order as paid", error);
			toast.error("Failed to process payment");
		} finally {
			setIsProcessingPayment(false);
		}
	};

	const handleVoidOrder = async () => {
		if (!restaurant?.id || !activeOrderId) {
			// If not an existing order, just clear the cart
			setCart([]);
			return;
		}

		const confirmed = window.confirm("Void this active order? This cannot be undone.");
		if (!confirmed) return;

		setIsVoiding(true);
		try {
			const { error } = await supabase
				.from("orders")
				.update({ status: "cancelled" })
				.eq("id", activeOrderId)
				.eq("restaurant_id", restaurant.id);
			if (error) throw error;

			toast.success("Order voided successfully");
			setActiveOrderId(null);
			setCart([]);
			setActiveOrderType("takeaway");
		} catch (error) {
			logger.error("Failed to void order", error);
			toast.error("Failed to void order");
		} finally {
			setIsVoiding(false);
		}
	};



	const handleSendToKitchen = async () => {
		if (!restaurant?.id || cart.length === 0 || isSubmittingOrderRef.current) return;

		if (activeOrderType === "dine_in" && !selectedTableId) {
			toast.error("Please select a table from the grid first.");
			return;
		}

		isSubmittingOrderRef.current = true;
		setIsSubmittingOrder(true);

		try {
			const { data: orderData, error: orderError } = await supabase
				.from("orders")
				.insert({
					restaurant_id: restaurant.id,
					table_id: selectedTableId,
					status: "confirmed", 
					total_amount: cartTotal,
				})
				.select("id")
				.single();

			if (orderError || !orderData) throw orderError;

			const orderItems = cart.map((c) => ({
				order_id: orderData.id,
				menu_item_id: c.menuItemId,
				quantity: c.quantity,
				price_at_time: c.price,
			}));

			const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
			if (itemsError) throw itemsError;

			toast.success(`Order sent to kitchen successfully!`);
			setCart([]);
			setSelectedTableId(null);
			// Auto switch to existing to wait for payment
			setActiveOrderId(orderData.id);
			setActiveOrderType("existing");
		} catch (error) {
			logger.error("Failed to submit order", error);
			toast.error("Failed to send order");
		} finally {
			isSubmittingOrderRef.current = false;
			setIsSubmittingOrder(false);
		}
	};

	// ───────────────── Cart Helpers ─────────────────

	const addToCart = (item: MenuItemRow) => {
		if (activeOrderType === "existing") {
			toast.error("Cannot modify an existing sent order directly. Create a new ticket.");
			return;
		}
		setCart((prev) => {
			const existing = prev.find((c) => c.menuItemId === item.id);
			if (existing) {
				return prev.map((c) =>
					c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
				);
			}
			return [...prev, { menuItemId: item.id, name: item.name_en, price: item.price, quantity: 1 }];
		});
	};

	const removeFromCart = (menuItemId: string) => {
		if (activeOrderType === "existing") return;
		setCart((prev) => {
			const existing = prev.find((c) => c.menuItemId === menuItemId);
			if (existing && existing.quantity > 1) {
				return prev.map((c) =>
					c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c,
				);
			}
			return prev.filter((c) => c.menuItemId !== menuItemId);
		});
	};

	const cartTotal = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);

	// Derived Data
	const filteredMenuItems = useMemo(() => {
		let items = menuItems;
		if (selectedCategory !== "all") {
			items = items.filter((m) => m.category_id === selectedCategory);
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			items = items.filter((m) => m.name_en.toLowerCase().includes(q));
		}
		return items;
	}, [menuItems, selectedCategory, searchQuery]);

	const existingActiveOrder = activeOrderId ? orders.find(o => o.id === activeOrderId) : null;
	const displayTotal = activeOrderType === "existing" && existingActiveOrder ? existingActiveOrder.total : cartTotal;
	const displayItems = activeOrderType === "existing" && existingActiveOrder 
		? existingActiveOrder.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, id: i.id }))
		: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, id: i.menuItemId }));

	// ───────────────── Render ─────────────────

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
				<div className="animate-spin w-10 h-10 border-4 border-[#0F4C75] dark:border-white border-t-transparent rounded-full shadow-lg" />
			</div>
		);
	}

	return (
		<>
			{/* Main App Wrap - Hidden during printing */}
			<div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#0A1628] font-sans print:hidden overflow-hidden w-full h-screen selection:bg-[#3282B8]/20">
				
				{/* ── Top App Bar ── */}
			<header className="h-[72px] bg-white border-b border-[#E8ECF1] flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
				<div className="flex items-center gap-4">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-md">
						<span className="text-white text-lg font-bold leading-none">T</span>
					</div>
					<div>
						<h1 className="text-lg font-bold text-[#0A1628] leading-none mb-1">{restaurant?.name || "Tawla"}</h1>
						<span className="text-[11px] text-[#7B8BA3] font-bold uppercase tracking-widest">POS Station</span>
					</div>
				</div>
				<div className="flex items-center gap-5">
					<div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#E6F7ED] rounded-full border border-[#C3ECD3]">
						<span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
						<span className="text-[11px] text-[#047857] font-bold uppercase tracking-widest">Online</span>
					</div>
					<button
						onClick={() => {
							localStorage.removeItem(`tawla_staff_${restaurant?.id}_cashier`);
							router.push(`/${slug}/login`);
						}}
						className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#D9381E] hover:bg-[#FFF4F2] transition-colors font-bold text-sm"
					>
						<LogOut size={16} strokeWidth={2.5}/> Exit Session
					</button>
				</div>
			</header>

			{/* ── Main Workspace (3 columns) ── */}
			<div className="flex-1 flex overflow-hidden">
				
				{/* ── COL 1: Operations & Tables (~25%) ── */}
				<aside className="w-full max-w-[340px] xl:max-w-[380px] bg-white border-r border-[#E8ECF1] flex flex-col shrink-0 z-10 transition-all">
					<div className="p-5 grid grid-cols-2 gap-3 border-b border-[#E8ECF1] bg-[#FAFBFC]">
						<button
							onClick={() => {
								setActiveOrderType("dine_in");
								setActiveOrderId(null);
								setCart([]);
								setSelectedTableId(null);
							}}
							className={`col-span-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all outline-none ${
								activeOrderType === "dine_in" 
									? "bg-[#0F4C75] text-white border-[#0F4C75] shadow-lg shadow-[#0F4C75]/20" 
									: "bg-white text-[#5A6B82] border-[#E8ECF1] hover:border-[#BBE1FA]"
							}`}
						>
							<UtensilsCrossed size={24} strokeWidth={activeOrderType === "dine_in" ? 2.5 : 2} />
							<span className="text-sm font-bold mt-1">Dine-In</span>
						</button>
						<button
							onClick={() => {
								setActiveOrderType("takeaway");
								setActiveOrderId(null);
								setCart([]);
								setSelectedTableId(null);
							}}
							className={`col-span-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all outline-none ${
								activeOrderType === "takeaway" 
									? "bg-[#0F4C75] text-white border-[#0F4C75] shadow-lg shadow-[#0F4C75]/20" 
									: "bg-white text-[#5A6B82] border-[#E8ECF1] hover:border-[#BBE1FA]"
							}`}
						>
							<Coffee size={24} strokeWidth={activeOrderType === "takeaway" ? 2.5 : 2} />
							<span className="text-sm font-bold mt-1">Takeaway</span>
						</button>
					</div>

					<div className="px-5 py-4 bg-white flex items-center justify-between border-b border-[#E8ECF1]">
						<h3 className="text-xs font-bold text-[#7B8BA3] uppercase tracking-widest flex items-center gap-1.5">
							<Clock size={14} /> Active Tickets
						</h3>
						<span className="bg-[#E8ECF1] text-[#0A1628] px-2.5 py-0.5 rounded-full text-xs font-bold">
							{orders.length}
						</span>
					</div>

					<div className="flex-1 overflow-y-auto p-5 bg-[#FAFBFC] space-y-6">
						{/* Takeaway Pending Tickets */}
						{orders.filter(o => !o.tableNumber).length > 0 && (
							<div>
								<h4 className="text-[11px] font-bold text-[#7B8BA3] uppercase tracking-widest mb-3 pl-1">Takeaway Queue</h4>
								<div className="space-y-3">
									{orders.filter(o => !o.tableNumber).map(o => (
										<button
											key={o.id}
											onClick={() => {
												setActiveOrderType("existing");
												setActiveOrderId(o.id);
												setSelectedTableId(null);
											}}
											className={`w-full text-left p-4 rounded-2xl border transition-all outline-none ${
												activeOrderId === o.id
													? "bg-[#E6F4FE] border-[#3282B8] shadow-sm"
													: "bg-white border-[#E8ECF1] hover:border-[#BBE1FA]"
											}`}
										>
											<div className="flex justify-between items-center mb-2">
												<span className="text-sm font-bold text-[#0A1628]">{shortOrderId(o.id)}</span>
												<span className="text-xs font-bold text-[#7B8BA3]">{o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
											</div>
											<div className="flex justify-between items-baseline">
												<span className="text-base font-bold text-[#3282B8]">{o.total.toFixed(3)} KD</span>
												<span className="text-xs font-semibold text-[#5A6B82]">{o.items.length} items</span>
											</div>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Dine in Tables Grid */}
						<div>
							<h4 className="text-[11px] font-bold text-[#7B8BA3] uppercase tracking-widest mb-3 pl-1">Dine-In Floor Map</h4>
							<div className="grid grid-cols-3 gap-3">
								{tables.map(t => {
									const activeOrder = orders.find(o => o.tableNumber === t.table_number);
									const isOccupied = !!activeOrder;
									const isSelected = selectedTableId === t.id || (activeOrder && activeOrderId === activeOrder.id);

									return (
										<button
											key={t.id}
											onClick={() => {
												if (isOccupied) {
													setActiveOrderType("existing");
													setActiveOrderId(activeOrder.id);
													setSelectedTableId(t.id);
												} else {
													setActiveOrderType("dine_in");
													setActiveOrderId(null);
													setCart([]);
													setSelectedTableId(t.id);
												}
											}}
											className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 relative transition-all outline-none ${
												isOccupied 
													? (isSelected ? "bg-[#FFF4F2] border-2 border-[#D9381E] shadow-sm" : "bg-[#FFF4F2] border border-[#FFE2DD] text-[#D9381E] hover:border-[#D9381E]/40")
													: (isSelected ? "bg-[#E6F4FE] border-2 border-[#3282B8] shadow-sm text-[#0A1628]" : "bg-white border border-[#E8ECF1] text-[#0A1628] hover:border-[#BBE1FA]")
											}`}
										>
											<span className={`text-2xl font-bold ${isOccupied ? "text-[#D9381E]" : "text-[#0A1628]"}`}>{t.table_number}</span>
											<span className={`text-[10px] font-bold uppercase tracking-widest mt-1.5 ${isOccupied ? "text-[#D9381E]/70" : "text-[#7B8BA3]"}`}>
												{isOccupied ? "Busy" : "Free"}
											</span>
										</button>
									)
								})}
							</div>
						</div>
					</div>
				</aside>

				{/* ── COL 2: Menu / Build Order (~45%) ── */}
				<main className="flex-1 flex flex-col h-full bg-[#FAFBFC] min-w-[320px]">
					<div className="p-5 bg-white border-b border-[#E8ECF1] shadow-[0_2px_10px_rgba(0,0,0,0.01)] z-10 space-y-4">
						<div className="relative w-full">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8BA3]" size={18} />
							<input
								type="text"
								placeholder="Search menu items..."
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-[#F5F7FA] border border-transparent text-[15px] font-medium text-[#0A1628] placeholder:text-[#A0ABB8] focus:bg-white focus:border-[#E8ECF1] focus:ring-4 focus:ring-[#3282B8]/10 transition-all outline-none"
							/>
						</div>
						<div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
							<button
								onClick={() => setSelectedCategory("all")}
								className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border outline-none ${
									selectedCategory === "all"
										? "bg-[#0A1628] text-white border-transparent shadow-md"
										: "bg-white text-[#5A6B82] border-[#E8ECF1] hover:bg-[#F5F7FA]"
								}`}
							>
								All Items
							</button>
							{menuCategories.map((c) => (
								<button
									key={c.id}
									onClick={() => setSelectedCategory(c.id)}
									className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors border outline-none ${
										selectedCategory === c.id
											? "bg-[#0A1628] text-white border-transparent shadow-md"
											: "bg-white text-[#5A6B82] border-[#E8ECF1] hover:bg-[#F5F7FA]"
									}`}
								>
									{c.name_en}
								</button>
							))}
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-5">
						{activeOrderType === "existing" && (
							<div className="mb-5 p-4 rounded-2xl bg-[#E6F4FE] border border-[#BBE1FA] text-[#0F4C75] text-sm font-semibold flex items-center gap-3 shadow-sm">
								<CircleSlash size={20} className="shrink-0" /> 
								<p>Viewing an existing order. To modify a sent order, void it or create a new supplemental ticket.</p>
							</div>
						)}
						<div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">
							{filteredMenuItems.map((item) => {
								const inCart = cart.find((c) => c.menuItemId === item.id);
								const isDisabled = activeOrderType === "existing";
								
								return (
									<motion.button
										key={item.id}
										whileTap={!isDisabled ? { scale: 0.96 } : {}}
										onClick={() => addToCart(item)}
										disabled={isDisabled}
										className={`group relative text-left rounded-2xl border transition-all h-[140px] flex flex-col justify-between p-4 overflow-hidden outline-none ${
											inCart
												? "border-[#3282B8] bg-[#E6F4FE] shadow-md"
												: "border-[#E8ECF1] bg-white shadow-sm hover:shadow-md hover:border-[#BBE1FA]"
										} ${isDisabled ? "opacity-60 cursor-not-allowed grayscale-[20%]" : ""}`}
									>
										{/* Decorator strip */}
										{inCart && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#3282B8]" />}
										
										<div className="pr-2 z-10 truncate whitespace-normal">
											<p className="text-[15px] font-bold text-[#0A1628] leading-tight line-clamp-3">
												{item.name_en}
											</p>
										</div>
										<div className="flex justify-between items-end z-10 w-full mt-2">
											<p className="text-[15px] font-bold text-[#3282B8]">
												{item.price.toFixed(3)} KD
											</p>
										</div>
										{inCart && (
											<div className="absolute top-0 right-0 bg-[#3282B8] text-white text-[13px] font-bold min-w-[32px] h-8 px-2 flex items-center justify-center rounded-bl-xl shadow-sm z-20">
												x{inCart.quantity}
											</div>
										)}
									</motion.button>
								);
							})}
						</div>
					</div>
				</main>

				{/* ── COL 3: Current Ticket (~30%) ── */}
				<aside className="w-full max-w-[380px] xl:max-w-[420px] bg-white border-l border-[#E8ECF1] flex flex-col shrink-0 shadow-[-8px_0_30px_rgba(0,0,0,0.03)] z-20">
					{/* Ticket Header */}
					<div className="p-6 border-b border-[#E8ECF1] flex flex-col gap-1.5 bg-white">
						<div className="flex items-center justify-between">
							<h2 className="text-2xl font-bold text-[#0A1628] leading-none">
								{activeOrderType === "dine_in" ? (
									selectedTableId ? `Table ${tables.find(t=>t.id===selectedTableId)?.table_number}` : "Select Table"
								) : activeOrderType === "takeaway" ? (
									"Takeaway"
								) : (
									existingActiveOrder?.tableNumber ? `Table ${existingActiveOrder.tableNumber}` : "Takeaway"
								)}
							</h2>
							{activeOrderType === "existing" && (
								<span className="text-[11px] font-bold bg-[#F5F7FA] border border-[#E8ECF1] text-[#5A6B82] px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
									{shortOrderId(activeOrderId!)}
								</span>
							)}
						</div>
						<p className="text-[12px] font-semibold text-[#7B8BA3] uppercase tracking-widest mt-1">
							{activeOrderType === "existing" ? "Current Active Order" : "New Ticket"}
						</p>
					</div>

					{/* Ticket Items */}
					<div className="flex-1 overflow-y-auto p-5 bg-white">
						{displayItems.length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-[#7B8BA3] opacity-80">
								<div className="w-20 h-20 rounded-full bg-[#F5F7FA] border border-[#E8ECF1] flex items-center justify-center mb-5 shadow-sm">
									<UtensilsCrossed size={32} className="text-[#A0ABB8]" />
								</div>
								<p className="text-base font-bold text-[#0A1628]">Ticket is Empty</p>
								<p className="text-[13px] mt-2 text-center text-[#7B8BA3] max-w-[200px] leading-relaxed">Add items from the menu to build an order.</p>
							</div>
						) : (
							<div className="space-y-4">
								<AnimatePresence>
									{displayItems.map((item) => (
										<motion.div
											layout
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.95 }}
											key={item.id}
											className="bg-[#F5F7FA] border border-[#E8ECF1] rounded-2xl p-4 flex flex-col gap-3 group shadow-sm"
										>
											<div className="flex justify-between items-start gap-4">
												<p className="text-[15px] font-bold text-[#0A1628] leading-tight flex-1">
													{item.name}
												</p>
												<p className="text-[15px] font-bold text-[#0F4C75] tabular-nums whitespace-nowrap">
													{(item.price * item.quantity).toFixed(3)} KD
												</p>
											</div>
											
											{activeOrderType !== "existing" && (
												<div className="flex items-center self-start bg-white rounded-xl p-1 shadow-sm border border-[#E8ECF1]">
													<button
														onClick={() => removeFromCart(item.id)}
														className="w-10 h-10 rounded-lg flex items-center justify-center text-[#5A6B82] hover:bg-[#FFF4F2] hover:text-[#D9381E] transition-colors outline-none"
													>
														{item.quantity > 1 ? <Minus size={18} strokeWidth={2.5} /> : <Trash2 size={18} strokeWidth={2.5} />}
													</button>
													<span className="text-[15px] font-bold text-[#0A1628] w-10 text-center tabular-nums">
														{item.quantity}
													</span>
													<button
														onClick={() => {
															const rawItem = menuItems.find(m => m.id === item.id);
															if (rawItem) addToCart(rawItem);
														}}
														className="w-10 h-10 rounded-lg flex items-center justify-center text-[#5A6B82] hover:bg-[#E6F4FE] hover:text-[#0F4C75] transition-colors outline-none"
													>
														<Plus size={18} strokeWidth={2.5} />
													</button>
												</div>
											)}
											{activeOrderType === "existing" && (
												<div className="text-[11px] font-bold text-[#5A6B82] uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-[#E8ECF1] self-start shadow-sm flex items-center gap-1.5">
													Qty: <span className="text-[#0A1628] text-sm tabular-nums">{item.quantity}</span>
												</div>
											)}
										</motion.div>
									))}
								</AnimatePresence>
							</div>
						)}
					</div>

					{/* Totals & Actions */}
					{displayItems.length > 0 && (
						<div className="flex flex-col border-t border-[#E8ECF1] bg-white z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
							{/* Totals Block */}
							<div className="p-6 flex justify-between items-end border-b border-[#E8ECF1]">
								<div>
									<p className="text-xs font-bold text-[#7B8BA3] uppercase tracking-widest mb-1.5">Grand Total</p>
									<p className="text-[13px] font-semibold text-[#5A6B82]">{displayItems.reduce((acc, i) => acc + i.quantity, 0)} items</p>
								</div>
								<div className="text-right">
									<p className="text-[32px] font-bold text-[#0A1628] tabular-nums leading-none tracking-tight">
										{displayTotal.toFixed(3)}
										<span className="text-sm ml-1.5 font-bold text-[#7B8BA3]">KD</span>
									</p>
								</div>
							</div>

							{/* Action Buttons Grid */}
							<div className="p-6 grid gap-3 grid-cols-2 bg-[#FAFBFC]">
								{activeOrderType !== "existing" ? (
									<>
										<button
											onClick={handleVoidOrder}
											className="col-span-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white border border-[#E8ECF1] shadow-sm text-[#D9381E] text-[15px] font-bold hover:bg-[#FFF4F2] hover:border-[#FFE2DD] active:scale-[0.98] transition-all outline-none"
										>
											<Trash2 size={18} /> Void Order
										</button>
										<button
											onClick={handleSendToKitchen}
											disabled={isSubmittingOrder || (activeOrderType === "dine_in" && !selectedTableId)}
											className="col-span-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#0F4C75] text-white text-[15px] font-bold hover:bg-[#0A3558] shadow-lg shadow-[#0F4C75]/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale-[30%] transition-all outline-none"
										>
											<ChefHat size={18} /> {isSubmittingOrder ? "..." : "Send to Kitchen"}
										</button>
									</>
								) : (
									<>
										<button
											onClick={handleVoidOrder}
											disabled={isVoiding}
											className="col-span-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#FFF4F2] text-[#D9381E] border border-[#FFE2DD] shadow-sm text-[15px] font-bold hover:bg-[#FFE2DD] active:scale-[0.98] transition-all outline-none"
										>
											<CircleSlash size={18} /> {isVoiding ? "..." : "Void"}
										</button>
										<button
											onClick={() => window.print()}
											className="col-span-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white border border-[#E8ECF1] shadow-sm text-[#0A1628] text-[15px] font-bold hover:bg-[#F5F7FA] active:scale-[0.98] transition-all outline-none"
										>
											<Printer size={18} /> Print Bill
										</button>
										<button
											onClick={handleCollectPayment}
											disabled={isProcessingPayment}
											className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl bg-[#10B981] text-white text-lg font-bold hover:bg-[#059669] shadow-lg shadow-[#10B981]/20 active:scale-[0.98] transition-all disabled:opacity-60 outline-none uppercase tracking-wide mt-1"
										>
											<CreditCard size={20} strokeWidth={2.5}/> {isProcessingPayment ? "Processing..." : "Pay & Close Ticket"}
										</button>
									</>
								)}
							</div>
						</div>
					)}
				</aside>
			</div>
			
			</div>
			
			{/* Print Template (Hidden normally, rendered as 80mm thermal receipt) */}
			<div className="hidden print:block w-full bg-white text-black">
				<ReceiptPrint 
					order={activeOrderType === "existing" && existingActiveOrder ? {
						id: existingActiveOrder.id,
						createdAt: new Date(existingActiveOrder.createdAt),
						items: existingActiveOrder.items.map(i => ({id: i.id, name: i.name, price: i.price, quantity: i.quantity})),
						total: existingActiveOrder.total,
						tableNumber: existingActiveOrder.tableNumber?.toString()
					} : {
						id: 'NEW-TICKET',
						createdAt: new Date(),
						items: displayItems.map(i => ({id: i.id, name: i.name, price: i.price, quantity: i.quantity})),
						total: displayTotal,
						tableNumber: selectedTableId ? tables.find(t=>t.id===selectedTableId)?.table_number?.toString() : undefined
					}} 
					restaurantName={restaurant?.name || "Tawla"} 
					cashierName={"Cashier"} 
				/>
			</div>
		</>
	);
}
