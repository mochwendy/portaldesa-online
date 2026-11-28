import { supabase, isSupabaseConfigured, toNumber } from '@/lib/supabaseClient.js';

function assertSupabase() {
    if (!isSupabaseConfigured()) {
        throw new Error('Supabase not configured');
    }
}

const ASPIRASI_BUKTI_BUCKET = 'aspirasi-bukti';

export async function uploadAspirasiBuktiPhoto(file, nomorTiket) {
    assertSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${nomorTiket}/foto_bukti.${fileExt}`;
    console.log('DEBUG UPLOAD:', {
        file: file.name, 
        fileType: file.type,
        fileSize: file.size,
        fileName: fileName,
        bucket: ASPIRASI_BUKTI_BUCKET,
        operation: 'upload',
        url: `${ASPIRASI_BUKTI_BUCKET}/${fileName}`
    });
    const { error: uploadError } = await supabase.storage
        .from(ASPIRASI_BUKTI_BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (uploadError) {
        console.error('DEBUG UPLOAD ERROR:', uploadError);
        throw uploadError;
    }

    const { data: urlData } = supabase.storage
        .from(ASPIRASI_BUKTI_BUCKET)
        .getPublicUrl(fileName);
    console.log('DEBUG UPLOAD SUCCESS:', urlData.publicUrl);
    return urlData.publicUrl;
}

// Transform Supabase row (with data JSONB) to flat object matching CSV structure
export function transformRow(row) {
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
    return rows.filter(row => row !== null && typeof row === 'object').map(row => {
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
// Handles both plain values (eq) and operator objects ($ilike, $contains, $gt, $lt, $gte, $lte, $neq, $in, $not, $regex)
// $or is handled HERE to support audit filters with complex conditions
function applyJsonbFilter(queryBuilder, queryObj) {
    if (!queryObj || typeof queryObj !== 'object') return queryBuilder;
    const skipKeys = ['search', 'id', 'created_at', 'updated_at'];
    
    // Build a list of filters to apply
    const filters = [];
    const orGroups = [];
    
    Object.entries(queryObj).forEach(([key, value]) => {
        if (skipKeys.includes(key)) return;
        
        // Handle $or array: each element is a condition object
        if (key === '$or' && Array.isArray(value)) {
            const orConditions = value.map(cond => {
                if (!cond || typeof cond !== 'object') return null;
                const entries = Object.entries(cond);
                if (entries.length === 0) return null;
                const [field, fieldValue] = entries[0];
                const jsonbKey = `data->>${field}`;
                
                // Handle different operators in the condition
                if (fieldValue !== null && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
                    const ops = Object.entries(fieldValue);
                    if (ops.length === 1) {
                        const [op, opValue] = ops[0];
                        switch (op) {
                            case '$regex':
                                // $regex '^$' means empty string
                                if (opValue === '^$') {
                                    // Empty string OR null
                                    return `(${jsonbKey}.eq.,${jsonbKey}.is.null)`;
                                }
                                if (opValue === '^-$') {
                                    // dash OR en-dash
                                    return `(${jsonbKey}.eq.-,${jsonbKey}.eq.–)`;
                                }
                                if (opValue === '^–$') {
                                    return `(${jsonbKey}.eq.–,${jsonbKey}.eq.-)`;
                                }
                                // For other regex, use ilike (approximate)
                                return `${jsonbKey}.ilike.%${String(opValue).replace('%', '%25').replace('_', '%5F')}%`;
                            case '$ilike':
                                return `${jsonbKey}.ilike.${encodeURIComponent(String(opValue))}`;
                            case '$neq':
                                return `${jsonbKey}.neq.${encodeURIComponent(String(opValue))}`;
                            case '$not':
                                // Handle $not with nested operator (e.g., { $not: { $regex: '^$' } })
                                if (opValue && typeof opValue === 'object') {
                                    const notOps = Object.entries(opValue);
                                    if (notOps.length === 1) {
                                        const [notOp, notValue] = notOps[0];
                                        if (notOp === '$regex') {
                                            // $not { $regex: '^$' } means NOT empty string AND NOT null
                                            if (notValue === '^$') {
                                                return `${jsonbKey}.neq.,${jsonbKey}.is.null.false`;
                                            }
                                            if (notValue === '^-$') {
                                                return `${jsonbKey}.neq.-,${jsonbKey}.neq.–`;
                                            }
                                            if (notValue === '^–$') {
                                                return `${jsonbKey}.neq.–,${jsonbKey}.neq.-`;
                                            }
                                            // For other regex not match, use NOT ILIKE
                                            return `${jsonbKey}.not.ilike.%${String(notValue).replace('%', '%25').replace('_', '%5F')}%`;
                                        }
                                    }
                                }
                                break;
                            case '$eq':
                                return `${jsonbKey}.eq.${encodeURIComponent(String(opValue))}`;
                            default:
                                return `${jsonbKey}.eq.${encodeURIComponent(String(opValue))}`;
                        }
                    }
                } else {
                    // Plain value equality
                    return `${jsonbKey}.eq.${encodeURIComponent(String(fieldValue))}`;
                }
                return null;
            }).filter(Boolean);
            
            if (orConditions.length > 0) {
                orGroups.push(orConditions.join(','));
            }
            return;
        }
        
        const jsonbKey = `data->>${key}`;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            // Operator object: { $ilike: '%abc%' }, { $gt: 100 }, { $in: [1,2,3] }, { $not: {...} }, etc.
            // Also handle $regex (legacy) by converting to $ilike
            Object.entries(value).forEach(([op, opValue]) => {
                switch (op) {
                    case '$ilike':
                        filters.push(`${jsonbKey}.ilike.${encodeURIComponent(String(opValue))}`);
                        break;
                    case '$like':
                        filters.push(`${jsonbKey}.like.${encodeURIComponent(String(opValue))}`);
                        break;
                    case '$regex': // Legacy support: convert to $ilike
                        filters.push(`${jsonbKey}.ilike.%${encodeURIComponent(String(opValue))}%`);
                        break;
                    case '$contains':
                        filters.push(`${jsonbKey}.cs.${encodeURIComponent(JSON.stringify(opValue))}`);
                        break;
                    case '$gt':
                        filters.push(`${jsonbKey}.gt.${encodeURIComponent(String(opValue))}`);
                        break;
                    case '$gte':
                        filters.push(`${jsonbKey}.gte.${encodeURIComponent(String(opValue))}`);
                        break;
                    case '$lt':
                        filters.push(`${jsonbKey}.lt.${encodeURIComponent(String(opValue))}`);
                        break;
                    case '$lte':
                        filters.push(`${jsonbKey}.lte.${encodeURIComponent(String(opValue))}`);
                        break;
                    case '$neq':
                        filters.push(`${jsonbKey}.neq.${encodeURIComponent(String(opValue))}`);
                        break;
                    case '$in':
                        if (Array.isArray(opValue)) {
                            filters.push(`${jsonbKey}.in.(${opValue.map(v => encodeURIComponent(String(v))).join(',')})`);
                        }
                        break;
                    case '$not':
                        // Handle $not with nested operator (e.g., { $not: { $regex: '^\\d{16}$' } })
                        if (opValue && typeof opValue === 'object') {
                            const notOps = Object.entries(opValue);
                            if (notOps.length === 1) {
                                const [notOp, notValue] = notOps[0];
                                if (notOp === '$regex') {
                                    // For NIK not matching 16 digits: use filter with not.ilike pattern
                                    // 16 underscores for 16 digits pattern
                                    filters.push(`${jsonbKey}.not.ilike.${'________________'}`);
                                }
                            }
                        }
                        break;
                    default:
                        // Unknown operator, fallback to eq
                        filters.push(`${jsonbKey}.eq.${encodeURIComponent(String(opValue))}`);
                }
            });
        } else {
            // Plain value: use eq with data->>key
            filters.push(`${jsonbKey}.eq.${encodeURIComponent(String(value))}`);
        }
    });
    
    // Apply all simple filters (AND)
    if (filters.length > 0) {
        filters.forEach(f => {
            const parts = f.split('.');
            const column = parts[0];
            const operator = parts[1];
            const value = parts.slice(2).join('.');
            queryBuilder = queryBuilder.filter(column, operator, value);
        });
    }
    
    // Apply OR groups
    if (orGroups.length > 0) {
        orGroups.forEach(og => {
            queryBuilder = queryBuilder.or(og);
        });
    }
    
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
            
            if (isPenduduk && queryObj?.nik) {
                console.log('[supabaseAdapter.filter] Penduduk NIK query:', { queryObj, sort, limit, cursor });
            }

            const { data, error, count } = await query;
            if (error) {
                console.error('[supabaseAdapter.filter] Query error for', tableName, ':', error);
                throw error;
            }
            
            if (isPenduduk && queryObj?.nik) {
                console.log('[supabaseAdapter.filter] Penduduk NIK result:', { dataLength: data?.length, count });
            }

            const items = transformRows(data, numericFields);
            const total = count || 0;
            const has_more = cursor + items.length < total;
            const next_cursor = has_more ? cursor + items.length : null;
            
            return { items, total, has_more, next_cursor };
        } catch (e) {
            console.error('[supabaseAdapter.filter] Caught error for', tableName, ':', e?.message || e);
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
            // Fetch existing row to merge JSONB data
            const { data: existing, error: fetchError } = await supabase
                .from(tableName)
                .select('data')
                .eq('id', id)
                .single();
            
            if (fetchError) throw fetchError;
            
            // Merge existing data with payload (payload overwrites existing)
            const existingData = existing?.data || {};
            const mergedData = { ...existingData, ...payload };
            
            const { data, error } = await supabase
                .from(tableName)
                .update({ data: mergedData, updated_at: new Date().toISOString() })
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

// Normalize group kode: ADMDES -> ADM (canonical Admin Desa kode)
export function normalizeGroupKode(kode) {
    if (!kode) return kode;
    const upper = String(kode).trim().toUpperCase();
    if (upper === 'ADMDES') return 'ADM';
    return upper;
}

// Get hierarki from group kode
export function getHierarkiFromKode(kode) {
    const normalized = normalizeGroupKode(kode);
    switch (normalized) {
        case 'SU': return 'super_admin';
        case 'ADM':
        case 'KADES': return 'admin_desa';
        case 'SEKDES':
        case 'STAF': return 'operator';
        case 'WARGA':
        case 'GUEST':
        default: return 'warga';
    }
}

// Get group nama from kode
export function getGroupNamaFromKode(kode) {
    const normalized = normalizeGroupKode(kode);
    switch (normalized) {
        case 'SU': return 'Super Admin';
        case 'ADM':
        case 'KADES': return 'Admin Desa';
        case 'SEKDES': return 'Sekretaris Desa';
        case 'STAF': return 'Staf';
        case 'WARGA': return 'Warga';
        case 'GUEST': return 'Guest';
        default: return kode || 'Belum Diatur';
    }
}

export async function supabaseKelolaAkunAkses(payload) {
    assertSupabase();
    
    // Use the entity helper which handles JSONB merge safely
    const entity = createSupabaseEntity('AkunAkses');
    
    const { action, id, ...data } = payload;
    
    switch (action) {
        case 'list': {
            const items = await entity.list('created_at', 500);
            // Normalize grup_kode in all returned items
            const normalizedItems = items.map(item => ({
                ...item,
                grup_kode: normalizeGroupKode(item.grup_kode),
                grup_nama: item.grup_nama || getGroupNamaFromKode(item.grup_kode),
                hierarki: item.hierarki || getHierarkiFromKode(item.grup_kode),
            }));
            return { items: normalizedItems, is_super_admin: false };
        }
        case 'create': {
            // Normalize grup_kode before create
            const createData = {
                ...data,
                grup_kode: normalizeGroupKode(data.grup_kode),
                grup_nama: data.grup_nama || getGroupNamaFromKode(data.grup_kode),
                hierarki: data.hierarki || getHierarkiFromKode(data.grup_kode),
            };
            const created = await entity.create(createData);
            return created;
        }
        case 'update': {
            // Normalize grup_kode in update payload
            const updateData = { ...data };
            if (updateData.grup_kode) {
                updateData.grup_kode = normalizeGroupKode(updateData.grup_kode);
                updateData.grup_nama = getGroupNamaFromKode(updateData.grup_kode);
                updateData.hierarki = getHierarkiFromKode(updateData.grup_kode);
            }
            const updated = await entity.update(id, updateData);
            return updated;
        }
        case 'save': {
            // Normalize grup_kode in save payload
            const saveData = { ...data };
            if (saveData.grup_kode) {
                saveData.grup_kode = normalizeGroupKode(saveData.grup_kode);
                saveData.grup_nama = getGroupNamaFromKode(saveData.grup_kode);
                saveData.hierarki = getHierarkiFromKode(saveData.grup_kode);
            }
            if (id) {
                const updated = await entity.update(id, saveData);
                return updated;
            } else {
                const created = await entity.create(saveData);
                return created;
            }
        }
        case 'set-group': {
            // Update grup_kode, grup_nama, and hierarki using JSONB merge
            const grupKode = normalizeGroupKode(data.grup_kode);
            const updatePayload = {
                grup_kode: grupKode,
                grup_nama: getGroupNamaFromKode(grupKode),
                hierarki: getHierarkiFromKode(grupKode),
            };
            const updated = await entity.update(id, updatePayload);
            return updated;
        }
        case 'delete': {
            await entity.delete(id);
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

// Implementasi submitAspirasi untuk Supabase
// RPC function calls for Penduduk audit filters
export async function fetchPendudukAudit(p_audit_type, p_search, p_status_kependudukan, p_rw, p_limit, p_offset) {
    assertSupabase();
    // Ensure p_limit and p_offset are proper Numbers (not undefined/0 causing type mismatch)
    const limitVal = p_limit != null ? Number(p_limit) : 10000;
    const offsetVal = p_offset != null ? Number(p_offset) : 0;
    
    const { data, error } = await supabase.rpc('filter_penduduk_audit', {
        p_audit_type,
        p_search,
        p_status_kependudukan,
        p_rw,
        p_limit: limitVal,
        p_offset: offsetVal,
    });
    if (error) {
        console.error('[fetchPendudukAudit] RPC error:', { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint });
        throw error;
    }
    // Transform from Supabase format ({id, data: JSONB, created_at, updated_at}) to flat CSV format
    const numericFields = ['listrik', 'rt', 'rw', 'anggaran', 'realisasi', 'tahun_anggaran', 'persentase_progress', 'estimasi_anggaran', 'urutan', 'jumlah_penduduk'];
    const transformed = transformRows(data || [], numericFields);
    return transformed;
}

export async function countPendudukAudit(p_audit_type, p_search, p_status_kependudukan, p_rw) {
    assertSupabase();
    
    const { data, error } = await supabase.rpc('count_penduduk_audit', {
        p_audit_type,
        p_search,
        p_status_kependudukan,
        p_rw,
    });
    if (error) {
        console.error('[countPendudukAudit] RPC error:', { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint });
        throw error;
    }
    return data || 0;
}

// Fetch all KK members by no_kk (no pagination, full data)
export async function fetchPendudukByNoKk(noKk) {
    assertSupabase();
    if (!noKk || noKk === '-') return [];
    
    const cleanedNoKk = String(noKk).trim();
    
    // Use BTRIM and exact match to handle whitespace issues
    const { data, error } = await supabase
        .from('Penduduk')
        .select('*')
        .filter('data->>no_kk', 'eq', cleanedNoKk)
        .order('data->>status_keluarga', { ascending: true })
        .limit(100);
    
    if (error) {
        console.error('[fetchPendudukByNoKk] Supabase error:', { code: error?.code, message: error?.message, details: error?.details, hint: error?.hint });
        throw error;
    }
    
    // Transform from Supabase format to flat CSV format
    const numericFields = ['listrik', 'rt', 'rw', 'anggaran', 'realisasi', 'tahun_anggaran', 'persentase_progress', 'estimasi_anggaran', 'urutan', 'jumlah_penduduk'];
    const transformed = transformRows(data || [], numericFields);
    
    // Sort by family hierarchy
    const KELUARGA_ORDER = [
        'Kepala Keluarga',
        'Istri',
        'Anak',
        'Menantu',
        'Cucu',
        'Orang Tua',
        'Mertua',
        'Famili Lain',
        'Lainnya'
    ];
    
    return [...transformed].sort((a, b) => {
        const idxA = KELUARGA_ORDER.indexOf(a.status_keluarga || 'Lainnya');
        const idxB = KELUARGA_ORDER.indexOf(b.status_keluarga || 'Lainnya');
        return idxA - idxB;
    });
}

export async function supabaseSubmitAspirasi(params) {
    assertSupabase();
    
    const { nik, nama, no_telepon, kategori, judul, isi } = params;
    const fotoFile = params.foto_bukti; // File object dari form (opsional)
    
    // Normalisasi input
    const nikTrim = String(nik || '').trim();
    const namaTrim = String(nama || '').trim();
    const noTelepon = String(no_telepon || '').trim();
    const kategoriTrim = String(kategori || '').trim();
    const judulTrim = String(judul || '').trim();
    const isiTrim = String(isi || '').trim();
    
    // Validasi input dasar
    if (!/^\d{16}$/.test(nikTrim)) {
        return { error: 'NIK harus terdiri dari 16 digit angka.' };
    }
    if (!namaTrim || namaTrim.length < 3) {
        return { error: 'Nama lengkap wajib diisi minimal 3 karakter.' };
    }
    if (!/^[0-9+\-\s]{8,20}$/.test(noTelepon)) {
        return { error: 'Nomor WhatsApp tidak valid.' };
    }
    if (!['Pengaduan', 'Aspirasi', 'Permintaan Informasi'].includes(kategoriTrim)) {
        return { error: 'Kategori aspirasi tidak valid.' };
    }
    if (!judulTrim || judulTrim.length < 5) {
        return { error: 'Judul minimal 5 karakter.' };
    }
    if (!isiTrim || isiTrim.length < 20) {
        return { error: 'Uraian aspirasi minimal 20 karakter.' };
    }
    
    // Cek data penduduk
    const { data: pendudukRows, error: pendudukError } = await supabase
        .from('Penduduk')
        .select('*')
        .eq('data->>nik', nikTrim)
        .single();
    
    if (pendudukError || !pendudukRows) {
        return { error: 'NIK tidak terdaftar dalam data penduduk Desa Tagog Apu.' };
    }
    
    const warga = transformRow(pendudukRows);
    
    // Cek status kependudukan
    if (warga.status_kependudukan && !['Aktif', 'Perantau'].includes(warga.status_kependudukan)) {
        return { error: `NIK tercatat dengan status "${warga.status_kependudukan}" sehingga tidak dapat menggunakan saluran aspirasi.` };
    }
    
    // Normalisasi nama untuk perbandingan
    const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z]/g, '');
    const namaInput = normalize(namaTrim);
    const namaResmi = normalize(warga.nama_lengkap);
    
    if (!namaInput || !namaResmi || !(namaInput === namaResmi || namaResmi.includes(namaInput) || namaInput.includes(namaResmi))) {
        return { error: 'Nama tidak sesuai dengan data NIK pada data penduduk desa.' };
    }
    
    // Buat nomor tiket
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const nomorTiket = `ASP-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    
    // Buat alamat dari data penduduk
    const alamat = [warga.alamat, warga.rt ? `RT ${warga.rt}` : '', warga.rw ? `RW ${warga.rw}` : '']
        .filter(Boolean)
        .join(' ');
    
    // Upload foto bukti jika ada
    let fotoUrl = null;
    if (fotoFile) {
        try {
            fotoUrl = await uploadAspirasiBuktiPhoto(fotoFile, nomorTiket);
            console.log('Foto bukti berhasil di-upload:', fotoUrl);
        } catch (uploadErr) {
            console.error('Gagal mengunggah foto bukti:', uploadErr);
            return { error: `Gagal mengunggah foto bukti: ${uploadErr.message || 'Kesalahan tidak diketahui'}` };
        }
    }
    
    // Simpan aspirasi
    const recordPayload = {
        id: crypto.randomUUID(),
        data: {
            nomor_tiket: nomorTiket,
            nama: warga.nama_lengkap || namaTrim,
            nik: nikTrim,
            no_telepon: noTelepon,
            kategori: kategoriTrim,
            judul: judulTrim,
            isi: isiTrim,
            alamat,
            ...(fotoUrl && { foto_bukti: fotoUrl }),
            status: 'Baru',
            tanggal_diterima: now.toISOString(),
            created_date: now.toISOString(),
            updated_date: now.toISOString()
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString()
    };

    const { data: aspirasiData, error } = await supabase
        .from('Aspirasi')
        .insert(recordPayload)
        .select()
        .single();

    if (error || !aspirasiData) {
        const errorDetail = error ? {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        } : 'Tidak ada data yang dikembalikan';
        console.error('Gagal menyimpan aspirasi:', errorDetail);
        return { error: `Gagal menyimpan aspirasi: ${errorDetail.message || 'kesalahan tidak diketahui'}${errorDetail.details ? ` (${errorDetail.details})` : ''}${errorDetail.hint ? ` - ${errorDetail.hint}` : ''}` };
    }

    const record = transformRow(aspirasiData);

    if (!record) {
        return { error: 'Data aspirasi tidak valid.' };
    }

    // Kirim notifikasi WhatsApp status Diterima (jika ada nomor telepon)
    if (record.no_telepon) {
        try {
            console.log('[submitAspirasi] Notifikasi WhatsApp status Diterima siap dikirim ke:', record.no_telepon);
        } catch (waErr) {
            console.error('Gagal memproses notifikasi WhatsApp:', waErr);
        }
    }

    return { success: true, data: record };
}