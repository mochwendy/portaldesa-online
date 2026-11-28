-- ============================================================
-- FINAL RPC FUNCTIONS FOR PENDUDUK AUDIT FILTERS
-- Run this entire block in Supabase SQL Editor
-- ============================================================

-- 1. filter_penduduk_audit function
CREATE OR REPLACE FUNCTION filter_penduduk_audit(
    p_audit_type TEXT,
    p_search TEXT DEFAULT NULL,
    p_status_kependudukan TEXT DEFAULT NULL,
    p_rw TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10000,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    data JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
DECLARE
    v_query TEXT;
    v_where_conditions TEXT[] := ARRAY[]::TEXT[];
    v_search_condition TEXT := '';
    v_status_condition TEXT := '';
    v_rw_condition TEXT := '';
    v_audit_condition TEXT := '';
BEGIN
    -- Build search condition
    IF p_search IS NOT NULL AND p_search <> '' THEN
        v_search_condition := format(
            '(data->>''nama_lengkap'' ILIKE %L OR data->>''nik'' ILIKE %L OR data->>''no_kk'' ILIKE %L)',
            '%' || p_search || '%', '%' || p_search || '%', '%' || p_search || '%'
        );
        v_where_conditions := v_where_conditions || v_search_condition;
    END IF;
    
    -- Build status condition
    IF p_status_kependudukan IS NOT NULL AND p_status_kependudukan <> 'all' AND p_status_kependudukan <> '' THEN
        v_status_condition := format('data->>''status_kependudukan'' = %L', p_status_kependudukan);
        v_where_conditions := v_where_conditions || v_status_condition;
    END IF;
    
    -- Build RW condition
    IF p_rw IS NOT NULL AND p_rw <> 'all' AND p_rw <> '' THEN
        v_rw_condition := format('data->>''rw'' = %L', p_rw);
        v_where_conditions := v_where_conditions || v_rw_condition;
    END IF;
    
    -- Build audit condition based on type - SIMPLE NO NESTED OR()
    CASE p_audit_type
        WHEN 'kk_kosong' THEN
            -- No. KK Kosong / Tidak Ada: empty string, null, '-', or '–'
            v_audit_condition := '(data->>''no_kk'' = '''' OR data->>''no_kk'' IS NULL OR data->>''no_kk'' = ''-'' OR data->>''no_kk'' = ''–'')';
            v_where_conditions := v_where_conditions || v_audit_condition;
        WHEN 'nik_invalid' THEN
            -- NIK Bukan 16 Digit: NOT matching exactly 16 digits
            v_audit_condition := 'NOT (data->>''nik'' ~ ''^\\d{16}$'')';
            v_where_conditions := v_where_conditions || v_audit_condition;
        WHEN 'demografi_kurang' THEN
            -- Data Demografi Belum Lengkap: any field empty/null/dash/en-dash or usia unknown
            v_audit_condition := '(
                data->>''tanggal_lahir'' = '''' OR data->>''tanggal_lahir'' IS NULL OR data->>''tanggal_lahir'' = ''-'' OR data->>''tanggal_lahir'' = ''–'' OR
                data->>''pendidikan'' = '''' OR data->>''pendidikan'' IS NULL OR data->>''pendidikan'' = ''-'' OR data->>''pendidikan'' = ''–'' OR
                data->>''pekerjaan'' = '''' OR data->>''pekerjaan'' IS NULL OR data->>''pekerjaan'' = ''-'' OR data->>''pekerjaan'' = ''–'' OR
                data->>''kelompok_usia'' = ''Tidak Diketahui'' OR
                data->>''rw'' = '''' OR data->>''rw'' IS NULL OR data->>''rw'' = ''-'' OR data->>''rw'' = ''–'' OR
                data->>''alamat'' = '''' OR data->>''alamat'' IS NULL OR data->>''alamat'' = ''-'' OR data->>''alamat'' = ''–''
            )';
            v_where_conditions := v_where_conditions || v_audit_condition;
        WHEN 'has_wa' THEN
            -- Memiliki No. WA: no_wa NOT empty, NOT '-', NOT '–'
            v_audit_condition := 'NOT (data->>''no_wa'' = '''' OR data->>''no_wa'' IS NULL OR data->>''no_wa'' = ''-'' OR data->>''no_wa'' = ''–'')';
            v_where_conditions := v_where_conditions || v_audit_condition;
        ELSE
            NULL;
    END CASE;
    
    -- Build final query - single WHERE with AND, NO nested .or()
    v_query := 'SELECT id, data, created_at, updated_at FROM "Penduduk"';
    
    IF array_length(v_where_conditions, 1) > 0 THEN
        v_query := v_query || ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
    END IF;
    
    v_query := v_query || ' ORDER BY data->>''nama_lengkap'' ASC LIMIT ' || p_limit || ' OFFSET ' || p_offset;
    
    RETURN QUERY EXECUTE v_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. count_penduduk_audit function
CREATE OR REPLACE FUNCTION count_penduduk_audit(
    p_audit_type TEXT,
    p_search TEXT DEFAULT NULL,
    p_status_kependudukan TEXT DEFAULT NULL,
    p_rw TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
    v_query TEXT;
    v_where_conditions TEXT[] := ARRAY[]::TEXT[];
    v_search_condition TEXT := '';
    v_status_condition TEXT := '';
    v_rw_condition TEXT := '';
    v_audit_condition TEXT := '';
    v_count BIGINT;
BEGIN
    -- Build search condition
    IF p_search IS NOT NULL AND p_search <> '' THEN
        v_search_condition := format(
            '(data->>''nama_lengkap'' ILIKE %L OR data->>''nik'' ILIKE %L OR data->>''no_kk'' ILIKE %L)',
            '%' || p_search || '%', '%' || p_search || '%', '%' || p_search || '%'
        );
        v_where_conditions := v_where_conditions || v_search_condition;
    END IF;
    
    -- Build status condition
    IF p_status_kependudukan IS NOT NULL AND p_status_kependudukan <> 'all' AND p_status_kependudukan <> '' THEN
        v_status_condition := format('data->>''status_kependudukan'' = %L', p_status_kependudukan);
        v_where_conditions := v_where_conditions || v_status_condition;
    END IF;
    
    -- Build RW condition
    IF p_rw IS NOT NULL AND p_rw <> 'all' AND p_rw <> '' THEN
        v_rw_condition := format('data->>''rw'' = %L', p_rw);
        v_where_conditions := v_where_conditions || v_rw_condition;
    END IF;
    
    -- Build audit condition based on type
    CASE p_audit_type
        WHEN 'kk_kosong' THEN
            v_audit_condition := '(data->>''no_kk'' = '''' OR data->>''no_kk'' IS NULL OR data->>''no_kk'' = ''-'' OR data->>''no_kk'' = ''–'')';
            v_where_conditions := v_where_conditions || v_audit_condition;
        WHEN 'nik_invalid' THEN
            v_audit_condition := 'NOT (data->>''nik'' ~ ''^\\d{16}$'')';
            v_where_conditions := v_where_conditions || v_audit_condition;
        WHEN 'demografi_kurang' THEN
            v_audit_condition := '(
                data->>''tanggal_lahir'' = '''' OR data->>''tanggal_lahir'' IS NULL OR data->>''tanggal_lahir'' = ''-'' OR data->>''tanggal_lahir'' = ''–'' OR
                data->>''pendidikan'' = '''' OR data->>''pendidikan'' IS NULL OR data->>''pendidikan'' = ''-'' OR data->>''pendidikan'' = ''–'' OR
                data->>''pekerjaan'' = '''' OR data->>''pekerjaan'' IS NULL OR data->>''pekerjaan'' = ''-'' OR data->>''pekerjaan'' = ''–'' OR
                data->>''kelompok_usia'' = ''Tidak Diketahui'' OR
                data->>''rw'' = '''' OR data->>''rw'' IS NULL OR data->>''rw'' = ''-'' OR data->>''rw'' = ''–'' OR
                data->>''alamat'' = '''' OR data->>''alamat'' IS NULL OR data->>''alamat'' = ''-'' OR data->>''alamat'' = ''–''
            )';
            v_where_conditions := v_where_conditions || v_audit_condition;
        WHEN 'has_wa' THEN
            v_audit_condition := 'NOT (data->>''no_wa'' = '''' OR data->>''no_wa'' IS NULL OR data->>''no_wa'' = ''-'' OR data->>''no_wa'' = ''–'')';
            v_where_conditions := v_where_conditions || v_audit_condition;
        ELSE
            NULL;
    END CASE;
    
    -- Build final query
    v_query := 'SELECT COUNT(*) FROM "Penduduk"';
    
    IF array_length(v_where_conditions, 1) > 0 THEN
        v_query := v_query || ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
    END IF;
    
    EXECUTE v_query INTO v_count;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION filter_penduduk_audit(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION count_penduduk_audit(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 4. Verify functions are created
SELECT funcname, prosrc FROM pg_proc WHERE funcname IN ('filter_penduduk_audit', 'count_penduduk_audit') ORDER BY funcname;