'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart';
import { MenuItemImage } from '@/components/ui/MenuItemImage';
import {
  getRestaurantBySlugClient,
  getTableByNumberClient,
  createOrderWithItemsClient,
} from '@/lib/data/orders.client';

const SERVICE_FEE_PERCENTAGE = 10;

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = React.use(params);

  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [navigatingToOrders, setNavigatingToOrders] = useState(false);

  const {
    items,
    getSubtotal,
    getServiceFee,
    getTotal,
    tableNumber,
    clearCart,
    guestId,
  } = useCartStore();

  const subtotal = getSubtotal();
  const serviceFee = getServiceFee(SERVICE_FEE_PERCENTAGE);
  const total = getTotal(SERVICE_FEE_PERCENTAGE);

  const handlePlaceOrder = async () => {
    if (!tableNumber) {
      toast.error('No table selected. Please go back and select a table.');
      return;
    }

    setIsSubmitting(true);

    try {
      const restaurant = await getRestaurantBySlugClient(slug);
      if (!restaurant) {
        toast.error('Restaurant not found');
        setIsSubmitting(false);
        return;
      }

      const table = await getTableByNumberClient(
        restaurant.id,
        parseInt(tableNumber, 10)
      );
      if (!table) {
        toast.error(`Table #${tableNumber} not found in the system`);
        setIsSubmitting(false);
        return;
      }

      let finalGuestId = useCartStore.getState().guestId;
      if (!finalGuestId) {
        finalGuestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        useCartStore.getState().setGuestId(finalGuestId);
      }

      const order = await createOrderWithItemsClient({
        restaurant_id: restaurant.id,
        table_id: table.id,
        status: 'pending',
        total_amount: total,
        special_requests: specialRequests.trim() || undefined,
        guest_id: finalGuestId,
        items: items.map((ci) => ({
          menu_item_id: ci.menuItem.id,
          quantity: ci.quantity,
          price_at_time: ci.menuItem.price,
        })),
      });

      if (!order) {
        toast.error('Failed to submit order. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Navigate first; clearCart after. Use a flag so the empty-cart guard doesn't redirect to /cart on re-render.
      setNavigatingToOrders(true);
      router.push(`/${slug}/orders`);
      clearCart();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (items.length === 0 && !navigatingToOrders) {
      router.push(`/${slug}/cart`);
    }
  }, [items.length, navigatingToOrders, router, slug]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-background px-5 pt-6 pb-4 flex items-center gap-4">
        <button
          onClick={() => router.push(`/${slug}/cart`)}
          className="w-10 h-10 rounded-xl bg-background-card flex items-center justify-center text-text-heading"
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
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-heading">Checkout</h1>
      </div>

      <main className="px-5">
        {/* Table Info */}
        {tableNumber && (
          <div className="bg-primary/10 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">{tableNumber}</span>
            </div>
            <div>
              <p className="text-xs text-text-muted">Table</p>
              <p className="text-base font-bold text-text-heading">Table #{tableNumber}</p>
            </div>
          </div>
        )}

        {/* Order Items */}
        <section className="bg-background-card rounded-2xl p-4 mb-6 shadow-card">
          <h2 className="text-base font-bold text-text-heading mb-4">Order Items</h2>
          
          <div className="divide-y divide-border-light">
            {items.map((item) => (
              <div
                key={item.menuItem.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <MenuItemImage
                      src={item.menuItem.image_url}
                      alt={item.menuItem.name_en}
                      sizes="48px"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-text-heading">{item.menuItem.name_en}</p>
                    <p className="text-xs text-text-muted">×{item.quantity}</p>
                  </div>
                </div>
                <p className="font-bold text-sm text-text-heading" style={{ direction: 'ltr' }}>
                  {(item.menuItem.price * item.quantity).toFixed(3)} KD
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t-2 border-primary mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-heading">Total</span>
              <strong className="text-lg text-primary" style={{ direction: 'ltr' }}>{total.toFixed(3)} KD</strong>
            </div>
          </div>
        </section>

        {/* Special Requests */}
        <section className="mb-6">
          <h2 className="text-base font-bold text-text-heading mb-3">Special Requests</h2>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Allergies, dietary requirements, or special notes..."
            className="w-full min-h-[100px] p-4 bg-background-card border border-border-light rounded-2xl text-sm text-text-body placeholder:text-text-muted resize-none focus:outline-none focus:border-primary transition-colors"
          />
        </section>

        {/* Payment Note */}
        <p className="text-center text-xs text-text-muted">
          Payment will be collected at the cashier
        </p>
      </main>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border-light px-5 pt-4 pb-6 safe-bottom">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handlePlaceOrder}
          disabled={isSubmitting}
          className="w-full py-4 bg-primary rounded-2xl text-white text-base font-bold transition-colors active:bg-primary/90 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              Confirm Order
              <span>✓</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
