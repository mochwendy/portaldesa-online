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