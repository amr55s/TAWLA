'use client';

import { createClient } from '@/lib/supabase/client';
import type { Order, OrderItem, OrderStatus, Table, Category, MenuItem, MenuItemWithCategory, Restaurant } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

export async function getRestaurantBySlugClient(slug: string): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching restaurant:', JSON.stringify(error, null, 2), error);
    return null;
  }
  
  return data as Restaurant;
}

export async function getCategoriesByRestaurantClient(restaurantId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching categories:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return (data as Category[]) || [];
}

export async function getMenuItemsByRestaurantClient(restaurantId: string): Promise<MenuItemWithCategory[]> {
  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId);
  
  if (catError || !categoriesData) {
    console.error('Error fetching categories:', JSON.stringify(catError, null, 2), catError);
    return [];
  }
  
  const categories = categoriesData as Category[];
  const categoryIds = categories.map(c => c.id);
  
  const { data: itemsData, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .in('category_id', categoryIds)
    .eq('is_available', true);
  
  if (itemsError || !itemsData) {
    console.error('Error fetching menu items:', JSON.stringify(itemsError, null, 2), itemsError);
    return [];
  }
  
  const items = itemsData as MenuItem[];
  
  return items.map(item => ({
    ...item,
    category: categories.find(c => c.id === item.category_id)!,
  }));
}

export async function getActiveOrdersClient(restaurantId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .in('status', [
      'pending',
      'confirmed',
      'preparing',
      'served',
      // Backward compatibility for legacy rows.
      'confirmed_by_waiter',
      'in_kitchen',
      'ready',
    ])
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching active orders:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return (data as Order[]) || [];
}

export async function getOrderItemsClient(orderId: string) {
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_item:menu_items(name_en, name_ar)
    `)
    .eq('order_id', orderId);
  
  if (error) {
    console.error('Error fetching order items:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return data || [];
}

export async function updateOrderStatusClient(orderId: string, status: OrderStatus): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);
  
  if (error) {
    console.error('Error updating order status:', JSON.stringify(error, null, 2), error);
    return false;
  }
  
  return true;
}

export async function getTablesByRestaurantClient(restaurantId: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('table_number', { ascending: true });
  
  if (error) {
    console.error('Error fetching tables:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return (data as Table[]) || [];
}

export async function getTableByIdClient(tableId: string): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('id', tableId)
    .single();
  
  if (error) {
    console.error('Error fetching table:', JSON.stringify(error, null, 2), error);
    return null;
  }
  
  return data as Table;
}

export function subscribeToOrders(
  restaurantId: string,
  onInsert: (order: Order) => void,
  onUpdate: (order: Order) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`orders-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        onInsert(payload.new as Order);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        onUpdate(payload.new as Order);
      }
    )
    .subscribe();
  
  return channel;
}

export function unsubscribeFromChannel(channel: RealtimeChannel) {
  supabase.removeChannel(channel);
}

export interface CreateOrderClientInput {
  restaurant_id: string;
  table_id: string;
  total_amount: number;
  special_requests?: string;
  qr_code_data?: string;
  guest_id?: string;
  status?: OrderStatus;
  items: {
    menu_item_id: string;
    quantity: number;
    price_at_time: number;
  }[];
}

export async function createOrderWithItemsClient(input: CreateOrderClientInput): Promise<Order | null> {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: input.restaurant_id,
      table_id: input.table_id,
      total_amount: input.total_amount,
      special_requests: input.special_requests,
      qr_code_data: input.qr_code_data,
      guest_id: input.guest_id || null,
      // Guest orders must begin as pending and be confirmed by waiter later.
      status: input.status || 'pending',
    })
    .select()
    .single();
  
  if (orderError || !orderData) {
    console.error('Error creating order:', JSON.stringify(orderError, null, 2), orderError);
    return null;
  }
  
  const order = orderData as Order;
  
  const orderItems = input.items.map(item => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    price_at_time: item.price_at_time,
  }));
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);
  
  if (itemsError) {
    console.error('Error creating order items:', JSON.stringify(itemsError, null, 2), itemsError);
  }
  
  return order;
}

export async function getTableByNumberClient(restaurantId: string, tableNumber: number): Promise<Table | null> {
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('table_number', tableNumber)
    .single();
  
  if (error) {
    console.error('Error fetching table:', JSON.stringify(error, null, 2), error);
    return null;
  }
  
  return data as Table;
}
