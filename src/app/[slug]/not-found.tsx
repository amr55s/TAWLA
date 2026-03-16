import Link from 'next/link';

export default function RestaurantNotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-light text-text-heading mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-text-heading mb-4">
          Restaurant Not Found
        </h2>
        <p className="text-text-secondary mb-8">
          The restaurant you&apos;re looking for doesn&apos;t exist or may have
          been removed.
        </p>
        <Link
          href="/"
          className="inline-block py-3 px-6 bg-primary text-white rounded-3xl font-semibold hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
