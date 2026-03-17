import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { Restaurant, Category, MenuItem, MenuItemWithCategory, Table } from '@/types/database';

export const getRestaurantBySlug = cache(async (slug: string): Promise<Restaurant | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
  
  return data;
});

export async function getCategoriesByRestaurant(restaurantId: string): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('sort_order', { ascending: true });
  
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  
  return data || [];
}

export async function getMenuItemsByRestaurant(restaurantId: string): Promise<MenuItemWithCategory[]> {
  const supabase = await createClient();
  
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurantId);
  
  if (catError || !categories) {
    console.error('Error fetching categories:', catError);
    return [];
  }
  
  const categoryIds = categories.map(c => c.id);
  
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .in('category_id', categoryIds)
    .eq('is_available', true);
  
  if (itemsError || !items) {
    console.error('Error fetching menu items:', itemsError);
    return [];
  }
  
  return items.map(item => ({
    ...item,
    category: categories.find(c => c.id === item.category_id)!,
  }));
}

export async function getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_id', categoryId)
    .eq('is_available', true);
  
  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
  
  return data || [];
}

export async function getTableByNumber(restaurantId: string, tableNumber: number): Promise<Table | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('table_number', tableNumber)
    .single();
  
  if (error) {
    console.error('Error fetching table:', error);
    return null;
  }
  
  return data;
}

export async function getTablesByRestaurant(restaurantId: string): Promise<Table[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('table_number', { ascending: true });
  
  if (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
  
  return data || [];
}

export async function getMenuItemById(itemId: string): Promise<MenuItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', itemId)
    .single();
  
  if (error) {
    console.error('Error fetching menu item:', error);
    return null;
  }
  
  return data;
}
