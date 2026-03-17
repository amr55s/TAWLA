import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  // #region agent log
  fetch('http://127.0.0.1:7626/ingest/21cc834c-eefd-4a54-a3aa-a6b8a45c9c22',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'9ce4e7'},body:JSON.stringify({sessionId:'9ce4e7',runId:'initial',hypothesisId:'H1',location:'src/lib/supabase/server.ts:6',message:'server supabase env check',data:{hasUrl:Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),hasAnonKey:Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),urlLength:process.env.NEXT_PUBLIC_SUPABASE_URL?.length ?? 0,anonKeyLength:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0,nodeEnv:process.env.NODE_ENV},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component, ignore
          }
        },
      },
    }
  );
}
