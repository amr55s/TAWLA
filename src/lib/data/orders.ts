import { createClient } from '@/lib/supabase/server';
import type { Order, OrderItem, OrderStatus } from '@/types/database';

export interface CreateOrderInput {
  restaurant_id: string;
  table_id: string;
  total_amount: number;
  special_requests?: string;
  qr_code_data?: string;
}

export interface CreateOrderItemInput {
  order_id: string;
  menu_item_id: string;
  quantity: number;
  price_at_time: number;
  special_requests?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .insert({
      restaurant_id: input.restaurant_id,
      table_id: input.table_id,
      total_amount: input.total_amount,
      special_requests: input.special_requests,
      qr_code_data: input.qr_code_data,
      status: 'pending' as OrderStatus,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating order:', JSON.stringify(error, null, 2), error);
    return null;
  }
  
  return data;
}

export async function createOrderItems(items: CreateOrderItemInput[]): Promise<OrderItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select();
  
  if (error) {
    console.error('Error creating order items:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return data || [];
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating order status:', JSON.stringify(error, null, 2), error);
    return null;
  }
  
  return data;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error) {
    console.error('Error fetching order:', JSON.stringify(error, null, 2), error);
    return null;
  }
  
  return data;
}

export async function getOrderWithItems(orderId: string): Promise<(Order & { items: OrderItem[] }) | null> {
  const supabase = await createClient();
  
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (orderError || !order) {
    console.error('Error fetching order:', JSON.stringify(orderError, null, 2), orderError);
    return null;
  }
  
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);
  
  if (itemsError) {
    console.error('Error fetching order items:', JSON.stringify(itemsError, null, 2), itemsError);
    return { ...order, items: [] };
  }
  
  return { ...order, items: items || [] };
}

export async function getOrdersByRestaurant(restaurantId: string, status?: OrderStatus): Promise<Order[]> {
  const supabase = await createClient();
  
  let query = supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching orders:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return data || [];
}

export async function getActiveOrdersByRestaurant(restaurantId: string): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .in('status', ['confirmed', 'preparing', 'served', 'confirmed_by_waiter', 'in_kitchen', 'ready'])
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching active orders:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return data || [];
}

export async function getOrderItemsWithDetails(orderId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      menu_item:menu_items(*)
    `)
    .eq('order_id', orderId);
  
  if (error) {
    console.error('Error fetching order items with details:', JSON.stringify(error, null, 2), error);
    return [];
  }
  
  return data || [];
}
