import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isSuperAdminUser } from '@/lib/auth/super-admin';

const AUTH_ROUTES = ['/login', '/register', '/onboarding'];
const NEVER_REDIRECT_ROUTES = ['/', '/login'];
const BYPASS_PREFIXES = ['/api', '/_next'];
const STATIC_ASSET_REGEX = /\.[^/]+$/;
const TRIAL_SAFE_ROUTE_PATTERNS = [
  /^\/[^/]+\/subscribe(?:\/|$)/,
  /^\/[^/]+\/admin\/settings\/billing(?:\/|$)/,
  /^\/[^/]+\/admin\/settings\/checkout(?:\/|$)/,
];

function isAdminRoute(pathname: string): boolean {
  // Match /:slug/admin or /:slug/admin/*
  return /^\/[^/]+\/admin(\/|$)/.test(pathname);
}

function isStaffRoute(pathname: string): boolean {
  return pathname.includes('/cashier') || pathname.includes('/waiter');
}

function isSuperAdminRoute(pathname: string): boolean {
  return pathname === '/super-admin' || pathname.startsWith('/super-admin/');
}

function isProtectedRoute(pathname: string): boolean {
  return isAdminRoute(pathname) || isStaffRoute(pathname) || isSuperAdminRoute(pathname);
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((r) => pathname === r);
}

function isPublicRedirectRoute(pathname: string): boolean {
  return pathname === '/';
}

function isNeverRedirectRoute(pathname: string): boolean {
  return NEVER_REDIRECT_ROUTES.some((route) => pathname === route);
}

function isBypassedPath(pathname: string): boolean {
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return pathname === '/favicon.ico' || STATIC_ASSET_REGEX.test(pathname);
}

function isTrialSafeRoute(pathname: string): boolean {
  return TRIAL_SAFE_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  if (isBypassedPath(pathname) || isNeverRedirectRoute(pathname)) {
    return supabaseResponse;
  }

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
  const isSuperAdmin = isSuperAdminUser(user);

  // ── Super Admin shortcut: redirect super admin to /super-admin ──
  if (
    user &&
    isSuperAdmin &&
    isAuthRoute(pathname) &&
    !isNeverRedirectRoute(pathname)
  ) {
    return NextResponse.redirect(new URL('/super-admin', request.url));
  }

  // ── Super Admin route guard ──
  if (pathname.startsWith('/super-admin')) {
    if (!user || !isSuperAdmin) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── STAFF ROUTE PROTECTION (Cookie-based) ──
  const isStaffPath =
    pathname.includes('/waiter') ||
    pathname.includes('/cashier') ||
    pathname.includes('/admin');
  const isSuperAdminPath = pathname.startsWith('/super-admin');
  const isTrialSafePath = isTrialSafeRoute(pathname);

  if (isStaffPath && !isSuperAdminPath && !isTrialSafePath) {
    const slug = pathname.split('/')[1];
    const staffCookie = request.cookies.get('tawla_staff_session')?.value;

    if (!staffCookie) {
      if (pathname.includes('/admin')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
    }

    try {
      const parsedCookie = JSON.parse(staffCookie);
      
      // Basic structure validation
      if (!parsedCookie || typeof parsedCookie !== 'object' || !parsedCookie.slug || !parsedCookie.role) {
        console.error('Invalid staff session cookie structure');
        if (pathname.includes('/admin')) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
      }

      // Tenant Validation (Cross-tenant breach protection)
      if (parsedCookie.slug !== slug) {
        console.error('Cross-tenant access attempt blocked');
        if (pathname.includes('/admin')) {
          return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
      }

      // Role Validation
      const role = parsedCookie.role;
      
      // Owners have absolute access to any staff/admin route within their tenant
      if (role === 'owner') {
        return supabaseResponse;
      }

      if (pathname.includes('/admin') && role !== 'admin' && role !== 'owner') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Allow admins to access waiter/cashier routes as well
      if (pathname.includes('/waiter') && role !== 'waiter' && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
      }

      if (pathname.includes('/cashier') && role !== 'cashier' && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL(`/${slug}/login`, request.url));
    }
  }

  // ── Authenticated users visiting auth/public routes → redirect to /{slug}/admin ──
  if (
    user &&
    (isAuthRoute(pathname) || isPublicRedirectRoute(pathname)) &&
    !isNeverRedirectRoute(pathname)
  ) {
    // Resolve slug for redirect
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('slug')
      .eq('owner_id', user.id)
      .limit(1);
    const restaurant = restaurants?.[0];

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
    '/super-admin/:path*',
    '/:slug/admin/:path*',
    '/:slug/cashier/:path*',
    '/:slug/waiter/:path*',
    '/:slug/kds',
  ],
};
