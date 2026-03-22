import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const AUTH_ROUTES = ['/login', '/register', '/onboarding'];

function isAdminRoute(pathname: string): boolean {
  // Match /:slug/admin or /:slug/admin/*
  return /^\/[^/]+\/admin(\/|$)/.test(pathname);
}

function isStaffRoute(pathname: string): boolean {
  return pathname.includes('/cashier') || pathname.includes('/waiter');
}

function isProtectedRoute(pathname: string): boolean {
  return isAdminRoute(pathname) || isStaffRoute(pathname);
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname === r);
}

function isPublicRedirectRoute(pathname: string): boolean {
  return pathname === '/';
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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
            })
          );
        },
      },
      cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // ── Authenticated users visiting auth/public routes → redirect to /{slug}/admin ──
  if (user && (isAuthRoute(pathname) || isPublicRedirectRoute(pathname))) {
    // Resolve slug for redirect
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (restaurant?.slug) {
      return NextResponse.redirect(new URL(`/${restaurant.slug}/admin`, request.url));
    }
    // If no restaurant yet (new user), send to onboarding
    if (isPublicRedirectRoute(pathname)) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // ── Unauthenticated users on protected routes → redirect to /login ──
  if (isProtectedRoute(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // ── Role-based route enforcement ──
  if (user && !isAuthRoute(pathname)) {
    const role = user.user_metadata?.role as string | undefined;
    const isCashierRoute = pathname.includes('/cashier');
    const isWaiterRoute = pathname.includes('/waiter');
    const isAdmin = isAdminRoute(pathname);

    // Block staff from accessing admin routes
    if (isAdmin && (role === 'waiter' || role === 'cashier')) {
      const segments = pathname.split('/').filter(Boolean);
      const slug = segments.length > 0 ? segments[0] : '';
      if (slug) {
        return NextResponse.redirect(new URL(`/${slug}/${role}`, request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }

    if ((isCashierRoute && role === 'waiter') || (isWaiterRoute && role === 'cashier')) {
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
    '/',
    '/register',
    '/onboarding',
    '/login',
    '/:slug/admin/:path*',
    '/:slug/cashier/:path*',
    '/:slug/waiter/:path*',
  ],
};
