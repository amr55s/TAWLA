'use client';

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DishCard, FloatingNavBar, ItemDetailSheet } from '@/components/ui';
import { useCartStore } from '@/store/cart';
import { getRestaurantBySlugClient, getMenuItemsByRestaurantClient } from '@/lib/data/orders.client';
import type { Restaurant, MenuItemWithCategory, MenuItem } from '@/types/database';

export default function SearchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemWithCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { addItem, getTotalItems } = useCartStore();
  const cartCount = getTotalItems();

  useEffect(() => {
    async function loadData() {
      try {
        const restaurantData = await getRestaurantBySlugClient(slug);
        if (!restaurantData) {
          router.push('/');
          return;
        }
        setRestaurant(restaurantData);

        const itemsData = await getMenuItemsByRestaurantClient(restaurantData.id);
        setMenuItems(itemsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [slug, router]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return menuItems.filter(item => 
      item.name_en.toLowerCase().includes(query) ||
      item.name_ar.includes(query) ||
      (item.description_en && item.description_en.toLowerCase().includes(query)) ||
      (item.description_ar && item.description_ar.includes(query))
    );
  }, [menuItems, searchQuery]);

  const handleAddToCart = useCallback((item: MenuItem) => {
    addItem(item);
  }, [addItem]);

  const handleCardClick = useCallback((item: MenuItem) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  }, []);

  const handleSheetAddToCart = useCallback((item: MenuItem, quantity: number) => {
    for (let i = 0; i < quantity; i++) {
      addItem(item);
    }
  }, [addItem]);

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
    setSelectedItem(null);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="bg-background px-5 pt-6 pb-2">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-text-heading">Search</h1>
          <p className="text-sm text-text-muted">Find your favorite dishes</p>
        </div>
        
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 bg-background-card rounded-2xl">
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
            className="text-text-muted flex-shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for your favorite dish..."
            className="flex-1 bg-transparent text-sm text-text-body placeholder:text-text-muted outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-text-muted hover:text-text-body"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Results */}
      <main className="px-4 pt-4">
        {!searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-lg font-semibold text-text-heading mb-2">
              Search our menu
            </h2>
            <p className="text-text-muted text-sm max-w-xs">
              Type to find sushi rolls, appetizers, salads and more
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4 opacity-30">😕</div>
            <h2 className="text-lg font-semibold text-text-heading mb-2">
              No results found
            </h2>
            <p className="text-text-muted text-sm max-w-xs">
              Try searching for something else
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-muted mb-4 px-1">
              {filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'} found
            </p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                  >
                    <DishCard
                      item={{ ...item, badge: (item as MenuItem & { badge?: string }).badge || null }}
                      onAddToCart={handleAddToCart}
                      onCardClick={handleCardClick}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Floating Nav Bar */}
      <FloatingNavBar restaurantSlug={slug} cartCount={cartCount} />

      {/* Item Detail Sheet */}
      <ItemDetailSheet
        item={selectedItem}
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        onAddToCart={handleSheetAddToCart}
      />
    </div>
  );
}
