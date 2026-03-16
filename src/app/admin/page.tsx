'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface Stats {
  totalOrders: number;
  revenue: number;
  menuItems: number;
  tables: number;
  topItems: { name: string; count: number }[];
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      const [ordersRes, itemsRes, tablesRes, orderItemsRes] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status'),
        supabase.from('menu_items').select('id'),
        supabase.from('tables').select('id'),
        supabase.from('order_items').select('menu_item_id, quantity, menu_items(name_en)'),
      ]);

      const orders = ordersRes.data || [];
      const totalOrders = orders.length;
      const revenue = orders.reduce((s, o) => s + (o.total_amount || 0), 0);
      const menuItems = (itemsRes.data || []).length;
      const tables = (tablesRes.data || []).length;

      const itemCounts: Record<string, { name: string; count: number }> = {};
      for (const oi of orderItemsRes.data || []) {
        const name =
          (oi as unknown as { menu_items: { name_en: string } | null }).menu_items?.name_en ||
          oi.menu_item_id;
        if (!itemCounts[oi.menu_item_id]) {
          itemCounts[oi.menu_item_id] = { name, count: 0 };
        }
        itemCounts[oi.menu_item_id].count += oi.quantity;
      }
      const topItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({ totalOrders, revenue, menuItems, tables, topItems });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
      ),
    },
    {
      label: 'Revenue',
      value: `${stats.revenue.toFixed(3)} KD`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
      ),
    },
    {
      label: 'Menu Items',
      value: stats.menuItems.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
      ),
    },
    {
      label: 'Tables',
      value: stats.tables.toString(),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="3" rx="1" /><path d="M5 10v8" /><path d="M19 10v8" /></svg>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-text-heading mb-6">Overview</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-background-card rounded-2xl p-5 shadow-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-text-muted">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-text-heading">{card.value}</p>
            <p className="text-xs text-text-muted mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top selling items */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="bg-background-card rounded-2xl p-5 shadow-card"
      >
        <h3 className="text-base font-bold text-text-heading mb-4">Top Selling Items</h3>
        {stats.topItems.length === 0 ? (
          <p className="text-sm text-text-muted">No order data yet.</p>
        ) : (
          <div className="space-y-3">
            {stats.topItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-text-heading font-medium">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-primary">{item.count} sold</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
