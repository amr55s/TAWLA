import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous Supabase client for integration tests (same key as the browser).
 * Respects RLS — behaviour matches real guests.
 */
export function createAnonSupabase(): SupabaseClient {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) {
		throw new Error(
			"NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for integration tests",
		);
	}
	return createClient(url, key);
}
