'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getRestaurantBySlugClient } from '@/lib/data/orders.client';
import type { Restaurant, OrderStatus } from '@/types/database';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  specialRequests?: string;
}

interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

const COLUMNS: { status: OrderStatus; title: string; color: string }[] = [
  { status: 'confirmed_by_waiter', title: 'New Orders', color: 'bg-yellow-500' },
  { status: 'in_kitchen', title: 'Preparing', color: 'bg-blue-500' },
  { status: 'ready', title: 'Ready', color: 'bg-green-500' },
];

// Mock orders for demo
const mockOrders: Order[] = [
  {
    id: '1',
    tableNumber: 3,
    items: [
      { id: '1', name: 'Tuna Crispy Rice', quantity: 2 },
      { id: '2', name: 'Spicy Edamame', quantity: 1 },
    ],
    total: 8.000,
    status: 'confirmed_by_waiter',
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: '2',
    tableNumber: 7,
    items: [
      { id: '3', name: 'Shrimp Avocado Maki', quantity: 2 },
      { id: '4', name: 'Crispy Chicken Salad', quantity: 1 },
    ],
    total: 10.250,
    status: 'confirmed_by_waiter',
    createdAt: new Date(Date.now() - 8 * 60000),
  },
  {
    id: '3',
    tableNumber: 1,
    items: [
      { id: '5', name: 'Torched Wagyu Beef Maki', quantity: 2 },
      { id: '6', name: 'Wagyu Beef Onigiri', quantity: 1 },
    ],
    total: 14.000,
    status: 'in_kitchen',
    createdAt: new Date(Date.now() - 15 * 60000),
  },
  {
    id: '4',
    tableNumber: 5,
    items: [
      { id: '7', name: 'Creamy Honey Shrimp', quantity: 2, specialRequests: 'Extra sauce' },
    ],
    total: 7.500,
    status: 'in_kitchen',
    createdAt: new Date(Date.now() - 20 * 60000),
  },
  {
    id: '5',
    tableNumber: 2,
    items: [
      { id: '8', name: 'Chicken Karaage', quantity: 1 },
    ],
    total: 3.500,
    status: 'ready',
    createdAt: new Date(Date.now() - 25 * 60000),
  },
];

export default function CashierKanbanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const restaurantData = await getRestaurantBySlugClient(slug);
        if (!restaurantData) {
          router.push('/');
          return;
        }
        setRestaurant(restaurantData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [slug, router]);

  // Simulate new order notification
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new order arrival occasionally
      if (Math.random() > 0.95) {
        const newOrder: Order = {
          id: `new-${Date.now()}`,
          tableNumber: Math.floor(Math.random() * 20) + 1,
          items: [
            { id: '1', name: 'Sample Dish', quantity: Math.floor(Math.random() * 3) + 1 },
          ],
          total: Math.floor(Math.random() * 100) + 30,
          status: 'confirmed_by_waiter',
          createdAt: new Date(),
        };
        setOrders(prev => [newOrder, ...prev]);
        playNotificationSound();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const playNotificationSound = () => {
    // Create audio context for notification
    try {
      const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio notification not supported');
    }
  };

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (newStatus: OrderStatus) => {
    if (draggedOrder && draggedOrder.status !== newStatus) {
      setOrders(prev =>
        prev.map(order =>
          order.id === draggedOrder.id
            ? { ...order, status: newStatus }
            : order
        )
      );
    }
    setDraggedOrder(null);
  };

  const handleMoveOrder = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter(order => order.status === status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-w-[1024px] bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border-light px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-heading">
              {restaurant?.name} - Kitchen Display
            </h1>
            <p className="text-sm text-text-muted">
              {orders.filter(o => o.status === 'confirmed_by_waiter').length} new orders •
              {orders.filter(o => o.status === 'in_kitchen').length} preparing •
              {orders.filter(o => o.status === 'ready').length} ready
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Updates
            </div>
            <button
              onClick={playNotificationSound}
              className="px-4 py-2 bg-border-light rounded-xl text-sm font-medium text-text-heading hover:bg-border-medium transition-colors"
            >
              Test Sound
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="p-8">
        <div className="grid grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {COLUMNS.map((column) => (
            <div
              key={column.status}
              className="flex flex-col bg-white rounded-2xl border border-border-light overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
            >
              {/* Column Header */}
              <div className={`px-6 py-4 ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">
                    {column.title}
                  </h2>
                  <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                    {getOrdersByStatus(column.status).length}
                  </span>
                </div>
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {getOrdersByStatus(column.status).map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      draggable
                      onDragStart={() => handleDragStart(order)}
                      className="bg-background border border-border-light rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                            {order.tableNumber}
                          </span>
                          <span className="font-bold text-text-heading">
                            Table #{order.tableNumber}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted">
                          {getTimeAgo(order.createdAt)}
                        </span>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-1 mb-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-2 text-sm">
                            <span className="font-medium text-text-heading">
                              {item.quantity}x
                            </span>
                            <div>
                              <span className="text-text-body">{item.name}</span>
                              {item.specialRequests && (
                                <p className="text-xs text-primary">{item.specialRequests}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Total & Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-border-light">
                        <span className="font-bold text-primary">
                          {order.total.toFixed(3)} KD
                        </span>

                        <div className="flex gap-2">
                          {column.status === 'confirmed_by_waiter' && (
                            <button
                              onClick={() => handleMoveOrder(order.id, 'in_kitchen')}
                              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {column.status === 'in_kitchen' && (
                            <button
                              onClick={() => handleMoveOrder(order.id, 'ready')}
                              className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                            >
                              Ready
                            </button>
                          )}
                          {column.status === 'ready' && (
                            <button
                              onClick={() => handleMoveOrder(order.id, 'completed')}
                              className="px-3 py-1.5 bg-gray-500 text-white text-xs font-medium rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {getOrdersByStatus(column.status).length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 text-text-muted">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mb-2 opacity-50"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    <span className="text-sm">No orders</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
