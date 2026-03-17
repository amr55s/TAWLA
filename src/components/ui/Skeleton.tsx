'use client';

import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

/** Base pulsing skeleton block. Size via className (e.g. `h-4 w-24`). */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse rounded-xl bg-gray-200/70',
        className
      )}
    />
  );
}

/** Skeleton that mimics a single text line. */
export function SkeletonLine({ className }: SkeletonProps) {
  return <Skeleton className={clsx('h-3.5 rounded-md', className)} />;
}

/** Skeleton card matching the waiter table grid tile. */
export function SkeletonTableCard() {
  return (
    <div className="aspect-square rounded-2xl border-2 border-gray-200 bg-gray-100/60 flex flex-col items-center justify-center gap-2 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-gray-200/80" />
      <div className="w-12 h-2.5 rounded bg-gray-200/80" />
    </div>
  );
}

/** Skeleton card matching the guest order history card. */
export function SkeletonOrderCard() {
  return (
    <div className="bg-background-card rounded-2xl shadow-card p-4 border border-border-light animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b border-border-light pb-3">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-md bg-gray-200/70" />
          <div className="h-3 w-20 rounded-md bg-gray-200/50" />
        </div>
        <div className="h-6 w-24 rounded-md bg-gray-200/60" />
      </div>
      {/* Items */}
      <div className="space-y-3 py-1">
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-32 rounded-md bg-gray-200/60" />
          <div className="h-3.5 w-16 rounded-md bg-gray-200/50" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-3.5 w-24 rounded-md bg-gray-200/60" />
          <div className="h-3.5 w-16 rounded-md bg-gray-200/50" />
        </div>
      </div>
      {/* Total */}
      <div className="border-t border-primary/20 mt-3 pt-3 flex items-center justify-between">
        <div className="h-4 w-12 rounded-md bg-gray-200/60" />
        <div className="h-5 w-20 rounded-md bg-gray-200/70" />
      </div>
    </div>
  );
}

/** Skeleton matching a cashier insight card. */
export function SkeletonInsightCard() {
  return (
    <div className="rounded-xl p-4 bg-gray-100/60 animate-pulse">
      <div className="h-3 w-28 rounded bg-gray-200/60 mb-3" />
      <div className="h-7 w-24 rounded bg-gray-200/80" />
    </div>
  );
}
