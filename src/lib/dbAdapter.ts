import supabase from "./supabase";

type KVRow = { key: string; value: unknown };

function readLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch (e) {
    // ignore
  }
  return defaultValue;
}

function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

export function getItem<T>(key: string, defaultValue: T): T {
  return readLocal<T>(key, defaultValue);
}

export function setItem<T>(key: string, value: T): void {
  writeLocal<T>(key, value);

  // asynchronously mirror to Supabase key-value table if client configured
  (async () => {
    try {
      const sb = supabase as any;
      if (!sb) return;
      const { error } = await sb.from("key_values").upsert({ key, value }, { onConflict: "key" });
      if (error) console.warn("Supabase KV upsert error", error.message);
    } catch (e) {
      // ignore network errors
    }
  })();
}

export async function syncFromSupabase(keys?: string[]) {
  try {
    const sb = supabase as any;
    if (!sb) return;
    let query = sb.from("key_values").select("key,value");
    if (keys && keys.length > 0) query = query.in("key", keys);
    const { data, error } = await query;
    if (error) {
      console.warn("Supabase sync fetch error", error.message);
      return;
    }
    if (!data) return;
    data.forEach((row: KVRow) => {
      try {
        localStorage.setItem(row.key, JSON.stringify(row.value));
      } catch {}
    });
  } catch (e) {
    // ignore
  }
}

// --- Structured table helpers ---
export async function fetchTable<T>(table: string): Promise<T[]> {
  try {
    const sb = supabase as any;
    if (!sb) return [];
    const { data, error } = await sb.from(table).select('*');
    if (error) {
      console.warn('Supabase fetch error', table, error.message);
      return [];
    }
    return (data as T[]) || [];
  } catch (e) {
    return [];
  }
}

export async function upsertMany<T>(table: string, rows: T[]): Promise<void> {
  try {
    const sb = supabase as any;
    if (!sb) return;
    const { error } = await sb.from(table).upsert(rows);
    if (error) console.warn('Supabase upsert error', table, error.message);
  } catch (e) {
    // ignore
  }
}

export async function deleteById(table: string, id: string): Promise<void> {
  try {
    const sb = supabase as any;
    if (!sb) return;
    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) console.warn('Supabase delete error', table, error.message);
  } catch (e) {
    // ignore
  }
}

