-- Supabase Schema for SIMDESTA v2
-- Generated tables for all entities with uniform structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create table with standard structure
-- Usage: SELECT create_entity_table('table_name');
CREATE OR REPLACE FUNCTION create_entity_table(table_name TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE FORMAT('
        CREATE TABLE IF NOT EXISTS %I (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL DEFAULT ''{}''::JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ', table_name);

    -- Enable RLS
    EXECUTE FORMAT('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_name);

    -- Create policies for public read/write (adjust as needed for production)
    EXECUTE FORMAT('
        DROP POLICY IF EXISTS "Public read access" ON %I;
        CREATE POLICY "Public read access" ON %I
            FOR SELECT USING (true);
    ', table_name, table_name);

    EXECUTE FORMAT('
        DROP POLICY IF EXISTS "Public insert access" ON %I;
        CREATE POLICY "Public insert access" ON %I
            FOR INSERT WITH CHECK (true);
    ', table_name, table_name);

    EXECUTE FORMAT('
        DROP POLICY IF EXISTS "Public update access" ON %I;
        CREATE POLICY "Public update access" ON %I
            FOR UPDATE USING (true) WITH CHECK (true);
    ', table_name, table_name);

    EXECUTE FORMAT('
        DROP POLICY IF EXISTS "Public delete access" ON %I;
        CREATE POLICY "Public delete access" ON %I
            FOR DELETE USING (true);
    ', table_name, table_name);

    -- Create trigger for updated_at
    EXECUTE FORMAT('
        DROP TRIGGER IF EXISTS update_updated_at ON %I;
        CREATE TRIGGER update_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', table_name, table_name);

    -- Add to realtime publication
    EXECUTE FORMAT('
        ALTER PUBLICATION supabase_realtime ADD TABLE %I;
    ', table_name);
END;
$$ LANGUAGE plpgsql;

-- Create tables for all entities
SELECT create_entity_table('Penduduk');
SELECT create_entity_table('Aspirasi');
SELECT create_entity_table('Berita');
SELECT create_entity_table('Pengumuman');
SELECT create_entity_table('PerangkatDesa');
SELECT create_entity_table('ProfilDesa');
SELECT create_entity_table('APBDes');
SELECT create_entity_table('RealisasiPembangunan');
SELECT create_entity_table('UsulanPembangunan');
SELECT create_entity_table('DokumenPembangunan');
SELECT create_entity_table('SuratKeterangan');
SELECT create_entity_table('UMKM');
SELECT create_entity_table('MenuPortal');
SELECT create_entity_table('AkunAkses');
SELECT create_entity_table('UserGroup');
SELECT create_entity_table('User');
SELECT create_entity_table('WebsiteSetting');
SELECT create_entity_table('KontakDarurat');
SELECT create_entity_table('app_settings');

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_penduduk_data ON "Penduduk" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_aspirasi_data ON "Aspirasi" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_berita_data ON "Berita" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_pengumuman_data ON "Pengumuman" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_perangkat_desa_data ON "PerangkatDesa" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_profil_desa_data ON "ProfilDesa" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_apbdes_data ON "APBDes" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_realisasi_pembangunan_data ON "RealisasiPembangunan" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_usulan_pembangunan_data ON "UsulanPembangunan" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_dokumen_pembangunan_data ON "DokumenPembangunan" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_surat_keterangan_data ON "SuratKeterangan" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_umkm_data ON "UMKM" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_menu_portal_data ON "MenuPortal" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_akun_akses_data ON "AkunAkses" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_user_group_data ON "UserGroup" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_user_data ON "User" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_website_setting_data ON "WebsiteSetting" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_kontak_darurat_data ON "KontakDarurat" USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_app_settings_data ON "app_settings" USING GIN (data);

-- Add foto_bukti column to Aspirasi table for storing photo evidence URLs
ALTER TABLE "Aspirasi" ADD COLUMN IF NOT EXISTS foto_bukti TEXT;

-- Verify tables and publication
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'Penduduk', 'Aspirasi', 'Berita', 'Pengumuman', 'PerangkatDesa',
        'ProfilDesa', 'APBDes', 'RealisasiPembangunan', 'UsulanPembangunan',
        'DokumenPembangunan', 'SuratKeterangan', 'UMKM', 'MenuPortal',
        'AkunAkses', 'UserGroup', 'User', 'WebsiteSetting', 'KontakDarurat',
        'app_settings'
    )
ORDER BY tablename;

-- Verify realtime publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- RPC Functions for Penduduk Audit Filters
-- These functions handle complex JSONB queries that would cause PostgREST 400 errors

-- Function to filter Penduduk by audit criteria
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
    
    -- Build audit condition based on type
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
            -- Data Demografi Belum Lengkap: any demographic field empty/null/dash/en-dash or usia unknown
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
            -- No audit filter
            NULL;
    END CASE;
    
    -- Build final query
    v_query := 'SELECT id, data, created_at, updated_at FROM "Penduduk"';
    
    IF array_length(v_where_conditions, 1) > 0 THEN
        v_query := v_query || ' WHERE ' || array_to_string(v_where_conditions, ' AND ');
    END IF;
    
    v_query := v_query || ' ORDER BY data->>''nama_lengkap'' ASC LIMIT ' || p_limit || ' OFFSET ' || p_offset;
    
    RETURN QUERY EXECUTE v_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count Penduduk by audit criteria
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