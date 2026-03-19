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
} from "lucide-react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	getRestaurantBySlugClient,
	getTablesByRestaurantClient,
} from "@/lib/data/orders.client";
import { createClient } from "@/lib/supabase/client";
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
] as const;
const CLEARABLE_ORDER_STATUSES = [
	...CASHIER_ACTIVE_ORDER_STATUSES,
	"pending",
	"in_kitchen",
	"ready",
] as const;

interface DailyInsights {
	totalRevenue: number;
	totalOrders: number;
}

// Generates a short order ID from UUID, e.g. "ORD-4A2F"
function shortOrderId(uuid: string): string {
	return "ORD-" + uuid.slice(-4).toUpperCase();
}

// -- New Order types --
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
}

export default function CashierDashboardPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const router = useRouter();
	const { slug } = React.use(params);

	const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
	const [tables, setTables] = useState<Table[]>([]);
	// We'll store orders by ID directly, or group by table. For takeaway, table is 'takeaway'
	const [orders, setOrders] = useState<TableOrder[]>([]);

	const [isLoading, setIsLoading] = useState(true);

	// What is selected in the right panel? Either 'new_order' or an Order ID
	const [activePane, setActivePane] = useState<"new_order" | string>(
		"new_order",
	);

	const [isMarkingPaid, setIsMarkingPaid] = useState(false);
	const [isClearingTable, setIsClearingTable] = useState(false);

	const [insights, setInsights] = useState<DailyInsights>({
		totalRevenue: 0,
		totalOrders: 0,
	});

	// -- Order receipt / print state --
	const [printOrder, setPrintOrder] = useState<TableOrder | null>(null);

	// -- Menu Data (fetched once) --
	const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
	const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("all");

	// -- Cart --
	const [cart, setCart] = useState<CartItem[]>([]);
	const [newOrderTable, setNewOrderTable] = useState<string>("takeaway");
	const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
	const isSubmittingOrderRef = useRef(false);

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
			console.error(
				"Cashier orders fetch failed:",
				JSON.stringify(error, null, 2),
			);
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

	const fetchDailyInsights = React.useCallback(async (restaurantId: string) => {
		const dayStart = new Date();
		dayStart.setHours(0, 0, 0, 0);
		const dayEnd = new Date();
		dayEnd.setHours(23, 59, 59, 999);

		const { data, error } = await supabase
			.from("orders")
			.select("id, total_amount")
			.eq("restaurant_id", restaurantId)
			.in("status", ["paid", "completed"])
			.gte("created_at", dayStart.toISOString())
			.lte("created_at", dayEnd.toISOString());

		if (error || !data) {
			console.error("Cashier insights fetch failed:", error);
			setInsights({ totalRevenue: 0, totalOrders: 0 });
			return;
		}

		const totalRevenue = data.reduce(
			(acc, order) => acc + Number(order.total_amount || 0),
			0,
		);
		setInsights({ totalRevenue, totalOrders: data.length });
	}, []);

	const fetchMenuData = React.useCallback(async (restaurantId: string) => {
		const { data, error } = await supabase
			.from("categories")
			.select(
				"id, name_en, menu_items(id, name_en, price, category_id, is_available)",
			)
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

	// Realtime
	useEffect(() => {
		if (!restaurant?.id) return;
		const channel = supabase
			.channel(`cashier-orders-${restaurant.id}`)
			.on(
				"postgres_changes",
				{
					event: "*",
					schema: "public",
					table: "orders",
					filter: `restaurant_id=eq.${restaurant.id}`,
				},
				async () => {
					if (!restaurant?.id) return;
					const ords = await fetchActiveOrders(restaurant.id);
					setOrders(ords);
					await fetchDailyInsights(restaurant.id);
				},
			)
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [restaurant?.id, fetchActiveOrders, fetchDailyInsights]);

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

				const staffId = localStorage.getItem(
					`tawla_staff_${restaurantData.id}_cashier`,
				);
				if (!staffId) {
					router.push(`/${slug}/login`);
					return;
				} // Redirect to unified login

				if (cancelled) return;
				setRestaurant(restaurantData);

				const [tablesData, ords] = await Promise.all([
					getTablesByRestaurantClient(restaurantData.id),
					fetchActiveOrders(restaurantData.id),
					fetchDailyInsights(restaurantData.id),
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
		return () => {
			cancelled = true;
		};
	}, [slug, router, fetchActiveOrders, fetchDailyInsights, fetchMenuData]);

	// ───────────────── Handlers ─────────────────

	const handleMarkOrderPaid = async (orderId: string) => {
		if (!restaurant?.id) return;
		setIsMarkingPaid(true);
		try {
			const orderToPay = orders.find((o) => o.id === orderId);

			const { error: markPaidError } = await supabase
				.from("orders")
				.update({ status: "paid" })
				.eq("id", orderId)
				.eq("restaurant_id", restaurant.id);
			if (markPaidError) throw markPaidError;

			if (orderToPay?.tableNumber) {
				// Find table ID
				const targetTable = tables.find(
					(t) => t.table_number === orderToPay.tableNumber,
				);
				if (targetTable) {
					const { error: resolveCallError } = await supabase
						.from("waiter_calls")
						.update({ status: "resolved" })
						.eq("table_id", targetTable.id)
						.eq("status", "active")
						.eq("restaurant_id", restaurant.id);
					if (resolveCallError) throw resolveCallError;
				}
			}

			posthog.capture("order_settled", {
				order_id: orderId,
				total_amount: orders.find((o) => o.id === orderId)?.total,
				table_number: orders.find((o) => o.id === orderId)?.tableNumber,
				restaurant_slug: slug,
				currency: "KWD",
			});
			toast.success("Order settled successfully");
			setActivePane("new_order");
		} catch (error) {
			console.error("Failed to mark order as paid:", error);
			posthog.captureException(error);
			toast.error("Failed to settle order");
		} finally {
			setIsMarkingPaid(false);
		}
	};

	const handleCancelOrder = async (orderId: string) => {
		const confirmed = window.confirm(
			"Are you sure you want to cancel this order?",
		);
		if (!confirmed || !restaurant?.id) return;

		setIsClearingTable(true);
		try {
			const { error } = await supabase
				.from("orders")
				.update({ status: "cancelled" })
				.eq("id", orderId)
				.eq("restaurant_id", restaurant.id);
			if (error) throw error;

			toast.success("Order cancelled");
			setActivePane("new_order");
		} catch (error) {
			console.error("Failed to cancel order:", error);
			toast.error("Failed to cancel order");
		} finally {
			setIsClearingTable(false);
		}
	};

	const handlePrintOrder = (order: TableOrder) => {
		setPrintOrder(order);
		setTimeout(() => window.print(), 200);
	};

	// ───────────────── New Order ─────────────────

	const addToCart = (item: MenuItemRow) => {
		setCart((prev) => {
			const existing = prev.find((c) => c.menuItemId === item.id);
			if (existing) {
				return prev.map((c) =>
					c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
				);
			}
			return [
				...prev,
				{
					menuItemId: item.id,
					name: item.name_en,
					price: item.price,
					quantity: 1,
				},
			];
		});
	};

	const removeFromCart = (menuItemId: string) => {
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

	const submitNewOrder = async () => {
		if (!restaurant?.id || cart.length === 0 || isSubmittingOrderRef.current)
			return;

		isSubmittingOrderRef.current = true;
		setIsSubmittingOrder(true);

		try {
			let tableId = null;
			if (newOrderTable !== "takeaway") {
				const targetTable = tables.find(
					(t) => String(t.table_number) === newOrderTable,
				);
				if (targetTable) tableId = targetTable.id;
			}

			// Create the order
			const { data: orderData, error: orderError } = await supabase
				.from("orders")
				.insert({
					restaurant_id: restaurant.id,
					table_id: tableId,
					status: "confirmed", // Cashier punch immediately confirms
					total_amount: cartTotal,
				})
				.select("id")
				.single();

			if (orderError || !orderData) throw orderError;

			// Insert order items
			const orderItems = cart.map((c) => ({
				order_id: orderData.id,
				menu_item_id: c.menuItemId,
				quantity: c.quantity,
				price_at_time: c.price,
			}));

			const { error: itemsError } = await supabase
				.from("order_items")
				.insert(orderItems);
			if (itemsError) throw itemsError;

			posthog.capture("cashier_order_created", {
				order_id: orderData.id,
				table_number: newOrderTable === "takeaway" ? null : newOrderTable,
				order_type: newOrderTable === "takeaway" ? "takeaway" : "table",
				item_count: cart.reduce((sum, c) => sum + c.quantity, 0),
				total_amount: cartTotal,
				restaurant_slug: slug,
				currency: "KWD",
			});
			toast.success(`Order ${shortOrderId(orderData.id)} created successfully`);
			setCart([]);
			setNewOrderTable("takeaway");
		} catch (error) {
			console.error("Failed to create order:", error);
			posthog.captureException(error);
			toast.error("Failed to create order");
		} finally {
			isSubmittingOrderRef.current = false;
			setIsSubmittingOrder(false);
		}
	};

	const filteredMenuItems =
		selectedCategory === "all"
			? menuItems
			: menuItems.filter((m) => m.category_id === selectedCategory);

	const now = new Date();

	// ───────────────── Render ─────────────────

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
				<div className="animate-spin w-8 h-8 border-2 border-[#0F4C75] border-t-transparent rounded-full" />
			</div>
		);
	}

	const activeOrderDetails =
		activePane !== "new_order" ? orders.find((o) => o.id === activePane) : null;

	return (
		<>
			<div className="min-h-screen flex flex-col bg-[#F5F7FA] print:hidden overflow-hidden h-screen">
				{/* ── Top Header ── */}
				<header className="bg-white border-b border-[#E8ECF1] px-6 h-[72px] flex-shrink-0 flex items-center justify-between z-10 w-full shadow-sm">
					<div className="flex items-center gap-6">
						<div>
							<h1 className="text-xl font-bold text-[#0A1628] leading-tight">
								{restaurant?.name}
							</h1>
							<p className="text-[11px] text-[#64748B] font-medium tracking-wide uppercase">
								Cashier Terminal
							</p>
						</div>

						{/* Daily Ledger Widget */}
						<div className="hidden md:flex items-center gap-6 ms-4 border-l border-[#E8ECF1] pl-6 h-10">
							<div>
								<p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-0.5">
									Today's Revenue
								</p>
								<p className="text-lg font-black text-[#0F4C75] leading-none">
									{insights.totalRevenue.toFixed(3)}{" "}
									<span className="text-xs font-semibold">KD</span>
								</p>
							</div>
							<div>
								<p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider mb-0.5">
									Orders Settled
								</p>
								<p className="text-lg font-black text-[#3282B8] leading-none">
									{insights.totalOrders}
								</p>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
							<span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
							<span className="text-xs text-emerald-700 font-bold">Online</span>
						</div>
						<button
							onClick={() => {
								localStorage.removeItem(
									`tawla_staff_${restaurant?.id}_cashier`,
								);
								router.push(`/${slug}/login`);
							}}
							className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
							title="Logout"
						>
							<LogOut size={18} />
						</button>
					</div>
				</header>

				{/* ── Main POS Workspace ── */}
				<div className="flex-1 flex overflow-hidden">
					{/* LEFT SIDEBAR: ACTIVE ORDERS QUEUE */}
					<aside className="w80 lg:w-[320px] bg-white border-r border-[#E8ECF1] flex flex-col flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
						<div className="p-4 border-b border-[#E8ECF1]">
							<button
								onClick={() => {
									setActivePane("new_order");
									setCart([]);
									setNewOrderTable("takeaway");
								}}
								className={`w-full py-3 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${activePane === "new_order" ? "bg-[#0F4C75] text-white" : "bg-[#E8F4FD] text-[#0F4C75] hover:bg-[#D1EAFD]"}`}
							>
								<Plus size={16} /> New Walk-in Order
							</button>
						</div>
						<div className="px-4 pt-4 pb-2 border-b border-[#F1F5F9] bg-[#F8FAFC]">
							<h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center justify-between">
								Active Orders Queue
								<span className="bg-[#0F4C75] text-white px-2 py-0.5 rounded-full text-[10px]">
									{orders.length}
								</span>
							</h3>
						</div>
						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							{orders.length === 0 ? (
								<div className="text-center py-10 text-[#94A3B8]">
									<span className="text-3xl block mb-2 opacity-30">📋</span>
									<p className="text-xs">No active orders</p>
								</div>
							) : (
								orders.map((order) => (
									<button
										key={order.id}
										onClick={() => setActivePane(order.id)}
										className={`w-full text-left p-3 rounded-xl border transition-all ${
											activePane === order.id
												? "border-[#0F4C75] bg-[#F8FAFC] shadow-sm ring-1 ring-[#0F4C75]"
												: "border-[#E8ECF1] bg-white hover:border-[#CBD5E1]"
										}`}
									>
										<div className="flex justify-between items-start mb-1">
											<span className="text-xs font-mono font-bold text-[#0F4C75] bg-[#E8F4FD] px-1.5 py-0.5 rounded">
												{shortOrderId(order.id)}
											</span>
											<span className="text-[10px] font-bold text-[#64748B]">
												{order.createdAt.toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</span>
										</div>
										<p className="text-sm font-bold text-[#0A1628] mb-1">
											{order.tableNumber
												? `Table ${order.tableNumber}`
												: "Takeaway / Walk-in"}
										</p>
										<div className="flex justify-between items-end">
											<span className="text-xs text-[#64748B]">
												{order.items.length} items
											</span>
											<span className="text-sm font-black text-[#0F4C75]">
												{order.total.toFixed(3)} KD
											</span>
										</div>
									</button>
								))
							)}
						</div>
					</aside>

					{/* RIGHT AREA: CONTEXTUAL VIEW (NEW ORDER OR ORDER DETAILS) */}
					<main className="flex-1 overflow-hidden bg-[#F5F7FA]">
						{activePane === "new_order" ? (
							/* NEW ORDER VIEW */
							<div className="h-full flex flex-col lg:flex-row">
								{/* Menu Section */}
								<div className="flex-1 flex flex-col h-full overflow-hidden">
									<div className="bg-white border-b border-[#E8ECF1] px-6 py-4 flex gap-2 overflow-x-auto min-h-[64px] items-center">
										<button
											onClick={() => setSelectedCategory("all")}
											className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
												selectedCategory === "all"
													? "bg-[#0F4C75] text-white shadow-md"
													: "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
											}`}
										>
											All Items
										</button>
										{menuCategories.map((cat) => (
											<button
												key={cat.id}
												onClick={() => setSelectedCategory(cat.id)}
												className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
													selectedCategory === cat.id
														? "bg-[#0F4C75] text-white shadow-md"
														: "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
												}`}
											>
												{cat.name_en}
											</button>
										))}
									</div>
									<div className="flex-1 overflow-y-auto p-6">
										<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
											{filteredMenuItems.map((item) => {
												const inCart = cart.find(
													(c) => c.menuItemId === item.id,
												);
												return (
													<motion.button
														key={item.id}
														onClick={() => addToCart(item)}
														whileTap={{ scale: 0.96 }}
														className={`text-left p-4 rounded-2xl border transition-all h-[100px] flex flex-col justify-between shadow-sm relative overflow-hidden ${
															inCart
																? "border-[#0F4C75] bg-[#E8F4FD]"
																: "border-[#E8ECF1] bg-white hover:border-[#CBD5E1]"
														}`}
													>
														<p className="text-sm font-bold text-[#0A1628] line-clamp-2 leading-tight pr-4">
															{item.name_en}
														</p>
														<p className="text-sm font-black text-[#0F4C75]">
															{item.price.toFixed(3)} KD
														</p>
														{inCart && (
															<div className="absolute top-0 right-0 bg-[#0F4C75] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
																x{inCart.quantity}
															</div>
														)}
													</motion.button>
												);
											})}
										</div>
									</div>
								</div>

								{/* Cart Sidebar */}
								<div className="w-full lg:w-[320px] xl:w-[380px] bg-white border-l border-[#E8ECF1] flex flex-col h-full shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-10">
									<div className="p-5 border-b border-[#E8ECF1] bg-[#F8FAFC]">
										<h2 className="text-lg font-black text-[#0A1628]">
											Current Order
										</h2>
										<div className="mt-3">
											<label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
												Punch to Table
											</label>
											<select
												value={newOrderTable}
												onChange={(e) => setNewOrderTable(e.target.value)}
												className="w-full py-2.5 px-3 bg-white border border-[#E8ECF1] rounded-xl text-sm font-bold text-[#0F4C75] focus:outline-none focus:ring-2 focus:ring-[#0F4C75]/20 transition-all shadow-sm"
											>
												<option value="takeaway">Takeaway / Walk-in</option>
												{tables.map((t) => (
													<option key={t.id} value={String(t.table_number)}>
														Table {t.table_number}
													</option>
												))}
											</select>
										</div>
									</div>

									<div className="flex-1 overflow-y-auto p-4 bg-white">
										{cart.length === 0 ? (
											<div className="h-full flex flex-col items-center justify-center text-[#94A3B8] opacity-60">
												<UtensilsCrossed size={48} className="mb-4" />
												<p className="text-sm font-medium">Cart is empty</p>
												<p className="text-xs mt-1 text-center">
													Tap items on the left
													<br />
													to add them.
												</p>
											</div>
										) : (
											<div className="space-y-3">
												<AnimatePresence>
													{cart.map((c) => (
														<motion.div
															layout
															initial={{ opacity: 0, y: 10 }}
															animate={{ opacity: 1, y: 0 }}
															exit={{ opacity: 0, scale: 0.9 }}
															key={c.menuItemId}
															className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E8ECF1]"
														>
															<div className="flex justify-between items-start mb-2">
																<p className="text-sm font-bold text-[#0A1628] leading-tight flex-1 pr-2">
																	{c.name}
																</p>
																<p className="text-sm font-black text-[#0F4C75]">
																	{(c.price * c.quantity).toFixed(3)}
																</p>
															</div>
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-1 bg-white border border-[#E2E8F0] p-0.5 rounded-lg shadow-sm">
																	<button
																		onClick={() => removeFromCart(c.menuItemId)}
																		className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-500 transition-colors"
																	>
																		{c.quantity > 1 ? (
																			<Minus size={14} strokeWidth={3} />
																		) : (
																			<Trash2 size={14} />
																		)}
																	</button>
																	<span className="text-xs font-black text-[#0A1628] w-6 text-center">
																		{c.quantity}
																	</span>
																	<button
																		onClick={() =>
																			addToCart({
																				id: c.menuItemId,
																				name_en: c.name,
																				price: c.price,
																				category_id: "",
																				is_available: true,
																			})
																		}
																		className="w-8 h-8 rounded shrink-0 flex items-center justify-center text-[#64748B] hover:bg-[#E8F4FD] hover:text-[#0F4C75] transition-colors"
																	>
																		<Plus size={14} strokeWidth={3} />
																	</button>
																</div>
															</div>
														</motion.div>
													))}
												</AnimatePresence>
											</div>
										)}
									</div>

									{cart.length > 0 && (
										<div className="p-5 border-t border-[#E8ECF1] bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-20">
											<div className="flex justify-between items-center mb-4">
												<span className="text-sm font-bold text-[#64748B] uppercase tracking-wider">
													Total
												</span>
												<span className="text-2xl font-black text-[#0F4C75]">
													{cartTotal.toFixed(3)}{" "}
													<span className="text-sm">KD</span>
												</span>
											</div>
											<button
												onClick={submitNewOrder}
												disabled={isSubmittingOrder}
												className="w-full py-4 bg-[#0F4C75] text-white rounded-xl text-[15px] font-bold disabled:opacity-60 hover:bg-[#0A3558] transition-transform active:scale-[0.98] shadow-[0_4px_14px_rgba(15,76,117,0.3)] flex items-center justify-center gap-2"
											>
												{isSubmittingOrder ? (
													<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
												) : (
													"Confirm Order"
												)}
											</button>
										</div>
									)}
								</div>
							</div>
						) : activeOrderDetails ? (
							/* ACTIVE ORDER VIEW */
							<div className="h-full flex justify-center items-start p-6 lg:p-12 overflow-y-auto">
								<div className="w-full max-w-2xl bg-white border border-[#E8ECF1] rounded-3xl p-8 shadow-sm">
									<div className="flex items-start justify-between mb-8 pb-6 border-b border-[#F1F5F9]">
										<div>
											<div className="flex items-center gap-3 mb-2">
												<span className="bg-[#E8F4FD] text-[#0F4C75] font-mono font-bold text-sm px-2.5 py-1 rounded-lg">
													{shortOrderId(activeOrderDetails.id)}
												</span>
												<span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
													{activeOrderDetails.status.replace(/_/g, " ")}
												</span>
											</div>
											<h2 className="text-2xl font-black text-[#0A1628]">
												{activeOrderDetails.tableNumber
													? `Table ${activeOrderDetails.tableNumber}`
													: "Takeaway Order"}
											</h2>
											<p className="text-sm text-[#64748B] mt-1 flex items-center gap-1.5 font-medium">
												<Clock size={14} /> Created at{" "}
												{activeOrderDetails.createdAt.toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}
											</p>
										</div>

										<button
											onClick={() => handlePrintOrder(activeOrderDetails)}
											className="px-4 py-2 bg-[#F8FAFC] text-[#0A1628] border border-[#E8ECF1] rounded-xl text-sm font-bold hover:bg-[#F1F5F9] transition-colors flex items-center gap-2 shadow-sm"
										>
											<Printer size={16} /> Print Receipt
										</button>
									</div>

									<div className="space-y-4 mb-8">
										{activeOrderDetails.items.map((item) => (
											<div
												key={item.id}
												className="flex justify-between items-center p-4 bg-[#F8FAFC] rounded-2xl border border-[#E8ECF1]"
											>
												<div className="flex gap-4 items-center">
													<div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-[#E2E8F0] flex items-center justify-center font-black text-[#0F4C75]">
														x{item.quantity}
													</div>
													<div>
														<p className="text-base font-bold text-[#0A1628]">
															{item.name}
														</p>
														{item.specialRequests && (
															<p className="text-xs font-semibold text-amber-600 mt-0.5 max-w-[200px] truncate">
																Note: {item.specialRequests}
															</p>
														)}
													</div>
												</div>
												<p className="text-base font-black text-[#0F4C75]">
													{(item.price * item.quantity).toFixed(3)} KD
												</p>
											</div>
										))}
									</div>

									<div className="bg-[#F8FAFC] p-6 rounded-2xl border border-[#E8ECF1] mb-8 flex justify-between items-center">
										<span className="text-sm font-bold text-[#64748B] uppercase tracking-wider">
											Total Amount
										</span>
										<span className="text-3xl font-black text-[#0F4C75]">
											{activeOrderDetails.total.toFixed(3)} KD
										</span>
									</div>

									<div className="flex gap-4">
										<button
											onClick={() => handleCancelOrder(activeOrderDetails.id)}
											disabled={isClearingTable || isMarkingPaid}
											className="flex-1 py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl text-[15px] font-bold hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
										>
											Cancel Order
										</button>
										<button
											onClick={() => handleMarkOrderPaid(activeOrderDetails.id)}
											disabled={isMarkingPaid || isClearingTable}
											className="flex-[2] py-4 bg-[#0F4C75] text-white rounded-2xl text-[15px] font-bold hover:bg-[#0A3558] transition-all shadow-[0_4px_14px_rgba(15,76,117,0.3)] disabled:opacity-70 flex items-center justify-center gap-2"
										>
											{isMarkingPaid ? (
												<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
											) : (
												"Settle Payment"
											)}
										</button>
									</div>
								</div>
							</div>
						) : null}
					</main>
				</div>
			</div>

			{/* ── Print Receipt (Desktop Thermal Style) ── */}
			{printOrder && (
				<div
					id="invoice-print"
					className="hidden print:flex justify-center w-full bg-white text-black font-sans p-8"
				>
					<div className="w-[300px]">
						<div className="text-center mb-6">
							<h1 className="text-2xl font-black">{restaurant?.name}</h1>
							<p className="text-sm font-bold mt-1 uppercase tracking-widest text-gray-500">
								Invoice
							</p>
						</div>

						<div className="border-t-2 border-dashed border-gray-400 py-3 mb-3">
							<div className="flex justify-between text-sm mb-1">
								<span className="font-semibold text-gray-600">Order ID:</span>
								<span className="font-bold">{shortOrderId(printOrder.id)}</span>
							</div>
							<div className="flex justify-between text-sm mb-1">
								<span className="font-semibold text-gray-600">Type:</span>
								<span className="font-bold">
									{printOrder.tableNumber
										? `Table ${printOrder.tableNumber}`
										: "Takeaway"}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span className="font-semibold text-gray-600">Date:</span>
								<span className="font-bold">
									{now.toLocaleDateString()}{" "}
									{now.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
						</div>

						<div className="border-t-2 border-dashed border-gray-400 pt-3 mb-4">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b-2 border-gray-300">
										<th className="text-left pb-2 font-bold uppercase tracking-wider w-[10%]">
											Qty
										</th>
										<th className="text-left pb-2 font-bold uppercase tracking-wider">
											Item
										</th>
										<th className="text-right pb-2 font-bold uppercase tracking-wider">
											Amt
										</th>
									</tr>
								</thead>
								<tbody>
									{printOrder.items.map((item) => (
										<tr key={item.id}>
											<td className="py-2 text-left font-bold border-b border-gray-100">
												{item.quantity}
											</td>
											<td className="py-2 pr-2 border-b border-gray-100 font-semibold">
												{item.name}
											</td>
											<td className="py-2 text-right font-bold border-b border-gray-100">
												{(item.price * item.quantity).toFixed(2)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						<div className="border-t-2 border-dashed border-gray-400 pt-4 mt-2">
							<div className="flex justify-between items-center text-lg">
								<span className="font-bold uppercase tracking-widest">
									Total
								</span>
								<span className="font-black">
									{printOrder.total.toFixed(3)} KD
								</span>
							</div>
						</div>

						<div className="text-center mt-10">
							<p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
								Thank you for visiting
							</p>
							<p className="text-[10px] text-gray-400 mt-1">
								Powered by Tawla POS
							</p>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
