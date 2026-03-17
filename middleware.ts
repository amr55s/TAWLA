import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PREFIXES = ['/admin', '/login'];
const PROTECTED_SUFFIXES = ['/cashier', '/waiter'];

function isProtectedRoute(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  return PROTECTED_SUFFIXES.some((s) => pathname.includes(s));
}

function isLoginRoute(pathname: string): boolean {
  return pathname === '/login';
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (isLoginRoute(pathname) && user) {
    const role = user.user_metadata?.role as string | undefined;
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (role === 'cashier' || role === 'waiter') {
      const restaurantId = user.user_metadata?.restaurant_id as string | undefined;
      if (restaurantId) {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('slug')
          .eq('id', restaurantId)
          .maybeSingle();

        if (restaurant?.slug) {
          return NextResponse.redirect(new URL(`/${restaurant.slug}/${role}`, request.url));
        }
      }
    }

    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isProtectedRoute(pathname) && !isLoginRoute(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Role-based route enforcement: waiter cannot access /cashier and vice versa.
  if (user && !isLoginRoute(pathname)) {
    const role = user.user_metadata?.role as string | undefined;
    const isCashierRoute = pathname.includes('/cashier');
    const isWaiterRoute = pathname.includes('/waiter');

    if ((isCashierRoute && role === 'waiter') || (isWaiterRoute && role === 'cashier')) {
      // Extract slug from the path (e.g. /my-restaurant/cashier -> my-restaurant)
      const segments = pathname.split('/').filter(Boolean);
      const slug = segments.length > 0 ? segments[0] : '';
      if (slug) {
        return NextResponse.redirect(new URL(`/${slug}/${role}`, request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
    '/:slug/cashier/:path*',
    '/:slug/waiter/:path*',
  ],
};
