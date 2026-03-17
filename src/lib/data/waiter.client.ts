'use client';

import { createClient } from '@/lib/supabase/client';
import type { WaiterCall, WaiterCallStatus } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient();

export async function getActiveWaiterCallsClient(restaurantId: string): Promise<WaiterCall[]> {
  const { data, error } = await supabase
    .from('waiter_calls')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching active waiter calls:', error);
    return [];
  }
  
  return (data as WaiterCall[]) || [];
}

export async function updateWaiterCallStatusClient(callId: string, status: WaiterCallStatus): Promise<boolean> {
  const { error } = await supabase
    .from('waiter_calls')
    .update({ status })
    .eq('id', callId);
  
  if (error) {
    console.error('Error updating waiter call status:', error);
    return false;
  }
  
  return true;
}

export function subscribeToWaiterCalls(
  restaurantId: string,
  onInsert: (call: WaiterCall) => void,
  onUpdate: (call: WaiterCall) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`waiter_calls-${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'waiter_calls',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        onInsert(payload.new as WaiterCall);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'waiter_calls',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        onUpdate(payload.new as WaiterCall);
      }
    )
    .subscribe();
  
  return channel;
}
