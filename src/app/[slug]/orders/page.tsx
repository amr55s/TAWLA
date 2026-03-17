'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { createClient } from '@/lib/supabase/client';
import { FloatingNavBar } from '@/components/ui/FloatingNavBar';
import { SkeletonOrderCard } from '@/components/ui';

interface OrderHistoryItem {
  id: string;
  order_number?: number | null;
  total_amount: number;
  created_at: string;
  status: string;
  order_items: {
    id: string;
    quantity: number;
    price_at_time: number;
    menu_items: { name_en: string; name_ar: string } | null;
  }[];
}

export default function GuestOrdersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = React.use(params);
  const router = useRouter();
  const cartCount = useCartStore((s) => s.getTotalItems());

  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    const localGuestId = useCartStore.getState().guestId;

    if (!localGuestId) {
      console.warn("No guestId found, skipping fetch.");
      setLoading(false);
      return;
    }

    console.log("[GuestOrders] Fetching with guestId:", localGuestId);

    const supabase = createClient();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!restaurant) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_items(*))')
      .eq('guest_id', localGuestId)
      .eq('restaurant_id', restaurant.id)
      .in('status', ['pending', 'confirmed', 'preparing', 'confirmed_by_waiter', 'in_kitchen', 'ready', 'served'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fetch orders failed:", JSON.stringify(error, null, 2), error);
      setOrders([]);
    } else {
      setOrders((data as unknown as OrderHistoryItem[]) || []);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-200 uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
            Waiting for Waiter
          </span>
        );
      case 'confirmed':
      case 'preparing':
      case 'confirmed_by_waiter':
      case 'in_kitchen':
      case 'ready':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            Confirmed & Preparing
          </span>
        );
      case 'completed':
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider flex items-center gap-1">
            ✓ Finished
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wider">
            {status.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="bg-background px-5 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={() => router.push(`/${slug}/menu`)}
          className="w-10 h-10 rounded-xl bg-background-card flex items-center justify-center text-text-heading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="text-lg font-bold text-text-heading">My Orders</h1>
      </div>

      <main className="px-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonOrderCard key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="text-7xl mb-4 opacity-30">🧾</div>
            <h3 className="text-lg font-semibold text-text-heading mb-2">No orders found for this session</h3>
            <p className="text-text-muted text-sm">Place an order from the menu to see it here</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-background-card rounded-2xl shadow-card p-4 border border-border-light"
              >
                <div className="flex items-center justify-between mb-3 border-b border-border-light pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-text-heading mb-0.5" style={{ direction: 'ltr' }}>
                      Order #{order.order_number || order.id.split('-')[0].toUpperCase()}
                    </h3>
                    <span className="text-xs font-medium text-text-muted">{formatDate(order.created_at)}</span>
                  </div>
                  {renderStatusChip(order.status)}
                </div>

                <div className="divide-y divide-border-light">
                  {(order.order_items || []).map((oi) => (
                    <div key={oi.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-heading truncate">
                          {oi.menu_items?.name_en || 'Unknown item'}
                        </p>
                        <p className="text-xs text-text-muted">x{oi.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-text-heading ms-3" style={{ direction: 'ltr' }}>
                        {(oi.price_at_time * oi.quantity).toFixed(3)} KD
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-primary/20 mt-3 pt-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-text-heading">Total</span>
                  <span className="text-base font-bold text-primary" style={{ direction: 'ltr' }}>
                    {Number(order.total_amount).toFixed(3)} KD
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <FloatingNavBar restaurantSlug={slug} cartCount={cartCount} />
    </div>
  );
}
