"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

// Supposing a basic supabase client for the example
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AddOrderButton({ restaurantId, tableId }: { restaurantId: string, tableId: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newOrder: { restaurant_id: string; table_id: string; total_amount: number }) => {
      const { data, error } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch orders when a new order is added
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const handleAddOrder = () => {
    mutation.mutate({
      restaurant_id: restaurantId,
      table_id: tableId,
      total_amount: 0, // example amount
    });
  };

  return (
    <div>
      <button 
        onClick={handleAddOrder} 
        disabled={mutation.isPending}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {mutation.isPending ? 'Adding...' : 'Add Order'}
      </button>
      {mutation.isError && (
        <p className="text-red-500">Error: {mutation.error.message}</p>
      )}
      {mutation.isSuccess && (
        <p className="text-green-500">Order added successfully!</p>
      )}
    </div>
  );
}
