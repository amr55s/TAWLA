'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  getRestaurantBySlugClient,
  getTablesByRestaurantClient,
} from '@/lib/data/orders.client';
import { createClient } from '@/lib/supabase/client';
import { SkeletonInsightCard, SkeletonTableCard } from '@/components/ui';
import type { Restaurant, Table } from '@/types/database';

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
  tableNumber: number;
  status: string;
  items: OrderItem[];
  total: number;
  createdAt: Date;
}

const CASHIER_ACTIVE_ORDER_STATUSES = ['confirmed', 'preparing', 'served', 'confirmed_by_waiter', 'in_kitchen', 'ready'] as const;
const CLEARABLE_ORDER_STATUSES = [
  ...CASHIER_ACTIVE_ORDER_STATUSES,
  'pending',
  'confirmed_by_waiter',
  'in_kitchen',
  'ready',
] as const;

interface DailyInsights {
  totalRevenue: number;
  totalOrders: number;
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
  const [ordersByTableId, setOrdersByTableId] = useState<Map<string, TableOrder[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isClearingTable, setIsClearingTable] = useState(false);
  const [insights, setInsights] = useState<DailyInsights>({
    totalRevenue: 0,
    totalOrders: 0,
  });

  const fetchActiveOrders = React.useCallback(
    async (restaurantId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          *,
          table:tables!inner(id, table_number),
          items:order_items(
            *,
            menu_item:menu_items(*)
          )
        `
        )
        .eq('restaurant_id', restaurantId)
        .in('status', [...CASHIER_ACTIVE_ORDER_STATUSES])
        .order('created_at', { ascending: true });

      if (error || !data) {
        console.error('Cashier orders fetch failed:', JSON.stringify(error, null, 2), error);
        return new Map<string, TableOrder[]>();
      }

      const map = new Map<string, TableOrder[]>();
      for (const row of data as any[]) {
        const tableNumber = row.table?.table_number ?? 0;
        const tableId = row.table_id as string;
        const items: OrderItem[] = (row.items || []).map((oi: any) => ({
          id: oi.id,
          name: oi.menu_item?.name_en ?? 'Unknown item',
          quantity: oi.quantity,
          price: oi.price_at_time,
          specialRequests: oi.special_requests || undefined,
        }));

        const hydrated: TableOrder = {
          id: row.id,
          tableNumber,
          status: row.status,
          items,
          total: row.total_amount,
          createdAt: new Date(row.created_at),
        };

        map.set(tableId, [...(map.get(tableId) || []), hydrated]);
      }

      return map;
    },
    []
  );

  const fetchDailyInsights = React.useCallback(async (restaurantId: string) => {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date();
    dayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('orders')
      .select('id, total_amount')
      .eq('restaurant_id', restaurantId)
      .eq('status', 'paid')
      .gte('created_at', dayStart.toISOString())
      .lte('created_at', dayEnd.toISOString());

    if (error || !data) {
      console.error('Cashier insights fetch failed:', JSON.stringify(error, null, 2), error);
      setInsights({ totalRevenue: 0, totalOrders: 0 });
      return;
    }

    const totalRevenue = data.reduce(
      (acc, order) => acc + Number(order.total_amount || 0),
      0
    );
    setInsights({
      totalRevenue,
      totalOrders: data.length,
    });
  }, []);

  // Setup Realtime for the Cashier
  useEffect(() => {
    if (!restaurant?.id) return;
    
    const channel = supabase
      .channel(`cashier-orders-${restaurant.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurant.id}` },
        async () => {
          let cancelled = false;
          async function refresh() {
            if (!restaurant?.id) return;
            if (cancelled) return;
            const map = await fetchActiveOrders(restaurant.id);
            if (cancelled) return;
            setOrdersByTableId(map);
            await fetchDailyInsights(restaurant.id);
          }
          await refresh();
          return () => { cancelled = true; };
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id, fetchActiveOrders, fetchDailyInsights]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const restaurantData = await getRestaurantBySlugClient(slug);
        if (!restaurantData) {
          router.push('/');
          return;
        }
        if (cancelled) return;
        setRestaurant(restaurantData);

        const [tablesData, map] = await Promise.all([
          getTablesByRestaurantClient(restaurantData.id),
          fetchActiveOrders(restaurantData.id),
        ]);
        if (cancelled) return;
        setTables(tablesData);
        setOrdersByTableId(map);
        await fetchDailyInsights(restaurantData.id);
      } catch (error) {
        console.error('Error loading cashier data:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [slug, router, fetchActiveOrders, fetchDailyInsights]);

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedTable(null);
  };

  const selectedOrders = selectedTable ? ordersByTableId.get(selectedTable.id) ?? [] : [];
  const activeOrderCount = Array.from(ordersByTableId.values()).reduce((acc, orders) => acc + orders.length, 0);

  const handleMarkAsPaid = async () => {
    if (!selectedTable) return;
    
    setIsMarkingPaid(true);
    try {
      // Transition all active orders for this table to `paid`
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('table_id', selectedTable.id)
        .in('status', [...CLEARABLE_ORDER_STATUSES]);
        
      // Also silently resolve any calls just in case they were left hanging
      await supabase
        .from('waiter_calls')
        .update({ status: 'resolved' })
        .eq('table_id', selectedTable.id)
        .eq('status', 'active');
        
      toast.success(`Table #${selectedTable.table_number} marked as paid`);
      closePanel();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      toast.error('Failed to mark as paid');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleMarkOrderPaid = async (orderId: string) => {
    setIsMarkingPaid(true);
    try {
      await supabase.from('orders').update({ status: 'paid' }).eq('id', orderId);
      toast.success('Order settled');
    } catch (error) {
      console.error('Failed to mark order as paid:', error);
      toast.error('Failed to settle order');
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleClearTable = async (table: Table) => {
    const confirmed = window.confirm(
      `Clear Table #${table.table_number}? This will cancel active orders and resolve waiter calls.`
    );
    if (!confirmed) return;

    // Close panel first to avoid UI race conditions during realtime updates.
    if (selectedTable?.id === table.id) closePanel();

    setIsClearingTable(true);
    try {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('table_id', table.id)
        .in('status', [...CLEARABLE_ORDER_STATUSES]);

      await supabase
        .from('waiter_calls')
        .update({ status: 'resolved' })
        .eq('table_id', table.id)
        .eq('status', 'active');

      toast.success(`Table #${table.table_number} cleared`);
    } catch (error) {
      console.error('Failed to clear table:', error);
      toast.error('Failed to clear table');
    } finally {
      setIsClearingTable(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton header */}
        <header className="bg-white border-b border-border-light px-6 lg:px-8 py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-6 w-48 rounded-lg bg-gray-200/70" />
            <div className="h-3.5 w-32 rounded bg-gray-200/50" />
          </div>
        </header>
        <main className="p-6 lg:p-8">
          {/* Skeleton insights */}
          <section className="mb-8 bg-white border border-border-light rounded-2xl p-5 shadow-card">
            <div className="h-4 w-28 rounded bg-gray-200/60 mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SkeletonInsightCard />
              <SkeletonInsightCard />
            </div>
          </section>
          {/* Skeleton table grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonTableCard key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background print:hidden">
        {/* Header */}
        <header className="bg-white border-b border-border-light px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-text-heading">
                {restaurant?.name} — Cashier POS
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {tables.length} tables &middot; {activeOrderCount} with active orders
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-border-light rounded-xl text-sm font-medium text-text-heading hover:bg-border-medium transition-colors"
            >
              Exit
            </button>
          </div>
        </header>

        {/* Table Grid */}
        <main className="p-6 lg:p-8">
          <section className="mb-8 bg-white border border-border-light rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-text-heading mb-3">
              Today&apos;s Insights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-primary/10 rounded-xl p-4">
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  Total Revenue Today
                </p>
                <p className="text-2xl font-black text-primary mt-1">
                  {insights.totalRevenue.toFixed(3)} KD
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs text-text-muted uppercase tracking-wide">
                  Total Orders Today
                </p>
                <p className="text-2xl font-black text-green-700 mt-1">
                  {insights.totalOrders}
                </p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {tables.map((table, i) => {
              const orders = ordersByTableId.get(table.id) ?? [];
              const hasOrder = orders.length > 0;
              return (
                <motion.button
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTableClick(table)}
                  className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    hasOrder
                      ? 'border-primary bg-primary/10 shadow-card'
                      : 'border-border-medium bg-white hover:border-border-heavy'
                  }`}
                >
                  <span className={`text-2xl font-bold ${hasOrder ? 'text-primary' : 'text-text-muted'}`}>
                    {table.table_number}
                  </span>
                  {hasOrder && (
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {orders.length} Order{orders.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {!hasOrder && (
                    <span className="mt-1 text-[10px] font-medium text-text-muted">
                      Empty
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Grouped list by table_number (quick cashier view) */}
          <div className="mt-8">
            <h2 className="text-sm font-bold text-text-heading mb-3">Active Tables</h2>
            {Array.from(ordersByTableId.entries())
              .map(([tableId, orders]) => ({
                table: tables.find((t) => t.id === tableId) || null,
                orders,
              }))
              .filter((x) => x.table && x.orders.length > 0)
              .sort((a, b) => (a.table!.table_number ?? 0) - (b.table!.table_number ?? 0))
              .map(({ table, orders }) => {
                const sum = orders.reduce((acc, o) => acc + o.total, 0);
                return (
                  <div
                    key={table!.id}
                    className="w-full mb-3 bg-white border border-border-light rounded-2xl p-4 hover:border-border-medium transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleTableClick(table!)}
                        className="text-left"
                      >
                        <p className="text-sm font-bold text-text-heading">
                          Table #{table!.table_number}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {orders.length} order{orders.length > 1 ? 's' : ''} • {sum.toFixed(3)} KD
                        </p>
                      </button>
                      <span className="text-xs font-bold text-primary">Open</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleTableClick(table!)}
                        className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold"
                      >
                        View / Settle
                      </button>
                      <button
                        onClick={handlePrint}
                        className="px-3 py-2 rounded-lg bg-border-light text-text-heading text-xs font-bold"
                      >
                        Print Receipt
                      </button>
                      <button
                        onClick={() => handleClearTable(table!)}
                        disabled={isClearingTable}
                        className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-bold disabled:opacity-70 flex items-center gap-1.5"
                      >
                        {isClearingTable && (
                          <div className="animate-spin w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full" />
                        )}
                        {isClearingTable ? 'Clearing...' : 'Clear Table (Cancel)'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {tables.length === 0 && (
            <div className="text-center py-20 text-text-muted">
              <p>No tables found for this restaurant.</p>
            </div>
          )}
        </main>

        {/* Side Panel Overlay */}
        <AnimatePresence>
          {panelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closePanel}
                className="fixed inset-0 bg-black/30 z-40"
              />
              <motion.aside
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-float flex flex-col"
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
                  <div>
                    <h2 className="text-lg font-bold text-text-heading">
                      Table #{selectedTable?.table_number}
                    </h2>
                    <p className="text-xs text-text-muted mt-0.5">
                      {selectedOrders.length > 0 ? `${selectedOrders.length} active order${selectedOrders.length > 1 ? 's' : ''}` : 'No active order'}
                    </p>
                  </div>
                  <button
                    onClick={closePanel}
                    className="w-9 h-9 rounded-xl bg-border-light flex items-center justify-center text-text-secondary hover:bg-border-medium transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>

                {/* Panel body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {selectedOrders.length > 0 ? (
                    <>
                      <div className="space-y-4">
                        {selectedOrders.map((order) => (
                          <div key={order.id} className="bg-white border border-border-light rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-xs text-text-muted">
                                  {order.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.status.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm font-bold text-text-heading mt-0.5">
                                  {order.total.toFixed(3)} KD
                                </p>
                              </div>
                              <button
                                onClick={() => handleMarkOrderPaid(order.id)}
                                disabled={isMarkingPaid}
                                className="px-3 py-2 rounded-xl bg-green-500 text-white text-xs font-bold disabled:opacity-70"
                              >
                                Settle / Mark Paid
                              </button>
                            </div>

                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-start justify-between">
                                  <div className="flex items-start gap-2">
                                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                      {item.quantity}x
                                    </span>
                                    <div>
                                      <p className="text-sm font-medium text-text-heading">{item.name}</p>
                                      {item.specialRequests && (
                                        <p className="text-xs text-primary mt-0.5">{item.specialRequests}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-sm font-medium text-text-heading flex-shrink-0 ms-3">
                                    {(item.price * item.quantity).toFixed(3)} KD
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40"><rect x="2" y="7" width="20" height="3" rx="1"/><path d="M5 10v8"/><path d="M19 10v8"/></svg>
                      <p className="text-sm">No active order for this table</p>
                    </div>
                  )}
                </div>

                {/* Panel footer */}
                {selectedOrders.length > 0 && (
                  <div className="px-6 py-4 border-t border-border-light flex flex-col gap-3 pb-safe">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleMarkAsPaid}
                      disabled={isMarkingPaid}
                      className="w-full py-4 bg-green-500 rounded-2xl text-white text-base font-bold flex items-center justify-center gap-2 transition-transform active:bg-green-600 disabled:opacity-70"
                    >
                      {isMarkingPaid ? (
                        <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                          Mark as Paid / Close Table
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePrint}
                      disabled={isMarkingPaid || isClearingTable}
                      className="w-full py-3.5 bg-border-light text-text-heading rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-transform active:bg-border-medium disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print Invoice
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectedTable && handleClearTable(selectedTable)}
                      disabled={isMarkingPaid || isClearingTable}
                      className="w-full py-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-transform active:bg-red-100 disabled:opacity-50"
                    >
                      {isClearingTable ? 'Clearing...' : 'Clear Table (Cancel)'}
                    </motion.button>
                  </div>
                )}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Print-only invoice (hidden on screen, visible when printing) */}
      {selectedOrders[0] && selectedTable && (
        <div id="invoice-print" className="hidden print:block">
          <div className="max-w-[300px] mx-auto py-4 font-sans text-black">
            <div className="text-center mb-4">
              <h1 className="text-lg font-bold">{restaurant?.name}</h1>
              <p className="text-xs text-gray-500 mt-1">Invoice</p>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 mb-3">
              <div className="flex justify-between text-xs">
                <span>Table</span>
                <span className="font-bold">#{selectedTable.table_number}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Date</span>
                <span>{now.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Time</span>
                <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3 mb-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-1 font-semibold">Item</th>
                    <th className="text-center pb-1 font-semibold">Qty</th>
                    <th className="text-right pb-1 font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrders[0].items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-1 pe-2">{item.name}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">{(item.price * item.quantity).toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-gray-300 pt-3">
              <div className="flex justify-between font-bold text-sm">
                <span>Total</span>
                <span>{selectedOrders[0].total.toFixed(3)} KD</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-400 mt-6">Thank you for dining with us!</p>
          </div>
        </div>
      )}
    </>
  );
}
