"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeRestaurant(restaurantId: string | undefined | null) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    // Only subscribe if we have a valid restaurantId
    if (!restaurantId) return;

    // Create a unique channel name based on the restaurantId to prevent overlap
    const channel = supabase.channel(`restaurant_realtime_${restaurantId}`);

    // Subscribe to orders table changes
    channel.on(
      "postgres_changes",
      {
        event: "*", // Listen to INSERT, UPDATE, and DELETE
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      () => {
        // Invalidate the orders query cache to trigger a UI refresh
        queryClient.invalidateQueries({
          queryKey: ["orders", restaurantId],
        });
        
        // You could also invalidate a broad 'orders' key if you want
        queryClient.invalidateQueries({
          queryKey: ["orders"],
        });
      }
    );

    // Subscribe to waiter_calls table changes
    channel.on(
      "postgres_changes",
      {
        event: "*", // Listen to INSERT, UPDATE, and DELETE
        schema: "public",
        table: "waiter_calls",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      () => {
        // Invalidate the waiter_calls query cache to trigger a UI refresh
        queryClient.invalidateQueries({
          queryKey: ["waiter_calls", restaurantId],
        });
      }
    );

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
         console.log(`Subscribed to realtime events for restaurant ${restaurantId}`);
      }
    });

    // Cleanup function to cleanly unsubscribe when the component unmounts
    // or when the restaurantId changes
    return () => {
      console.log(`Unsubscribing from realtime events for restaurant ${restaurantId}`);
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient, supabase]);
}
