'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { MenuItemImage } from './MenuItemImage';
import type { CartItem } from '@/store/cart';

interface CartItemCardProps {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  locale?: 'en' | 'ar';
  className?: string;
}

export function CartItemCard({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  locale = 'en',
  className,
}: CartItemCardProps) {
  const name = locale === 'ar' ? item.menuItem.name_ar : item.menuItem.name_en;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={clsx(
        'flex items-center gap-4 py-4 border-b border-border-light',
        className
      )}
    >
      {/* Image */}
      <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-background-card">
        <MenuItemImage
          src={item.menuItem.image_url}
          alt={name}
          sizes="64px"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-text-heading truncate mb-1">
          {name}
        </h4>
        <p className="text-sm font-bold text-primary" style={{ direction: 'ltr', textAlign: 'start' }}>
          {(item.menuItem.price * item.quantity).toFixed(3)} KD
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center bg-background-card rounded-xl overflow-hidden">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDecrement}
          className="w-9 h-9 flex items-center justify-center text-primary font-bold text-lg transition-colors active:bg-border-light"
          aria-label="Decrease quantity"
        >
          −
        </motion.button>

        <span className="w-8 text-center text-sm font-bold text-text-heading">
          {item.quantity}
        </span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onIncrement}
          className="w-9 h-9 flex items-center justify-center text-primary font-bold text-lg transition-colors active:bg-border-light"
          aria-label="Increase quantity"
        >
          +
        </motion.button>
      </div>
    </motion.div>
  );
}
