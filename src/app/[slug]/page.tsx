'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cart';
import { NumericKeypad } from '@/components/ui';

export default function OnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);
  const [tableNumber, setTableNumber] = useState('');
  const { setTableNumber: saveTableNumber, setRestaurantSlug } = useCartStore();

  const handleKeyPress = useCallback((digit: string) => {
    if (tableNumber.length < 3) {
      setTableNumber((prev) => prev + digit);
    }
  }, [tableNumber]);

  const handleBackspace = useCallback(() => {
    setTableNumber((prev) => prev.slice(0, -1));
  }, []);

  const handleProceed = useCallback(() => {
    if (tableNumber.length > 0) {
      saveTableNumber(tableNumber);
      setRestaurantSlug(slug);
      router.push(`/${slug}/menu?table=${tableNumber}`);
    }
  }, [tableNumber, saveTableNumber, setRestaurantSlug, slug, router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-6xl mb-6"
      >
        🪑
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-2xl font-bold text-text-heading mb-2"
      >
        Table Number
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="text-text-muted text-sm mb-8"
      >
        Enter your table number to continue
      </motion.p>

      {/* Table Number Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-5xl font-bold text-primary tracking-widest mb-8 min-h-[64px] flex items-center justify-center"
        style={{ direction: 'ltr', letterSpacing: '8px' }}
      >
        {tableNumber || '_'}
      </motion.div>

      {/* Numeric Keypad */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="w-full max-w-[300px]"
      >
        <NumericKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onConfirm={handleProceed}
          showConfirm={true}
        />
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
