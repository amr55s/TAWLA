'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Bell } from 'lucide-react';
import { CallWaiterSheet } from './CallWaiterSheet';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  label: string;
}

interface FloatingNavBarProps {
  restaurantSlug: string;
  cartCount?: number;
}

export function FloatingNavBar({ restaurantSlug, cartCount = 0 }: FloatingNavBarProps) {
  const pathname = usePathname();
  const [isWaiterOpen, setIsWaiterOpen] = useState(false);

  // Search is removed. Menu and Orders/Cart strictly on the left.
  const navItems: NavItem[] = [
    {
      href: `/${restaurantSlug}/menu`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
      ),
      activeIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h6" stroke="white" />
          <path d="M8 11h8" stroke="white" />
        </svg>
      ),
      label: 'Menu',
    },
    {
      href: `/${restaurantSlug}/cart`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
      activeIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
      label: 'Orders',
    },
  ];

  const isActive = (href: string) => {
    if (href.includes('/menu') && pathname.includes('/menu')) return true;
    if (href.includes('/cart') && (pathname.includes('/cart') || pathname.includes('/checkout') || pathname.includes('/qr'))) return true;
    return pathname === href;
  };

  return (
    <>
      <nav className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none safe-bottom px-6">
        <div
          className="relative pointer-events-auto rounded-[40px] px-3 py-2.5 max-w-[320px] mx-auto border border-white/40"
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            {/* Left side: Navigation Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const isCart = item.label === 'Orders';

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "relative flex flex-col items-center justify-center gap-0.5 w-[68px] h-[52px] rounded-[28px] transition-all duration-300",
                      active ? "bg-white/50 shadow-sm" : "hover:bg-white/30"
                    )}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={clsx(
                        'transition-all duration-200 mt-0.5',
                        active
                          ? 'text-primary'
                          : 'text-text-muted hover:text-text-secondary'
                      )}
                    >
                      {active ? item.activeIcon : item.icon}
                    </motion.div>

                    {/* Cart Badge */}
                    {isCart && cartCount > 0 && (
                      <span className="absolute top-1 end-3 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}

                    <span className={clsx(
                      'text-[9px] font-semibold transition-colors uppercase tracking-wider',
                      active ? 'text-primary' : 'text-text-muted'
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Separator */}
            <div className="h-8 w-[1px] bg-black/10 mx-1" />

            {/* Right side: Call Waiter Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsWaiterOpen(true)}
              className="relative flex flex-col items-center justify-center w-[68px] h-[52px] rounded-[28px] bg-primary text-white shadow-md transition-all duration-300 hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
            >
              <Bell size={22} className="mt-0.5" strokeWidth={2} />
              <span className="text-[9px] font-bold mt-0.5 uppercase tracking-wider">Waiter</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mount Call Waiter Sheet here for easy access across the app */}
      <CallWaiterSheet
        isOpen={isWaiterOpen}
        onClose={() => setIsWaiterOpen(false)}
        restaurantSlug={restaurantSlug}
      />
    </>
  );
}
