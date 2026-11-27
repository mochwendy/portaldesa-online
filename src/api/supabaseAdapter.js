import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';

function assertSupabase() {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }
}

// Transform Supabase row (with data JSONB) to flat object matching CSV structure
function transformRow(row) {
    if (!row) return null;
    // If row has data JSONB, merge it with root fields
    // Handle both object and string (Postgres JSONB can return string)
    let dataObj = row.data;
    if (typeof dataObj === 'string') {
        try {
            dataObj = JSON.parse(dataObj);
        } catch {
            dataObj = {};
        }
    }
    if (dataObj && typeof dataObj === 'object') {
        return { ...dataObj, id: row.id, created_at: row.created_at, updated_at: row.updated_at };
    }
    return row;
}

// Convert numeric string fields to numbers in transformed rows
function convertNumericFields(row, numericFields = []) {
    if (!row || typeof row !== 'object') return row;
    const converted = { ...row };
    numericFields.forEach(field => {
        if (converted[field] !== undefined && converted[field] !== null && converted[field] !== '') {
            const num = Number(converted[field]);
            if (!Number.isNaN(num)) {
                converted[field] = num;
            }
        }
    });
    return converted;
}

function transformRows(rows, numericFields) {
    if (!Array.isArray(rows)) return [];
    return rows.map(row => {
        const transformed = transformRow(row);
        return convertNumericFields(transformed, numericFields);
    });
}

// Numeric fields for specific tables that need conversion from JSONB strings
const NUMERIC_FIELDS = {
    APBDes: ['anggaran', 'realisasi', 'tahun_anggaran', 'volume', 'satuan', 'persen_fisik', 'persen_keuangan'],
    RealisasiPembangunan: ['anggaran', 'realisasi', 'volume', 'satuan', 'persen_fisik', 'persen_keuangan', 'tahun_anggaran'],
    Penduduk: ['total', 'totalKK', 'disabilitas', 'lakiLaki', 'perempuan', 'usiaProduktif'],
    SuratKeterangan: ['nik', 'no_kk', 'rt', 'rw'],
    demografi_summary: ['total', 'totalKK', 'disabilitas', 'lakiLaki', 'perempuan', 'usiaProduktif'],
};

// Apply sort and limit safely - handles when sort is passed as number (limit) or null
// For Supabase, top-level columns are only: id, data (JSONB), created_at, updated_at
// If sort field is not a top-level column, use JSONB accessor: data->>fieldName
function applySortAndLimit(queryBuilder, sort, limit) {
    // If sort is a number, treat it as limit (not sort field)
    if (typeof sort === 'number') {
        limit = sort;
        sort = undefined;
    }
    // Only apply sort if it's a non-empty string
    if (typeof sort === 'string' && sort.trim().length > 0) {
        const [col, dir] = sort.startsWith('-') ? [sort.slice(1), false] : [sort, true];
        // Top-level columns in our schema
        const topLevelCols = ['id', 'created_at', 'updated_at'];
        const sortCol = topLevelCols.includes(col) ? col : `data->>${col}`;
        try {
            queryBuilder = queryBuilder.order(sortCol, { ascending: dir });
        } catch {
            // Fallback to created_at if JSONB sort fails
            queryBuilder = queryBuilder.order('created_at', { ascending: dir });
        }
    }
    if (limit) {
        queryBuilder = queryBuilder.limit(limit);
    }
    return queryBuilder;
}

// Apply JSONB-aware filters for filter() and count()
// Handles both plain values (eq) and operator objects ($ilike, $contains, $gt, $lt, $gte, $lte, $neq, $in)
// $or with $regex is handled BEFORE calling this function (in filter()/count())
function applyJsonbFilter(queryBuilder, queryObj) {
    if (!queryObj || typeof queryObj !== 'object') return queryBuilder;
    const skipKeys = ['search', '$or', 'id', 'created_at', 'updated_at'];
    Object.entries(queryObj).forEach(([key, value]) => {
        if (skipKeys.includes(key)) return;
        
        const jsonbKey = `data->>${key}`;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Operator object: { $ilike: '%abc%' }, { $gt: 100 }, { $in: [1,2,3] }, etc.
            // Also handle $regex (legacy) by converting to $ilike
            Object.entries(value).forEach(([op, opValue]) => {
                switch (op) {
                    case '$ilike':
                        queryBuilder = queryBuilder.ilike(jsonbKey, String(opValue));
                        break;
                    case '$like':
                        queryBuilder = queryBuilder.like(jsonbKey, String(opValue));
                        break;
                    case '$regex': // Legacy support: convert to $ilike
                        queryBuilder = queryBuilder.ilike(jsonbKey, `%${String(opValue)}%`);
                        break;
                    case '$contains':
                        queryBuilder = queryBuilder.contains(jsonbKey, opValue);
                        break;
                    case '$gt':
                        queryBuilder = queryBuilder.gt(jsonbKey, opValue);
                        break;
                    case '$gte':
                        queryBuilder = queryBuilder.gte(jsonbKey, opValue);
                        break;
                    case '$lt':
                        queryBuilder = queryBuilder.lt(jsonbKey, opValue);
                        break;
                    case '$lte':
                        queryBuilder = queryBuilder.lte(jsonbKey, opValue);
                        break;
                    case '$neq':
                        queryBuilder = queryBuilder.neq(jsonbKey, opValue);
                        break;
                    case '$in':
                        queryBuilder = queryBuilder.in(jsonbKey, opValue);
                        break;
                    default:
                        // Unknown operator, fallback to eq
                        queryBuilder = queryBuilder.eq(jsonbKey, String(opValue));
                }
            });
        } else {
            // Plain value: use eq with data->>key
            queryBuilder = queryBuilder.eq(jsonbKey, String(value));
        }
    });
    return queryBuilder;
}

export function createSupabaseEntity(tableName) {
    assertSupabase();

    const isPenduduk = tableName === 'Penduduk';
    const numericFields = NUMERIC_FIELDS[tableName] || [];

    async function list(sort = '-created_at', limit = isPenduduk ? 500 : undefined) {
        try {
            let query = supabase.from(tableName).select('*');
            query = applySortAndLimit(query, sort, limit);
            const { data, error } = await query;
            if (error) throw error;
            return transformRows(data, numericFields);
        } catch {
            return [];
        }
    }

    async function filter(queryObj = {}, opts = {}) {
        try {
            // Handle options: sort, limit, cursor (offset)
            const sort = opts.sort || '-created_at';
            const limit = opts.limit !== undefined ? opts.limit : (isPenduduk ? 500 : undefined);
            const cursor = opts.cursor != null ? Number(opts.cursor) : 0;
            
            // Handle legacy $or with $regex (used by Penduduk page for search) - extract search term before filter
            let searchTerm = queryObj?.search;
            if (!searchTerm && queryObj?.$or && Array.isArray(queryObj.$or)) {
                const regexTerms = queryObj.$or
                    .map(cond => {
                        const field = Object.keys(cond)[0];
                        const op = cond[field];
                        if (op && typeof op === 'object' && op.$regex) {
                            return op.$regex;
                        }
                        return null;
                    })
                    .filter(Boolean);
                if (regexTerms.length > 0) {
                    searchTerm = regexTerms[0];
                }
            }
            
            let query = supabase.from(tableName).select('*', { count: 'exact' });
            
            if (isPenduduk && searchTerm) {
                const term = `%${searchTerm}%`;
                query = query.or(`data->>nama_lengkap.ilike.${term},data->>nik.ilike.${term},data->>no_kk.ilike.${term}`);
            }
            
            // Apply JSONB-aware filters (will skip $or and search)
            query = applyJsonbFilter(query, queryObj);
            
            query = applySortAndLimit(query, sort, limit);
            
            // Apply pagination using range (cursor-based)
            if (cursor > 0 || limit) {
                const from = cursor;
                const to = limit ? cursor + limit - 1 : cursor + 999; // default large range if no limit
                query = query.range(from, to);
            }
            
            const { data, error, count } = await query;
            if (error) throw error;
            
            const items = transformRows(data, numericFields);
            const total = count || 0;
            const has_more = cursor + items.length < total;
            const next_cursor = has_more ? cursor + items.length : null;
            
            return { items, total, has_more, next_cursor };
        } catch {
            return { items: [], total: 0, has_more: false, next_cursor: null };
        }
    }

    async function get(id) {
        try {
            const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
            if (error) throw error;
            const transformed = transformRow(data);
            return convertNumericFields(transformed, numericFields);
        } catch {
            return null;
        }
    }

    async function create(payload) {
        try {
            const record = {
                id: crypto.randomUUID(),
                data: payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data, error } = await supabase.from(tableName).insert(record).select().single();
            if (error) throw error;
            return transformRow(data);
        } catch {
            return null;
        }
    }

    async function update(id, payload) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .update({ data: payload, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return transformRow(data);
        } catch {
            return null;
        }
    }

    async function remove(id) {
        try {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch {
            return false;
        }
    }

    async function count(queryObj = {}) {
        try {
            // Handle legacy $or with $regex (used by Penduduk page for search) - extract search term before filter
            let searchTerm = queryObj?.search;
            if (!searchTerm && queryObj?.$or && Array.isArray(queryObj.$or)) {
                const regexTerms = queryObj.$or
                    .map(cond => {
                        const field = Object.keys(cond)[0];
                        const op = cond[field];
                        if (op && typeof op === 'object' && op.$regex) {
                            return op.$regex;
                        }
                        return null;
                    })
                    .filter(Boolean);
                if (regexTerms.length > 0) {
                    searchTerm = regexTerms[0];
                }
            }
            
            let query = supabase.from(tableName).select('id', { count: 'exact', head: true });
            
            // Handle Penduduk search
            if (isPenduduk && searchTerm) {
                const term = `%${searchTerm}%`;
                query = query.or(`data->>nama_lengkap.ilike.${term},data->>nik.ilike.${term},data->>no_kk.ilike.${term}`);
            }
            
            // Apply JSONB-aware filters (will skip $or and search)
            query = applyJsonbFilter(query, queryObj);
            
            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        } catch {
            return 0;
        }
    }

    return { list, filter, get, create, update, delete: remove, count };
}

export async function supabaseKelolaAkunAkses(payload) {
    assertSupabase();
    
    const { action, id, ...data } = payload;
    
    switch (action) {
        case 'list': {
            const { data: rows, error } = await supabase.from('AkunAkses').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            // Return in same format as local: { items: [...], is_super_admin: false }
            return { items: transformRows(rows), is_super_admin: false };
        }
        case 'create': {
            const record = { id: crypto.randomUUID(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            const { data: row, error } = await supabase.from('AkunAkses').insert(record).select().single();
            if (error) throw error;
            return transformRow(row);
        }
        case 'update': {
            const { data: row, error } = await supabase
                .from('AkunAkses')
                .update({ ...data, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return transformRow(row);
        }
        case 'save': {
            if (id) {
                const { data: row, error } = await supabase
                    .from('AkunAkses')
                    .update({ ...data, updated_at: new Date().toISOString() })
                    .eq('id', id)
                    .select()
                    .single();
                if (error) throw error;
                return transformRow(row);
            } else {
                const record = { id: crypto.randomUUID(), ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
                const { data: row, error } = await supabase.from('AkunAkses').insert(record).select().single();
                if (error) throw error;
                return transformRow(row);
            }
        }
        case 'set-group': {
            const { data: row, error } = await supabase
                .from('AkunAkses')
                .update({ grup_kode: data.grup_kode, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return transformRow(row);
        }
        case 'delete': {
            const { error } = await supabase.from('AkunAkses').delete().eq('id', id);
            if (error) throw error;
            return true;
        }
        default:
            throw new Error(`Unknown action: ${action}`);
    }
}

export async function getAppSetting(key) {
    assertSupabase();
    const { data, error } = await supabase.from('app_settings').select('value').eq('key', key).single();
    if (error && error.code !== 'PGRST116') throw error;
    let value = data?.value ?? null;
    // Handle JSONB string from Postgres
    if (typeof value === 'string') {
        try {
            value = JSON.parse(value);
        } catch {
            // Keep as string if not valid JSON
        }
    }
    // Convert numeric fields for demografi_summary
    if (key === 'demografi_summary' && value && typeof value === 'object') {
        value = convertNumericFields(value, NUMERIC_FIELDS.demografi_summary || []);
    }
    return value;
}

export async function setAppSetting(key, value) {
    assertSupabase();
    const { data, error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function getPortalNotifications() {
    assertSupabase();
    try {
        // Get SuratKeterangan with status 'Baru' or 'Menunggu'
        const { data: suratRows, error: suratError } = await supabase
            .from('SuratKeterangan')
            .select('*')
            .in('data->>status', ['Baru', 'Menunggu'])
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (suratError) throw suratError;
        
        const suratNotifications = (suratRows || []).map(r => {
            const row = transformRow(r);
            return {
                id: row.id,
                type: 'surat',
                title: `Surat ${row.jenis_surat || 'Keterangan'} - ${row.nama_lengkap || row.nama || 'Warga'}`,
                message: `Status: ${row.status}`,
                created_at: row.created_at,
                reference_id: row.id,
            };
        });

        // Get Aspirasi with status 'Baru' or 'Menunggu'
        const { data: aspirasiRows, error: aspirasiError } = await supabase
            .from('Aspirasi')
            .select('*')
            .in('data->>status', ['Baru', 'Menunggu'])
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (aspirasiError) throw aspirasiError;
        
        const aspirasiNotifications = (aspirasiRows || []).map(r => {
            const row = transformRow(r);
            return {
                id: row.id,
                type: 'aspirasi',
                title: `Aspirasi: ${row.judul || row.kategori || 'Tanpa Judul'}`,
                message: `Dari: ${row.nama_lengkap || row.nama || 'Anonim'} (${row.status})`,
                created_at: row.created_at,
                reference_id: row.id,
            };
        });

        // Combine and sort by created_at descending
        const allNotifications = [...suratNotifications, ...aspirasiNotifications]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 50);

        return allNotifications;
    } catch (e) {
        console.error('getPortalNotifications error:', e);
        return [];
    }
}