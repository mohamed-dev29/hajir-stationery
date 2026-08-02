import { toast } from "sonner";
import supabase from "./supabase";

type TableChangeDetail = { table: string };

const SUPABASE_DATA_CHANGED_EVENT = "supabase-data-changed";

function emitTableChange(table: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<TableChangeDetail>(SUPABASE_DATA_CHANGED_EVENT, {
      detail: { table },
    }),
  );
}

export function notifySupabaseDataChanged(table: string): void {
  emitTableChange(table);
}

export function onSupabaseDataChanged(
  handler: (table: string) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<TableChangeDetail>;
    handler(customEvent.detail?.table);
  };

  window.addEventListener(SUPABASE_DATA_CHANGED_EVENT, listener);
  return () => window.removeEventListener(SUPABASE_DATA_CHANGED_EVENT, listener);
}

export function getItem<T>(_key: string, defaultValue: T): T {
  return defaultValue;
}

export function setItem<T>(key: string, value: T): void {
  (async () => {
    try {
      const sb = supabase as any;
      if (!sb) return;
      const { error } = await sb.from("key_values").upsert({ key, value }, { onConflict: "key" });
      if (error) console.warn("Supabase KV upsert error", error.message);
    } catch (e) {
      // ignore network errors for the local key-value mirror
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
    return data ?? [];
  } catch (e) {
    return [];
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
    if (rows.length === 0) return;
    const { error } = await sb.from(table).upsert(rows);
    if (error) {
      console.warn('Supabase upsert error', table, error.message);
      toast.error(`Supabase rejected ${table}`, {
        description: error.message,
      });
      return;
    }

    toast.success(`Saved ${rows.length} ${table} record${rows.length === 1 ? '' : 's'} to Supabase`);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    toast.error(`Supabase save failed for ${table}`, {
      description: message,
    });
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

export async function clearTable(table: string, keyColumn = 'id'): Promise<void> {
  try {
    const sb = supabase as any;
    if (!sb) return;
    const { data, error } = await sb.from(table).select(keyColumn);
    if (error) {
      console.warn('Supabase clear fetch error', table, error.message);
      return;
    }

    const values = (data ?? [])
      .map((row: Record<string, unknown>) => row[keyColumn])
      .filter((value: unknown): value is string | number => value !== null && value !== undefined);

    if (values.length === 0) return;
    const { error: deleteError } = await sb.from(table).delete().in(keyColumn, values);
    if (deleteError) console.warn('Supabase clear delete error', table, deleteError.message);
  } catch (e) {
    // ignore
  }
}

