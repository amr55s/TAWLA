'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { Category } from '@/types/database';

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  locale?: 'en' | 'ar';
  showAllOption?: boolean;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
  locale = 'en',
  showAllOption = true,
}: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeTab = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      
      const scrollLeft = tabRect.left - containerRect.left - (containerRect.width / 2) + (tabRect.width / 2) + container.scrollLeft;
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [activeCategory]);

  const allCategories = showAllOption 
    ? [{ id: 'all', name_en: 'All', name_ar: 'الكل', restaurant_id: '', sort_order: 0, created_at: '', updated_at: '' }, ...categories]
    : categories;

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto scrollbar-hide px-5 py-3"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {allCategories.map((category) => {
        const isActive = category.id === activeCategory || (category.id === 'all' && !activeCategory);
        const name = locale === 'ar' ? category.name_ar : category.name_en;

        return (
          <motion.button
            key={category.id}
            ref={isActive ? activeRef : null}
            onClick={() => onCategoryChange(category.id === 'all' ? '' : category.id)}
            whileTap={{ scale: 0.95 }}
            className={clsx(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-background-card text-text-muted hover:bg-border-light'
            )}
            style={{ scrollSnapAlign: 'start' }}
          >
            {name}
          </motion.button>
        );
      })}
    </div>
  );
}
