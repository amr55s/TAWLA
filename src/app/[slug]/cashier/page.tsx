'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getRestaurantBySlugClient,
  getActiveOrdersClient,
  getOrderItemsClient,
  getTableByIdClient,
  getTablesByRestaurantClient,
} from '@/lib/data/orders.client';
import type { Restaurant, Table } from '@/types/database';

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
  items: OrderItem[];
  total: number;
  createdAt: Date;
}

async function hydrateOrder(dbOrder: { id: string; table_id: string; total_amount: number; created_at: string }): Promise<TableOrder> {
  const [rawItems, table] = await Promise.all([
    getOrderItemsClient(dbOrder.id),
    getTableByIdClient(dbOrder.table_id),
  ]);

  const items: OrderItem[] = rawItems.map((oi: Record<string, unknown>) => ({
    id: oi.id as string,
    name: (oi.menu_item as { name_en: string } | null)?.name_en ?? 'Unknown item',
    quantity: oi.quantity as number,
    price: oi.price_at_time as number,
    specialRequests: (oi.special_requests as string | null) || undefined,
  }));

  return {
    id: dbOrder.id,
    tableNumber: table?.table_number ?? 0,
    items,
    total: dbOrder.total_amount,
    createdAt: new Date(dbOrder.created_at),
  };
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
  const [orderMap, setOrderMap] = useState<Map<string, TableOrder>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

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

        const [tablesData, dbOrders] = await Promise.all([
          getTablesByRestaurantClient(restaurantData.id),
          getActiveOrdersClient(restaurantData.id),
        ]);
        if (cancelled) return;
        setTables(tablesData);

        const hydrated = await Promise.all(dbOrders.map(hydrateOrder));
        if (cancelled) return;

        const map = new Map<string, TableOrder>();
        for (const order of hydrated) {
          const matchingTable = tablesData.find(t => t.table_number === order.tableNumber);
          if (matchingTable) {
            map.set(matchingTable.id, order);
          }
        }
        setOrderMap(map);
      } catch (error) {
        console.error('Error loading cashier data:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [slug, router]);

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setSelectedTable(null);
  };

  const selectedOrder = selectedTable ? orderMap.get(selectedTable.id) ?? null : null;

  const handlePrint = () => {
    window.print();
  };

  const activeOrderCount = orderMap.size;
  const now = new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
                {restaurant?.name} — Hall Overview
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {tables.map((table, i) => {
              const hasOrder = orderMap.has(table.id);
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
                      Active
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
                      {selectedOrder ? 'Active order' : 'No active order'}
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
                  {selectedOrder ? (
                    <>
                      <p className="text-xs text-text-muted mb-4">
                        Placed {selectedOrder.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item) => (
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

                      {/* Total */}
                      <div className="mt-6 pt-4 border-t-2 border-primary flex items-center justify-between">
                        <span className="font-bold text-text-heading">Total</span>
                        <span className="text-xl font-bold text-primary">{selectedOrder.total.toFixed(3)} KD</span>
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
                {selectedOrder && (
                  <div className="px-6 py-4 border-t border-border-light">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePrint}
                      className="w-full py-3.5 bg-primary rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors active:bg-primary/90"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      Print Invoice
                    </motion.button>
                  </div>
                )}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Print-only invoice (hidden on screen, visible when printing) */}
      {selectedOrder && selectedTable && (
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
                  {selectedOrder.items.map((item) => (
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
                <span>{selectedOrder.total.toFixed(3)} KD</span>
              </div>
            </div>

            <p className="text-center text-[10px] text-gray-400 mt-6">Thank you for dining with us!</p>
          </div>
        </div>
      )}
    </>
  );
}
