const SUPABASE_URL = window.__ENV__?.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!window.supabase || !window.supabase.createClient) {
  throw new Error("Supabase SDK is missing. Ensure CDN script is loaded first.");
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Inject them into window.__ENV__ at runtime."
  );
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
