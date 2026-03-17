'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PageHeader, SkeletonTableCard } from '@/components/ui';
import { getRestaurantBySlugClient } from '@/lib/data/orders.client';
import { createClient } from '@/lib/supabase/client';
import type { Restaurant, OrderWithItems } from '@/types/database';

const supabase = createClient();
const WAITER_ACTIVE_ORDER_STATUSES = [
  'confirmed',
  'preparing',
  'served',
  // Backward compatibility for existing rows.
  'confirmed_by_waiter',
  'in_kitchen',
  'ready',
] as const;

type TableStatus = 'empty' | 'calling' | 'pending' | 'active';

interface TableWithStatus {
  id: string;
  table_number: number;
  status: TableStatus;
  callType?: 'assistance' | 'bill';
}

export default function WaiterDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [tableMap, setTableMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [selectedTable, setSelectedTable] = useState<TableWithStatus | null>(null);
  const [tableOrder, setTableOrder] = useState<OrderWithItems | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  
  // Audio state
  const [audioEnabled, setAudioEnabled] = useState(false);

  const playNotificationSound = () => {
    if (!audioEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine'; // High pitch ding
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3); // Play for 0.3 seconds
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const enableAudio = () => {
    setAudioEnabled(true);
    // Play an immediate brief silent beep to ensure AudioContext unlocks on this user gesture.
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        ctx.resume(); // unlocking the context gracefully
      }
    } catch (e) {}
  };

  const loadData = React.useCallback(async () => {
    try {
      const restaurantData = await getRestaurantBySlugClient(slug);
      if (!restaurantData) {
        router.push('/');
        return;
      }
      setRestaurant(restaurantData);

      let orders: any[] = [];
      let calls: any[] = [];
      let map: Record<string, number> = {};

      try {
        const { data: tablesData } = await supabase
          .from('tables')
          .select('id, table_number')
          .eq('restaurant_id', restaurantData.id);
        tablesData?.forEach(t => { map[t.id] = t.table_number; });
      } catch (e) {
        console.error("Tables fetch soft fail", e);
      }
      
      setTableMap(map);

      try {
        const { data: activeOrdersList, error: ordersError } = await supabase
          .from('orders')
          .select('id, table_id, status, tables!inner(table_number)')
          .eq('restaurant_id', restaurantData.id)
          .in('status', ['pending', ...WAITER_ACTIVE_ORDER_STATUSES]);
          
        if (!ordersError && activeOrdersList) orders = activeOrdersList;
      } catch (e) {
        console.error("Orders fetch soft fail", e);
      }

      try {
        const { data: activeCallsList, error: callsError } = await supabase
          .from('waiter_calls')
          .select('id, table_id, type, status, tables!inner(table_number)')
          .eq('restaurant_id', restaurantData.id)
          .eq('status', 'active');
          
        if (!callsError && activeCallsList) calls = activeCallsList;
      } catch (e) {
        console.error("Calls fetch soft fail", e);
      }

      setActiveOrders(orders);
      setActiveCalls(calls);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, router]);

  const tables = React.useMemo(() => {
    const tableCount = restaurant?.table_count || 0;
    const dynamicTables: TableWithStatus[] = [];
    if (!tableCount) return dynamicTables;

    for (let i = 1; i <= tableCount; i++) {
      const tableStr = String(i);
      let status: TableStatus = 'empty';

      const getTableNum = (item: any) => item.tables?.table_number || tableMap[item.table_id];

      const currentCalls = activeCalls.filter((c: any) => Number(getTableNum(c)) === i && c.status === 'active');
      const currentOrders = activeOrders.filter(
        (o: any) =>
          Number(getTableNum(o)) === i &&
          ['pending', ...WAITER_ACTIVE_ORDER_STATUSES].includes(o.status)
      );
      
      let callType: 'assistance' | 'bill' | undefined;
      if (currentCalls.length > 0) {
        status = 'calling';
        callType = currentCalls[0].type as 'assistance' | 'bill';
      } else if (currentOrders.some((o: any) => o.status === 'pending')) {
        status = 'pending';
      } else if (currentOrders.length > 0) {
        status = 'active';
      }

      dynamicTables.push({
        id: tableStr,
        table_number: i,
        status,
        callType,
      });
    }
    return dynamicTables;
  }, [restaurant?.table_count, activeOrders, activeCalls, tableMap]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!restaurant?.id) return;

    const ordersSubscription = supabase
      .channel(`waiter-orders-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') playNotificationSound();
          setActiveOrders((prev) => {
            if (payload.eventType === 'INSERT') return [payload.new, ...prev];
            if (payload.eventType === 'UPDATE') {
              const exists = prev.some((o) => o.id === payload.new.id);
              if (exists) {
                return prev.map((o) =>
                  o.id === payload.new.id ? { ...o, ...payload.new } : o
                );
              }
              return [payload.new, ...prev];
            }
            if (payload.eventType === 'DELETE')
              return prev.filter((o) => o.id !== payload.old.id);
            return prev;
          });
        }
      )
      .subscribe();

    const callsSubscription = supabase
      .channel(`waiter-calls-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiter_calls',
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          // Client-side filter: only process calls that belong to our restaurant's tables
          if (row?.table_id && !tableMap[row.table_id]) return;

          if (payload.eventType === 'INSERT') playNotificationSound();
          setActiveCalls((prev) => {
            if (payload.eventType === 'INSERT') return [payload.new, ...prev];
            if (payload.eventType === 'UPDATE') {
              const exists = prev.some((c) => c.id === payload.new.id);
              if (exists) {
                return prev.map((c) =>
                  c.id === payload.new.id ? { ...c, ...payload.new } : c
                );
              }
              return [payload.new, ...prev];
            }
            if (payload.eventType === 'DELETE')
              return prev.filter((c) => c.id !== payload.old.id);
            return prev;
          });
        }
      )
      .subscribe();

    const restaurantSubscription = supabase
      .channel(`waiter-restaurant-${restaurant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${restaurant.id}`,
        },
        (payload) => {
          setRestaurant((prev) => ({ ...(prev as any), ...(payload.new as any) }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(callsSubscription);
      supabase.removeChannel(restaurantSubscription);
    };
  }, [restaurant?.id, audioEnabled, tableMap]);

  const getOrderTableNum = (o: any): string =>
    String(o.tables?.table_number ?? tableMap[o.table_id] ?? '');

  const handleTableClick = async (table: TableWithStatus) => {
    const clickedTableNum = String(table.table_number);

    console.log("Clicked Table:", clickedTableNum, "All Orders in State:", activeOrders);

    if (table.status === 'calling') {
      // Open the modal for calling tables so waiter can see details and resolve
      setSelectedTable(table);
      setTableOrder(null);
      setIsLoadingOrder(true);

      // Also try to fetch any active orders for this table
      try {
        const tableUuid = Object.keys(tableMap).find(
          (key) => String(tableMap[key]) === clickedTableNum
        );
        if (tableUuid) {
          const { data: orderData } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items(
                *,
                menu_item:menu_items(*)
              )
            `)
            .eq('table_id', tableUuid)
            .in('status', ['pending', ...WAITER_ACTIVE_ORDER_STATUSES] as string[])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          setTableOrder(orderData as unknown as OrderWithItems);
        }
      } catch (e) {
        console.error("Failed to fetch order for calling table:", e);
      } finally {
        setIsLoadingOrder(false);
      }
    } else if (table.status === 'pending' || table.status === 'active') {
      const statusFilter =
        table.status === 'pending'
          ? ['pending']
          : [...WAITER_ACTIVE_ORDER_STATUSES] as string[];

      const matchingOrders = activeOrders.filter(
        (o: any) =>
          String(getOrderTableNum(o)) === clickedTableNum &&
          statusFilter.includes(o.status)
      );

      if (matchingOrders.length === 0) {
        console.warn(
          "No pending orders found for table. Available table numbers in state:",
          activeOrders.map((o: any) => getOrderTableNum(o))
        );
      }

      setSelectedTable(table);
      setIsLoadingOrder(true);

      try {
        const targetId = matchingOrders.length > 0 ? matchingOrders[0].id : null;

        if (targetId) {
          const { data: orderData, error } = await supabase
            .from('orders')
            .select(`
              *,
              items:order_items(
                *,
                menu_item:menu_items(*)
              )
            `)
            .eq('id', targetId)
            .maybeSingle();

          if (error) throw error;
          setTableOrder(orderData as unknown as OrderWithItems);
        } else {
          const tableUuid = Object.keys(tableMap).find(
            (key) => String(tableMap[key]) === clickedTableNum
          );
          if (tableUuid) {
            const { data: orderData, error } = await supabase
              .from('orders')
              .select(`
                *,
                items:order_items(
                  *,
                  menu_item:menu_items(*)
                )
              `)
              .eq('table_id', tableUuid)
              .in('status', statusFilter)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (error) throw error;
            setTableOrder(orderData as unknown as OrderWithItems);
          } else {
            setTableOrder(null);
          }
        }
      } catch (e) {
        console.error("Failed to fetch table specific order:", e);
      } finally {
        setIsLoadingOrder(false);
      }
    }
  };

  const handleConfirmOrder = async () => {
    if (!tableOrder || !selectedTable) return;
    setIsConfirming(true);

    const clickedTableNum = String(selectedTable.table_number);

    const pendingForTable = activeOrders.filter(
      (o: any) =>
        String(getOrderTableNum(o)) === clickedTableNum &&
        o.status === 'pending'
    );

    console.log("Confirming Table:", clickedTableNum, "Pending orders found:", pendingForTable);

    const activeOrderIds = pendingForTable.map((o: any) => o.id);

    if (!activeOrderIds || activeOrderIds.length === 0) {
      console.error("No order IDs to confirm");
      toast.error('No pending orders to confirm for this table');
      setIsConfirming(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .in('id', activeOrderIds);

      if (error) throw error;

      toast.success('Order sent to kitchen');
      setSelectedTable(null);
      setTableOrder(null);
    } catch (e) {
      console.error("Confirm failed", JSON.stringify(e, null, 2), e);
      toast.error('Failed to confirm order');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClearTable = async () => {
    if (!selectedTable) return;

    const confirmClear = window.confirm(
      `Are you sure you want to completely clear Table ${selectedTable.table_number}? This will cancel all active orders and resolve calls.`
    );
    if (!confirmClear) return;

    const clickedTableNum = String(selectedTable.table_number);

    // Close modal first to prevent removeChild / DOM race during realtime updates.
    setSelectedTable(null);
    setTableOrder(null);
    setIsClearing(true);

    try {
      const tableUuid = Object.keys(tableMap).find(
        (key) => String(tableMap[key]) === clickedTableNum
      );

      if (tableUuid) {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('table_id', tableUuid)
          .in('status', ['pending', ...WAITER_ACTIVE_ORDER_STATUSES] as string[]);

        await supabase
          .from('waiter_calls')
          .update({ status: 'resolved' })
          .eq('table_id', tableUuid)
          .eq('status', 'active');
      }

      toast.success('Table cleared');
    } catch (e) {
      console.error("Clear table failed", e);
      toast.error('Failed to clear table');
    } finally {
      setIsClearing(false);
    }
  };

  const handleResolveCall = async () => {
    if (!selectedTable) return;
    setIsResolving(true);
    const clickedTableNum = String(selectedTable.table_number);
    try {
      const tableUuid = Object.keys(tableMap).find(
        (key) => String(tableMap[key]) === clickedTableNum
      );
      if (tableUuid) {
        await supabase
          .from('waiter_calls')
          .update({ status: 'resolved' })
          .eq('table_id', tableUuid)
          .eq('status', 'active');
      }
      toast.success(`Resolved call for Table ${selectedTable.table_number}`);
      setSelectedTable(null);
      setTableOrder(null);
    } catch (e) {
      console.error('Failed to resolve call:', e);
      toast.error('Failed to resolve call');
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'calling':
        return 'bg-red-50 border-red-400 text-red-700 shadow-[0_0_15px_rgba(248,113,113,0.45)]';
      case 'pending':
        return 'bg-primary/10 border-primary text-primary';
      case 'active':
        return 'bg-green-100 border-green-400 text-green-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };

  const getStatusLabel = (status: TableStatus, callType?: 'assistance' | 'bill') => {
    switch (status) {
      case 'calling':
        return callType === 'bill' ? '💰 Bill' : '🙋 Assist';
      case 'pending':
        return 'Order Pending';
      case 'active':
        return 'Active';
      default:
        return 'Empty';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Skeleton Header */}
        <div className="bg-white border-b border-border-light px-6 py-4 flex items-center justify-between">
          <div className="animate-pulse space-y-2">
            <div className="h-5 w-32 rounded-lg bg-gray-200/70" />
            <div className="h-3 w-24 rounded bg-gray-200/50 mx-auto" />
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-200/60 animate-pulse" />
        </div>

        {/* Skeleton Status Legend */}
        <div className="px-6 py-4 flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="h-3 w-10 rounded bg-gray-200/60" />
            </div>
          ))}
        </div>

        {/* Skeleton Table Grid */}
        <main className="px-6">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonTableCard key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <PageHeader
        center={
          <div>
            <h1 className="text-lg font-bold text-text-heading">
              {restaurant?.name}
            </h1>
            <p className="text-xs text-text-muted text-center flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Dashboard
            </p>
          </div>
        }
        right={
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{tables.filter(t => t.status !== 'empty').length}</span>
          </div>
        }
      />

      {/* Audio Setup Banner */}
      <AnimatePresence>
        {!audioEnabled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between"
          >
            <span className="text-xs text-blue-800 font-medium tracking-tight">
              Enable audio alerts for new orders and calls?
            </span>
            <button
              onClick={enableAudio}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
            >
              Turn On Sound
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Legend */}
      <div className="px-6 py-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-xs text-text-muted">Empty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-text-muted">Calling</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-text-muted">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-xs text-text-muted">Active</span>
        </div>
      </div>

      {/* Tables Grid */}
      <main className="px-6">
        <div className="grid grid-cols-3 gap-4">
          {tables.map((table, index) => (
            <motion.button
              key={table.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer ${getStatusColor(table.status)}`}
              onClick={() => handleTableClick(table)}
            >
              {table.status === 'calling' && (
                <span className="absolute top-2 end-2 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}
              {table.status === 'pending' && (
                <span className="absolute top-2 end-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
              <span className="text-2xl font-bold">{table.table_number}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide mt-1 text-center leading-tight">
                {getStatusLabel(table.status, table.callType)}
              </span>
              
              {table.status === 'calling' && (
                <div className="absolute inset-0 bg-red-500/10 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                  <span className="bg-white px-2 py-1 rounded text-[10px] font-bold text-red-700 shadow-sm">
                    Resolve ✓
                  </span>
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </main>

      {/* Slide-over Modal for Order Details */}
      <AnimatePresence>
        {selectedTable && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTable(null)}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTable && (
          <motion.div
            key="modal-drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background z-50 rounded-t-[2rem] max-h-[85vh] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
          >
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border-light">
                <div>
                  <h3 className="text-2xl font-black text-text-heading">Table {selectedTable.table_number}</h3>
                  <p className="text-sm text-text-muted mt-1 uppercase tracking-wider font-semibold">
                    {selectedTable.status === 'calling' ? 'Waiter Call' : selectedTable.status === 'pending' ? 'Review Order' : 'Active Order'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Call Alert Banner */}
                {selectedTable.status === 'calling' && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {selectedTable.callType === 'bill' ? '💰' : '🙋'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Guest Requested</p>
                      <p className="text-base font-bold text-red-700 mt-0.5">
                        {selectedTable.callType === 'bill' ? 'Bill / Check' : 'Assistance'}
                      </p>
                    </div>
                  </motion.div>
                )}

                {isLoadingOrder ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : !tableOrder ? (
                  selectedTable.status !== 'calling' && (
                    <div className="text-center py-10 text-text-muted">
                      No active ticket found for this table.
                    </div>
                  )
                ) : (
                  <>
                    <div className="space-y-4">
                      {tableOrder.items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 bg-white border border-border-light rounded-2xl shadow-sm">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary text-xl flex-shrink-0">
                            x{item.quantity}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-bold text-text-heading leading-tight">{item.menu_item?.name_en || 'Unknown Item'}</p>
                            {item.special_requests && (
                              <p className="text-xs text-red-500 font-medium mt-1">Note: {item.special_requests}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {tableOrder.special_requests && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                        <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Table Note</p>
                        <p className="text-sm text-yellow-900">{tableOrder.special_requests}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-4 px-2 border-t-2 border-dashed border-border-light">
                      <span className="font-bold text-text-muted">Total Value</span>
                      <span className="text-2xl font-black text-primary" style={{ direction: 'ltr' }}>
                        {tableOrder.total_amount.toFixed(3)} KD
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Resolve Call footer */}
              {selectedTable.status === 'calling' && (
                <div className="p-6 bg-white border-t border-border-light flex flex-col gap-3 pb-safe">
                  <button
                    onClick={handleResolveCall}
                    disabled={isResolving}
                    className="w-full h-14 bg-green-500 rounded-2xl text-white font-bold text-lg flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95 active:bg-green-600"
                  >
                    {isResolving ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <span>Resolve Call</span>
                        <span>✓</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              {/* Pending order footer */}
              {tableOrder && selectedTable.status === 'pending' && (
                <div className="p-6 bg-white border-t border-border-light flex flex-col gap-3 pb-safe">
                  <button
                    onClick={handleConfirmOrder}
                    disabled={isConfirming || isClearing}
                    className="w-full h-14 bg-primary rounded-2xl text-white font-bold text-lg shadow-primary flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95"
                  >
                    {isConfirming ? (
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <span>Confirm & Send to Kitchen</span>
                        <span>✓</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClearTable}
                    disabled={isClearing || isConfirming}
                    className="w-full h-12 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95"
                  >
                    {isClearing ? (
                      <span className="animate-pulse">Clearing...</span>
                    ) : (
                      <span>Clear Table (Cancel All)</span>
                    )}
                  </button>
                </div>
              )}
              {/* Active order footer */}
              {tableOrder && selectedTable.status === 'active' && (
                <div className="p-6 bg-white border-t border-border-light pb-safe">
                  <button
                    onClick={handleClearTable}
                    disabled={isClearing}
                    className="w-full h-12 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold flex justify-center items-center gap-2 disabled:opacity-70 transition-transform active:scale-95"
                  >
                    {isClearing ? (
                      <span className="animate-pulse">Clearing...</span>
                    ) : (
                      <span>Clear Table (Cancel Session)</span>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
