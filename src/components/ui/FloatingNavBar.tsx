'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

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

  const navItems: NavItem[] = [
    {
      href: `/${restaurantSlug}/menu`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h6" />
          <path d="M8 11h8" />
        </svg>
      ),
      activeIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          <path d="M8 7h6" stroke="white" />
          <path d="M8 11h8" stroke="white" />
        </svg>
      ),
      label: 'Menu',
    },
    {
      href: `/${restaurantSlug}/search`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
      activeIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      ),
      label: 'Search',
    },
    {
      href: `/${restaurantSlug}/cart`,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
      activeIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      ),
      label: 'Cart',
    },
  ];

  const isActive = (href: string) => {
    if (href.includes('/menu') && pathname.includes('/menu')) return true;
    if (href.includes('/cart') && (pathname.includes('/cart') || pathname.includes('/checkout') || pathname.includes('/qr'))) return true;
    if (href.includes('/search') && pathname.includes('/search')) return true;
    return pathname === href;
  };

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 safe-bottom">
      <div 
        className="relative rounded-3xl px-4 py-3 max-w-sm mx-auto border border-white/30"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const isCart = item.label === 'Cart';

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center gap-1 py-1 px-4"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={clsx(
                    'transition-all duration-200',
                    active 
                      ? 'text-primary transform scale-110' 
                      : 'text-text-muted hover:text-text-secondary'
                  )}
                >
                  {active ? item.activeIcon : item.icon}
                </motion.div>
                
                {/* Cart Badge */}
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1 end-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}

                <span className={clsx(
                  'text-[10px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-text-muted'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
