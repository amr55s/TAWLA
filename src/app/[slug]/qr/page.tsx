'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart';

export default function QRPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);

  const { items, tableNumber, getTotal, clearCart } = useCartStore();
  const total = getTotal(10);

  const orderId = useMemo(() => {
    return `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
  }, []);

  const qrData = useMemo(() => {
    return JSON.stringify({
      restaurantSlug: slug,
      tableNumber: tableNumber,
      orderId: orderId,
      timestamp: Date.now(),
      items: items.map(item => ({
        id: item.menuItem.id,
        name: item.menuItem.name_en,
        quantity: item.quantity,
        price: item.menuItem.price,
        specialRequests: item.specialRequests,
      })),
      total: total,
    });
  }, [slug, tableNumber, orderId, items, total]);

  const handleDone = () => {
    clearCart();
    router.push(`/${slug}/menu`);
  };

  const handleModify = () => {
    router.push(`/${slug}/cart`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      {/* Success Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-5xl mb-4"
      >
        ✅
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-2xl font-bold text-text-heading mb-2"
      >
        Your order is ready!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="text-text-muted text-sm mb-2"
      >
        Show this code to your waiter to confirm
      </motion.p>

      {/* Order ID */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="inline-block bg-background-card px-5 py-2 rounded-full text-sm font-semibold text-primary mb-6"
        style={{ direction: 'ltr' }}
      >
        {orderId}
      </motion.div>

      {/* QR Code Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="bg-white rounded-3xl p-6 shadow-float mb-8"
        style={{ width: '220px', height: '220px' }}
      >
        <QRCodeSVG
          value={qrData}
          size={172}
          level="H"
          bgColor="transparent"
          fgColor="#2D2D2D"
          includeMargin={false}
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex gap-3 w-full max-w-xs"
      >
        <button
          onClick={handleModify}
          className="flex-1 py-3 bg-background-card rounded-2xl text-sm font-semibold text-text-body transition-colors active:bg-border-light"
        >
          🔙 Back to Menu
        </button>
        <button
          onClick={handleDone}
          className="flex-1 py-3 bg-primary rounded-2xl text-sm font-semibold text-white transition-colors active:bg-primary/90"
        >
          New Order ✨
        </button>
      </motion.div>

      {/* Brand Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="fixed bottom-8 text-center"
      >
        <p className="text-xl font-bold text-primary tracking-wider">SU SUSHI</p>
        <p className="text-[10px] text-text-muted tracking-widest uppercase mt-1">
          Digital Menu
        </p>
      </motion.div>
    </div>
  );
}
