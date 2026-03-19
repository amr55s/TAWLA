export type OrderStatus =
	| "pending"
	| "confirmed"
	| "preparing"
	| "confirmed_by_waiter"
	| "in_kitchen"
	| "ready"
	| "served"
	| "paid"
	| "cancelled"
	| "completed";
export type WaiterCallType = "assistance" | "bill";
export type WaiterCallStatus = "active" | "resolved";

export interface ThemeColors {
	primary: string;
	background: string;
	accent?: string;
	fontFamily?: string;
}

export interface Restaurant {
	id: string;
	name: string;
	slug: string;
	logo_url: string | null;
	theme_colors: ThemeColors;
	table_count?: number;
	created_at?: string;
}

export interface Category {
	id: string;
	restaurant_id: string;
	name_ar: string;
	name_en: string;
	sort_order: number;
	created_at?: string;
}

export interface MenuItem {
	id: string;
	category_id: string;
	name_ar: string;
	name_en: string;
	description_ar: string | null;
	description_en: string | null;
	price: number;
	image_url: string | null;
	cross_sell_items: string[] | null;
	is_available?: boolean;
	created_at?: string;
}

export interface MenuItemWithCategory extends MenuItem {
	category: Category;
}

export interface Table {
	id: string;
	restaurant_id: string;
	table_number: number;
	qr_code_url: string | null;
	created_at?: string;
}

export interface Order {
	id: string;
	restaurant_id: string;
	table_id: string;
	guest_id?: string | null;
	order_number: number;
	qr_code_data?: string | null;
	status: OrderStatus;
	total_amount: number;
	special_requests?: string | null;
	created_at: string;
	updated_at?: string;
}

export interface OrderItem {
	id: string;
	order_id: string;
	menu_item_id: string;
	quantity: number;
	price_at_time: number;
	special_requests: string | null;
	created_at?: string;
}

export interface OrderItemWithDetails extends OrderItem {
	menu_item: MenuItem;
}

export interface OrderWithItems extends Order {
	items: OrderItemWithDetails[];
	table?: Table;
}

export interface WaiterCall {
	id: string;
	restaurant_id: string;
	table_id: string;
	type: WaiterCallType;
	status: WaiterCallStatus;
	created_at: string;
}

export interface WaiterCallWithTable extends WaiterCall {
	table: Table;
}

export interface Database {
	public: {
		Tables: {
			restaurants: {
				Row: Restaurant;
				Insert: Omit<Restaurant, "id" | "created_at">;
				Update: Partial<Omit<Restaurant, "id">>;
			};
			categories: {
				Row: Category;
				Insert: Omit<Category, "id" | "created_at">;
				Update: Partial<Omit<Category, "id">>;
			};
			menu_items: {
				Row: MenuItem;
				Insert: Omit<MenuItem, "id" | "created_at">;
				Update: Partial<Omit<MenuItem, "id">>;
			};
			tables: {
				Row: Table;
				Insert: Omit<Table, "id" | "created_at">;
				Update: Partial<Omit<Table, "id">>;
			};
			orders: {
				Row: Order;
				Insert: Omit<Order, "id" | "created_at">;
				Update: Partial<Omit<Order, "id">>;
			};
			order_items: {
				Row: OrderItem;
				Insert: Omit<OrderItem, "id" | "created_at">;
				Update: Partial<Omit<OrderItem, "id">>;
			};
			waiter_calls: {
				Row: WaiterCall;
				Insert: Omit<WaiterCall, "id" | "created_at">;
				Update: Partial<Omit<WaiterCall, "id">>;
			};
		};
	};
}
