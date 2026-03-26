import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(
					cookiesToSet: {
						name: string;
						value: string;
						options: CookieOptions;
					}[],
				) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, {
								...options,
								secure: process.env.NODE_ENV === "production",
							}),
						);
					} catch {
						// Server component, ignore
					}
				},
			},
			cookieOptions: {
				secure: process.env.NODE_ENV === "production",
			},
		},
	);
}

/**
 * Service-role admin client — bypasses RLS.
 * Use ONLY inside Server Actions after explicit auth and tenant checks.
 */
export function createAdminClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !serviceKey) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
		);
	}
	return createSupabaseClient(url, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
}
