import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL &&
  env.VITE_SUPABASE_ANON_KEY &&
  env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DB_PREFIX = 'edusync_db_';
const CLEAN_VERSION = 'edusync_wiped_v2.4';

// Ensure any old demo seed data in browser localStorage is wiped clean
try {
  if (localStorage.getItem(CLEAN_VERSION) !== 'true') {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(DB_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    localStorage.setItem(CLEAN_VERSION, 'true');
  }
} catch {
  // ignore
}

export function getLocalDB<T>(tableName: string, defaultData: T[] = []): T[] {
  try {
    const saved = localStorage.getItem(`${DB_PREFIX}${tableName}`);
    if (saved) return JSON.parse(saved);
    return defaultData;
  } catch {
    return defaultData;
  }
}

export function saveLocalDB<T>(tableName: string, data: T[]): void {
  try {
    localStorage.setItem(`${DB_PREFIX}${tableName}`, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}
