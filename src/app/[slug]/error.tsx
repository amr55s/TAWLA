'use client';

import { useEffect } from 'react';

export default function RestaurantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[slug] segment error:', error.message);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-heading mb-2">
          Something went wrong
        </h1>
        <p className="text-text-secondary mb-8">
          We couldn&apos;t load this page. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-block py-3 px-6 bg-primary text-white rounded-3xl font-semibold hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
