import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
    // Remove /rest/v1/ suffix if present (from .env.local)
    const baseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
    supabase = createClient(baseUrl, supabaseAnonKey);
} else {
    console.warn('[supabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not configured. Running in local-only mode.');
}

export { supabase };

export function isSupabaseConfigured() {
    return supabase !== null;
}

export async function fetchFromSupabase(tableName, options = {}) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    
    let query = supabase.from(tableName).select('*');
    
    if (options.select) {
        query = query.select(options.select);
    }
    if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
            query = query.eq(key, value);
        });
    }
    if (options.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    if (options.limit) {
        query = query.limit(options.limit);
    }
    if (options.range) {
        query = query.range(options.range.from, options.range.to);
    }
    
    return query;
}

export async function insertToSupabase(tableName, records) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    return supabase.from(tableName).upsert(records, { onConflict: 'id' });
}

export async function updateInSupabase(tableName, id, data) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    return supabase.from(tableName).update(data).eq('id', id);
}

export async function deleteFromSupabase(tableName, id) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    return supabase.from(tableName).delete().eq('id', id);
}

export function subscribeToTable(tableName, callback, filter = {}) {
    if (!supabase) return null;
    
    const channel = supabase.channel(`simdesta-${tableName}-${Date.now()}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: tableName,
                ...filter
            },
            (payload) => callback(payload)
        )
        .subscribe();
    
    return channel;
}

export function unsubscribe(channel) {
    if (channel) {
        supabase.removeChannel(channel);
    }
}