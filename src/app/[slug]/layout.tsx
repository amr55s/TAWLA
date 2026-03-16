import { notFound } from 'next/navigation';
import { getRestaurantBySlug } from '@/lib/data/restaurants';

interface RestaurantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function RestaurantLayout({
  children,
  params,
}: RestaurantLayoutProps) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    notFound();
  }

  const themeStyles = {
    '--primary': restaurant.theme_colors.primary,
    '--background': restaurant.theme_colors.background,
    '--primary-light': `${restaurant.theme_colors.primary}1a`,
    '--primary-medium': `${restaurant.theme_colors.primary}33`,
    '--primary-shadow': `${restaurant.theme_colors.primary}33`,
  } as React.CSSProperties;

  return (
    <div style={themeStyles} className="min-h-screen bg-background">
      {children}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return {
      title: 'Restaurant Not Found',
    };
  }

  return {
    title: `${restaurant.name} - Digital Menu`,
    description: `Browse the menu at ${restaurant.name}. Order delicious food with ease.`,
  };
}
