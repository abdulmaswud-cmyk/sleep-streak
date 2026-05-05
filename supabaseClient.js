const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || "https://ovayxmpwxwqknicspgrj.supabase.co";
const SUPABASE_ANON_KEY =
  window.__ENV__?.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92YXl4bXB3eHdxa25pY3NwZ3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMDcwMzgsImV4cCI6MjA5MzU4MzAzOH0.qBJ6S5FvlkhGfwsTFDwsl8Ajj3oqmSaikWcgDBP52P8";

if (!window.supabase || !window.supabase.createClient) {
  throw new Error("Supabase SDK is missing. Ensure CDN script is loaded first.");
}

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
