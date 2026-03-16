'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItemImage } from './MenuItemImage';
import type { MenuItem } from '@/types/database';

interface ItemDetailSheetProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  locale?: 'en' | 'ar';
}

export function ItemDetailSheet({
  item,
  isOpen,
  onClose,
  onAddToCart,
  locale = 'en',
}: ItemDetailSheetProps) {
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const name = locale === 'ar' ? item.name_ar : item.name_en;
  const description = locale === 'ar' ? item.description_ar : item.description_en;
  const totalPrice = (item.price * quantity).toFixed(3);

  const handleAddToCart = () => {
    onAddToCart(item, quantity);
    setQuantity(1);
    onClose();
  };

  const handleClose = () => {
    setQuantity(1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[85vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-border-medium rounded-full" />
            </div>

            {/* Image */}
            <div className="relative h-48 mx-4 rounded-2xl overflow-hidden">
              <MenuItemImage
                src={item.image_url}
                alt={name}
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Title */}
              <h2 className="text-xl font-bold text-text-heading mb-1">
                {name}
              </h2>

              {/* Description */}
              {description && (
                <p className="text-sm text-text-muted leading-relaxed mb-4">
                  {description}
                </p>
              )}

              {/* Price */}
              <p className="text-lg font-bold text-primary mb-6" style={{ direction: 'ltr', textAlign: 'start' }}>
                {item.price.toFixed(3)} KD
              </p>

              {/* Quantity Selector */}
              <div className="flex items-center justify-center gap-6 mb-6">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-xl bg-background-card flex items-center justify-center text-xl font-bold text-primary shadow-card"
                >
                  −
                </motion.button>
                <span className="text-2xl font-bold text-text-heading min-w-[40px] text-center">
                  {quantity}
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-xl bg-background-card flex items-center justify-center text-xl font-bold text-primary shadow-card"
                >
                  +
                </motion.button>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full py-4 bg-primary rounded-2xl text-white text-base font-bold flex items-center justify-center gap-2 transition-colors active:bg-primary/90"
              >
                <span>Add to Cart</span>
                <span>•</span>
                <span style={{ direction: 'ltr' }}>{totalPrice} KD</span>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
