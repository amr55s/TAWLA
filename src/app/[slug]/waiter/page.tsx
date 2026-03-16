'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/ui';
import { getRestaurantBySlugClient, getTablesByRestaurantClient } from '@/lib/data/orders.client';
import type { Restaurant, Table } from '@/types/database';

type TableStatus = 'empty' | 'calling' | 'pending' | 'active';

interface TableWithStatus extends Table {
  status: TableStatus;
}

export default function WaiterDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [tables, setTables] = useState<TableWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const restaurantData = await getRestaurantBySlugClient(slug);
        if (!restaurantData) {
          router.push('/');
          return;
        }
        setRestaurant(restaurantData);

        const tablesData = await getTablesByRestaurantClient(restaurantData.id);
        
        // Simulate different statuses for demo
        const tablesWithStatus: TableWithStatus[] = tablesData.map((table, index) => ({
          ...table,
          status: index % 5 === 0 ? 'calling' : 
                  index % 4 === 0 ? 'pending' : 
                  index % 3 === 0 ? 'active' : 'empty' as TableStatus,
        }));

        setTables(tablesWithStatus);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [slug, router]);

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'calling':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      case 'pending':
        return 'bg-primary/10 border-primary text-primary';
      case 'active':
        return 'bg-green-100 border-green-400 text-green-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-500';
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'calling':
        return 'Calling';
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
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
            <p className="text-xs text-text-muted text-center">Waiter Dashboard</p>
          </div>
        }
        right={
          <Link
            href={`/${slug}/waiter/scan`}
            className="w-10 h-10 bg-primary rounded-full flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="10" height="10" rx="1" />
            </svg>
          </Link>
        }
      />

      {/* Status Legend */}
      <div className="px-6 py-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span className="text-xs text-text-muted">Empty</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs text-text-muted">Calling</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-xs text-text-muted">Order Pending</span>
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
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all ${getStatusColor(table.status)}`}
              onClick={() => {
                if (table.status === 'pending') {
                  router.push(`/${slug}/waiter/confirm?table=${table.table_number}`);
                }
              }}
            >
              {table.status === 'calling' && (
                <span className="absolute top-2 end-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              )}
              <span className="text-2xl font-bold">{table.table_number}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide mt-1">
                {getStatusLabel(table.status)}
              </span>
            </motion.button>
          ))}
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 safe-bottom">
        <Link
          href={`/${slug}/waiter/scan`}
          className="w-full h-14 bg-primary rounded-3xl flex items-center justify-center gap-3 shadow-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
          </svg>
          <span className="text-base font-bold text-white">Scan Guest QR Code</span>
        </Link>
      </div>
    </div>
  );
}
