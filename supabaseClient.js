function parseEnvText(content) {
  const result = {};
  content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .forEach((line) => {
      const idx = line.indexOf("=");
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      result[key] = value;
    });
  return result;
}

async function loadRuntimeEnv() {
  if (window.__ENV__ && window.__ENV__.NEXT_PUBLIC_SUPABASE_URL && window.__ENV__.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return window.__ENV__;
  }

  try {
    const response = await fetch("./.env.local", { cache: "no-store" });
    if (response.ok) {
      const text = await response.text();
      const parsed = parseEnvText(text);
      window.__ENV__ = { ...(window.__ENV__ || {}), ...parsed };
      return window.__ENV__;
    }
  } catch (_error) {
    // no-op: final validation below will provide a clear error.
  }

  return window.__ENV__ || {};
}

window.supabaseClientReady = (async () => {
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error("Supabase SDK is missing. Ensure CDN script is loaded first.");
  }

  const env = await loadRuntimeEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local or inject window.__ENV__."
    );
  }

  window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return window.supabaseClient;
})();
