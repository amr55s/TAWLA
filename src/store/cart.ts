"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MenuItem } from "@/types/database";

export interface CartItem {
	menuItem: MenuItem;
	quantity: number;
	specialRequests?: string;
}

interface CartState {
	items: CartItem[];
	tableNumber: string | null;
	restaurantSlug: string | null;
	guestId: string;

	setTableNumber: (tableNumber: string) => void;
	setRestaurantSlug: (slug: string) => void;
	setGuestId: (id: string) => void;
	addItem: (menuItem: MenuItem, quantity?: number) => void;
	removeItem: (menuItemId: string) => void;
	updateQuantity: (menuItemId: string, quantity: number) => void;
	updateSpecialRequests: (menuItemId: string, requests: string) => void;
	clearCart: () => void;
	getSubtotal: () => number;
	getServiceFee: (percentage: number) => number;
	getTotal: (serviceFeePercentage: number) => number;
	getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			tableNumber: null,
			restaurantSlug: null,
			guestId:
				typeof crypto !== "undefined" && crypto.randomUUID
					? crypto.randomUUID()
					: Math.random().toString(36).slice(2),

			setTableNumber: (tableNumber: string) => set({ tableNumber }),

			setRestaurantSlug: (slug: string) => set({ restaurantSlug: slug }),

			setGuestId: (id: string) => set({ guestId: id }),

			addItem: (menuItem: MenuItem, quantity = 1) => {
				const { items } = get();
				const existingItem = items.find(
					(item) => item.menuItem.id === menuItem.id,
				);

				if (existingItem) {
					set({
						items: items.map((item) =>
							item.menuItem.id === menuItem.id
								? { ...item, quantity: item.quantity + quantity }
								: item,
						),
					});
				} else {
					set({
						items: [...items, { menuItem, quantity }],
					});
				}
			},

			removeItem: (menuItemId: string) => {
				set({
					items: get().items.filter((item) => item.menuItem.id !== menuItemId),
				});
			},

			updateQuantity: (menuItemId: string, quantity: number) => {
				if (quantity <= 0) {
					get().removeItem(menuItemId);
					return;
				}

				set({
					items: get().items.map((item) =>
						item.menuItem.id === menuItemId ? { ...item, quantity } : item,
					),
				});
			},

			updateSpecialRequests: (menuItemId: string, requests: string) => {
				set({
					items: get().items.map((item) =>
						item.menuItem.id === menuItemId
							? { ...item, specialRequests: requests }
							: item,
					),
				});
			},

			clearCart: () => set({ items: [] }),

			getSubtotal: () => {
				return get().items.reduce(
					(total, item) => total + item.menuItem.price * item.quantity,
					0,
				);
			},

			getServiceFee: (percentage: number) => {
				return get().getSubtotal() * (percentage / 100);
			},

			getTotal: (serviceFeePercentage: number) => {
				const subtotal = get().getSubtotal();
				const serviceFee = subtotal * (serviceFeePercentage / 100);
				return subtotal + serviceFee;
			},

			getTotalItems: () => {
				return get().items.reduce((total, item) => total + item.quantity, 0);
			},
		}),
		{
			name: "tawla-cart",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				items: state.items,
				tableNumber: state.tableNumber,
				restaurantSlug: state.restaurantSlug,
				guestId: state.guestId,
			}),
		},
	),
);
