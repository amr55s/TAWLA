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
import {
	getRestaurantBySlugClient,
	getTablesByRestaurantClient,
} from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/contexts/ThemeContext";
import type { Restaurant, Table } from "@/types/database";

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
	const [printOrder, setPrintOrder] = useState<TableOrder | null>(null);

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
			console.error("Cashier orders fetch failed:", JSON.stringify(error, null, 2));
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
			console.error("Menu data fetch failed:", error);
			setMenuCategories([]);
			setMenuItems([]);
			return;
		}

		setMenuCategories(data.map((c) => ({ id: c.id, name_en: c.name_en })));
		const allItems = data.flatMap((c) => (c.menu_items || []) as any[]);
		setMenuItems(allItems.filter((i) => i.is_available));
	}, []);

	// Realtime Subscriptions
	useEffect(() => {
		if (!restaurant?.id) return;
		
		const channel = supabase
			.channel(`cashier-orders-${restaurant.id}`)
			.on("postgres_changes", {
				event: "*",
				schema: "public",
				table: "orders",
				filter: `restaurant_id=eq.${restaurant.id}`,
			}, async () => {
				if (!restaurant?.id) return;
				const ords = await fetchActiveOrders(restaurant.id);
				setOrders(ords);
			})
			.subscribe();
			
		return () => { supabase.removeChannel(channel); };
	}, [restaurant?.id, fetchActiveOrders]);

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
				console.error("Error loading cashier data:", error);
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
			
			// Auto print receipt conceptually
			if(orderToPay) handlePrintOrder(orderToPay);
			
		} catch (error) {
			console.error("Failed to mark order as paid:", error);
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
			console.error("Failed to void order:", error);
			toast.error("Failed to void order");
		} finally {
			setIsVoiding(false);
		}
	};

	const handlePrintOrder = (order: TableOrder) => {
		setPrintOrder(order);
		setTimeout(() => window.print(), 200);
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
			console.error("Failed to create order:", error);
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
		<div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans print:hidden overflow-hidden w-full h-screen selection:bg-[#0F4C75]/20">
			
			{/* ── Top App Bar ── */}
			<header className="h-[60px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
				<div className="flex items-center gap-4">
					<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F4C75] to-[#3282B8] flex items-center justify-center shadow-md">
						<span className="text-white text-xs font-black">T</span>
					</div>
					<div>
						<h1 className="text-base font-black leading-none">{restaurant?.name}</h1>
						<span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">POS Station</span>
					</div>
				</div>
				<div className="flex items-center gap-4">
					{mounted && (
						<button
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
							className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-700 transition-colors"
						>
							{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
						</button>
					)}
					<div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
						<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
						<span className="text-xs text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-wider">Online</span>
					</div>
					<button
						onClick={() => {
							localStorage.removeItem(`tawla_staff_${restaurant?.id}_cashier`);
							router.push(`/${slug}/login`);
						}}
						className="flex items-center gap-2 px-3 py-1.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors font-bold text-xs uppercase"
					>
						<LogOut size={14} strokeWidth={2.5}/> Exit
					</button>
				</div>
			</header>

			{/* ── Main Workspace (3 columns) ── */}
			<div className="flex-1 flex overflow-hidden">
				
				{/* ── COL 1: Operations & Tables (~25%) ── */}
				<aside className="w-full max-w-[300px] xl:max-w-[340px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700/50 flex flex-col shrink-0 z-10">
					<div className="p-4 flex flex-col gap-3 border-b border-gray-100 dark:border-gray-700/50">
						<button
							onClick={() => {
								setActiveOrderType("dine_in");
								setActiveOrderId(null);
								setCart([]);
								setSelectedTableId(null);
							}}
							className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-black transition-all shadow-sm border ${
								activeOrderType === "dine_in" 
									? "bg-[#0F4C75] text-white border-[#0F4C75] ring-2 ring-[#0F4C75]/30 offset-2 dark:ring-offset-gray-900" 
									: "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#0F4C75] dark:hover:border-gray-500"
							}`}
						>
							<UtensilsCrossed size={18} strokeWidth={2.5} /> New Dine-in
						</button>
						<button
							onClick={() => {
								setActiveOrderType("takeaway");
								setActiveOrderId(null);
								setCart([]);
								setSelectedTableId(null);
							}}
							className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-black transition-all shadow-sm border ${
								activeOrderType === "takeaway" 
									? "bg-[#3282B8] text-white border-[#3282B8] ring-2 ring-[#3282B8]/30 offset-2 dark:ring-offset-gray-900" 
									: "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#3282B8] dark:hover:border-gray-500"
							}`}
						>
							<Coffee size={18} strokeWidth={2.5} /> New Takeaway
						</button>
					</div>

					<div className="p-4 pb-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between border-b border-gray-200 dark:border-gray-700/50">
						<h3 className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
							Active Tables & Tickets
						</h3>
						<span className="bg-[#0F4C75] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
							{orders.length}
						</span>
					</div>

					<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-800">
						{/* Takeaway Pending Tickets */}
						{orders.filter(o => !o.tableNumber).length > 0 && (
							<div>
								<h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 pl-1">Takeaway Queue</h4>
								<div className="space-y-2">
									{orders.filter(o => !o.tableNumber).map(o => (
										<button
											key={o.id}
											onClick={() => {
												setActiveOrderType("existing");
												setActiveOrderId(o.id);
												setSelectedTableId(null);
											}}
											className={`w-full text-left p-3 rounded-xl border transition-all ${
												activeOrderId === o.id
													? "border-[#3282B8] bg-[#3282B8]/10 shadow-sm ring-1 ring-[#3282B8]"
													: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
											}`}
										>
											<div className="flex justify-between items-center mb-1">
												<span className="text-xs font-black text-[#3282B8]">{shortOrderId(o.id)}</span>
												<span className="text-[10px] font-bold text-gray-400">{o.createdAt.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span>
											</div>
											<div className="flex justify-between items-baseline">
												<span className="text-sm font-bold text-gray-900 dark:text-white">{o.total.toFixed(3)} KD</span>
												<span className="text-[10px] font-bold text-gray-500">{o.items.length} items</span>
											</div>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Dine in Tables Grid */}
						<div>
							<h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 pl-1">Dine-in Tables</h4>
							<div className="grid grid-cols-3 gap-2">
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
											className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-2 relative shadow-sm transition-all focus:outline-none ${
												isSelected ? "ring-2 ring-offset-2 dark:ring-offset-gray-900 " : ""
											} ${
												isOccupied 
													? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-900 dark:text-red-400 " + (isSelected ? "ring-red-500" : "")
													: "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#0F4C75] dark:hover:border-gray-500 text-gray-900 dark:text-white " + (isSelected ? "ring-[#0F4C75]" : "")
											}`}
										>
											<span className="text-xl font-black">{t.table_number}</span>
											<span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${isOccupied ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
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
				<main className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 min-w-[320px]">
					<div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700/50 shadow-sm z-10">
						<div className="relative w-full max-w-md">
							<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
							<input
								type="text"
								placeholder="Search menu items..."
								value={searchQuery}
								onChange={e => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-900/50 border-none text-sm font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-[#0F4C75] dark:focus:ring-[#3282B8] transition-all outline-none"
							/>
						</div>
						<div className="flex gap-2 mt-4 overflow-x-auto pb-1 hide-scrollbar">
							<button
								onClick={() => setSelectedCategory("all")}
								className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors border ${
									selectedCategory === "all"
										? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-md"
										: "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
								}`}
							>
								All
							</button>
							{menuCategories.map((c) => (
								<button
									key={c.id}
									onClick={() => setSelectedCategory(c.id)}
									className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors border ${
										selectedCategory === c.id
											? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-md"
											: "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
									}`}
								>
									{c.name_en}
								</button>
							))}
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-4 content-visibility-auto">
						{activeOrderType === "existing" && (
							<div className="mb-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-bold flex items-center gap-3">
								<CircleSlash size={18} /> Viewing an existing order. Modifications to sent orders must be done by voiding or creating a new ticket.
							</div>
						)}
						<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
							{filteredMenuItems.map((item) => {
								const inCart = cart.find((c) => c.menuItemId === item.id);
								const isDisabled = activeOrderType === "existing";
								
								return (
									<motion.button
										key={item.id}
										whileTap={!isDisabled ? { scale: 0.95 } : {}}
										onClick={() => addToCart(item)}
										disabled={isDisabled}
										className={`group relative text-left rounded-2xl border transition-all h-[120px] flex flex-col justify-between p-3 overflow-hidden ${
											inCart
												? "border-[#0F4C75] bg-[#0F4C75]/5 dark:bg-[#0F4C75]/20 shadow-sm"
												: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-[#0F4C75]/50 dark:hover:border-gray-500"
										} ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
									>
										{/* Decorator strip */}
										{inCart && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#0F4C75]" />}
										
										<div className="pr-4 z-10">
											<p className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
												{item.name_en}
											</p>
										</div>
										<div className="flex justify-between items-end z-10">
											<p className="text-sm font-black text-[#0F4C75] dark:text-[#3282B8]">
												{item.price.toFixed(3)} KD
											</p>
										</div>
										{inCart && (
											<div className="absolute -top-1 -right-1 bg-[#0F4C75] text-white text-[11px] font-black w-8 h-8 flex items-center justify-center rounded-bl-xl shadow-md z-20">
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
				<aside className="w-full max-w-[340px] xl:max-w-[400px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700/50 flex flex-col shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-20 relative">
					{/* Ticket Header */}
					<div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-1 bg-gray-50/50 dark:bg-gray-800/80">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-black text-gray-900 dark:text-white leading-none">
								{activeOrderType === "dine_in" ? (
									selectedTableId ? `Table ${tables.find(t=>t.id===selectedTableId)?.table_number}` : "Select Table"
								) : activeOrderType === "takeaway" ? (
									"Takeaway"
								) : (
									existingActiveOrder?.tableNumber ? `Table ${existingActiveOrder.tableNumber}` : "Takeaway"
								)}
							</h2>
							{activeOrderType === "existing" && (
								<span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
									{shortOrderId(activeOrderId!)}
								</span>
							)}
						</div>
						<p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
							{activeOrderType === "existing" ? "Current Order" : "New Order"}
						</p>
					</div>

					{/* Ticket Items */}
					<div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-800">
						{displayItems.length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 opacity-80">
								<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4 shadow-inner">
									<UtensilsCrossed size={24} />
								</div>
								<p className="text-sm font-bold uppercase tracking-wider">Empty Ticket</p>
								<p className="text-xs mt-2 text-center text-gray-400 font-medium">Add items from the menu.</p>
							</div>
						) : (
							<div className="space-y-3">
								<AnimatePresence>
									{displayItems.map((item) => (
										<motion.div
											layout
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.95 }}
											key={item.id}
											className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3 group"
										>
											<div className="flex justify-between items-start gap-2">
												<p className="text-sm font-bold text-gray-900 dark:text-white leading-tight flex-1">
													{item.name}
												</p>
												<p className="text-sm font-black text-[#0F4C75] dark:text-[#3282B8]">
													{(item.price * item.quantity).toFixed(3)}
												</p>
											</div>
											
											{activeOrderType !== "existing" && (
												<div className="flex items-center self-start bg-gray-50 dark:bg-gray-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
													<button
														onClick={() => removeFromCart(item.id)}
														className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-red-500 hover:shadow-sm transition-all"
													>
														{item.quantity > 1 ? <Minus size={16} strokeWidth={3} /> : <Trash2 size={16} />}
													</button>
													<span className="text-xs font-black text-gray-900 dark:text-white w-8 text-center tabular-nums">
														{item.quantity}
													</span>
													<button
														onClick={() => {
															// Find the raw item to add back
															const rawItem = menuItems.find(m => m.id === item.id);
															if (rawItem) addToCart(rawItem);
														}}
														className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-[#0F4C75] hover:shadow-sm transition-all"
													>
														<Plus size={16} strokeWidth={3} />
													</button>
												</div>
											)}
											{activeOrderType === "existing" && (
												<div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
													Qty: <span className="text-gray-900 dark:text-white">{item.quantity}</span>
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
						<div className="flex flex-col border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20">
							{/* Totals Block */}
							<div className="p-5 flex justify-between items-end border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
								<div>
									<p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Grand Total</p>
									<p className="text-xs font-bold text-gray-500 dark:text-gray-400">Contains {displayItems.reduce((acc, i) => acc + i.quantity, 0)} items</p>
								</div>
								<div className="text-right">
									<p className="text-3xl font-black text-[#0F4C75] dark:text-[#3282B8] tabular-nums tracking-tight">
										{displayTotal.toFixed(3)}
										<span className="text-sm ml-1 text-gray-400 dark:text-gray-500">KD</span>
									</p>
								</div>
							</div>

							{/* Action Buttons Grid */}
							<div className="p-4 grid gap-2 grid-cols-2">
								{activeOrderType !== "existing" ? (
									<>
										<button
											onClick={handleVoidOrder}
											className="col-span-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-black hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all outline-none"
										>
											<Trash2 size={16} /> Void
										</button>
										<button
											onClick={handleSendToKitchen}
											disabled={isSubmittingOrder || (activeOrderType === "dine_in" && !selectedTableId)}
											className="col-span-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-500 text-white text-sm font-black hover:bg-orange-600 active:scale-95 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 outline-none"
										>
											<ChefHat size={16} /> {isSubmittingOrder ? "..." : "Send"}
										</button>
									</>
								) : (
									<>
										<button
											onClick={handleVoidOrder}
											disabled={isVoiding}
											className="col-span-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-black hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all outline-none"
										>
											<CircleSlash size={16} /> {isVoiding ? "..." : "Void"}
										</button>
										<button
											onClick={() => existingActiveOrder && handlePrintOrder(existingActiveOrder)}
											className="col-span-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-black hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95 transition-all outline-none"
										>
											<Printer size={16} /> Print
										</button>
										<button
											onClick={handleCollectPayment}
											disabled={isProcessingPayment}
											className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-500 text-white text-base font-black hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 outline-none uppercase tracking-wider mt-1"
										>
											<CreditCard size={18} strokeWidth={2.5}/> {isProcessingPayment ? "Processing..." : "Collect Payment"}
										</button>
									</>
								)}
							</div>
						</div>
					)}
				</aside>
			</div>
			
			{/* Print Template (Hidden normally) */}
			{printOrder && (
				<div className="hidden print:block fixed inset-0 bg-white p-8 text-black z-50">
					<div className="text-center font-bold mb-6">
						<h2 className="text-2xl">{restaurant?.name || "Tawla"}</h2>
						<p className="text-sm mt-1">Order {shortOrderId(printOrder.id)}</p>
						<p className="text-sm">{printOrder.createdAt.toLocaleString()}</p>
					</div>
					<div className="mb-4">
						{printOrder.items.map((item) => (
							<div key={item.id} className="flex justify-between items-center text-sm mb-1">
								<span>{item.quantity}x {item.name}</span>
								<span>{(item.quantity * item.price).toFixed(3)} KD</span>
							</div>
						))}
					</div>
					<div className="border-t-2 border-dashed border-black pt-2 mt-4 text-right">
						<h3 className="text-lg font-bold">Total: {printOrder.total.toFixed(3)} KD</h3>
					</div>
				</div>
			)}
		</div>
	);
}
