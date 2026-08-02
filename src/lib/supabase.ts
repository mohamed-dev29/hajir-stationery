import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "";
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "";

let client: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    // fail gracefully
    // eslint-disable-next-line no-console
    console.warn("Failed to initialize Supabase client", e);
    client = null;
  }
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY",
  );
}

export const supabase = client;

export default supabase;
