-- SQL untuk menambahkan constraint dan index pada tabel "Penduduk" di Supabase
-- Jalankan di Supabase SQL Editor

-- 1. Enable pg_trgm extension untuk pencarian trigram (ILIKE dengan wildcard di awal)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Index GIN trigram untuk mempercepat pencarian nama_lengkap, nik, no_kk
-- Catatan: Kolom data disimpan sebagai JSONB, jadi kita buat index expression
CREATE INDEX IF NOT EXISTS idx_penduduk_nama_trgm 
  ON "Penduduk" USING GIN ((data->>'nama_lengkap') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_penduduk_nik_trgm 
  ON "Penduduk" USING GIN ((data->>'nik') gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_penduduk_no_kk_trgm 
  ON "Penduduk" USING GIN ((data->>'no_kk') gin_trgm_ops);

-- 3. Index B-tree untuk filter exact match (RW, status_kependudukan)
CREATE INDEX IF NOT EXISTS idx_penduduk_rw 
  ON "Penduduk" ((data->>'rw'));

CREATE INDEX IF NOT EXISTS idx_penduduk_status_kependudukan 
  ON "Penduduk" ((data->>'status_kependudukan'));

-- 4. Composite index untuk kombinasi filter umum
CREATE INDEX IF NOT EXISTS idx_penduduk_rw_status 
  ON "Penduduk" ((data->>'rw'), (data->>'status_kependudukan'));

-- 5. UNIQUE constraint pada NIK (mencegah duplikat di level database)
-- Catatan: Hanya berlaku untuk NIK yang tidak null dan tidak kosong
CREATE UNIQUE INDEX IF NOT EXISTS uq_penduduk_nik 
  ON "Penduduk" ((data->>'nik')) 
  WHERE (data->>'nik') IS NOT NULL AND (data->>'nik') <> '';

-- 6. CHECK constraint validasi format NIK (16 digit angka)
-- Catatan: Supabase/PostgreSQL tidak support CHECK constraint pada JSONB field langsung dengan mudah
-- Alternatif: Gunakan trigger function atau application-level validation (sudah diimplementasikan di frontend)

-- 7. Function untuk validasi NIK format (optional - untuk trigger)
CREATE OR REPLACE FUNCTION validate_nik_format()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.data ? 'nik' AND NEW.data->>'nik' IS NOT NULL AND NEW.data->>'nik' <> '' THEN
    IF NOT (NEW.data->>'nik') ~ '^\d{16}$' THEN
      RAISE EXCEPTION 'NIK harus terdiri dari 16 digit angka';
    END IF;
  END IF;
  
  IF NEW.data ? 'no_kk' AND NEW.data->>'no_kk' IS NOT NULL AND NEW.data->>'no_kk' <> '' THEN
    IF NOT (NEW.data->>'no_kk') ~ '^\d{16}$' THEN
      RAISE EXCEPTION 'No. KK harus terdiri dari 16 digit angka';
    END IF;
  END IF;
  
  -- Auto-hitung kelompok_usia dari tanggal_lahir jika kosong
  IF NEW.data ? 'tanggal_lahir' AND NEW.data->>'tanggal_lahir' IS NOT NULL AND NEW.data->>'tanggal_lahir' <> '' THEN
    IF NOT (NEW.data ? 'kelompok_usia') OR NEW.data->>'kelompok_usia' IS NULL OR NEW.data->>'kelompok_usia' = '' THEN
      -- Function hitung usia sederhana
      DECLARE
        birth_date DATE := (NEW.data->>'tanggal_lahir')::date;
        age_years INT;
      BEGIN
        age_years := DATE_PART('year', AGE(CURRENT_DATE, birth_date));
        IF age_years <= 5 THEN
          NEW.data := NEW.data || '{"kelompok_usia": "0-5 Tahun"}'::jsonb;
        ELSIF age_years <= 14 THEN
          NEW.data := NEW.data || '{"kelompok_usia": "6-14 Tahun"}'::jsonb;
        ELSIF age_years <= 24 THEN
          NEW.data := NEW.data || '{"kelompok_usia": "15-24 Tahun"}'::jsonb;
        ELSIF age_years <= 44 THEN
          NEW.data := NEW.data || '{"kelompok_usia": "25-44 Tahun"}'::jsonb;
        ELSIF age_years <= 64 THEN
          NEW.data := NEW.data || '{"kelompok_usia": "45-64 Tahun"}'::jsonb;
        ELSE
          NEW.data := NEW.data || '{"kelompok_usia": "65+ Tahun"}'::jsonb;
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger untuk validasi otomatis (optional - uncomment jika ingin enable)
-- DROP TRIGGER IF EXISTS trigger_validate_penduduk ON "Penduduk";
-- CREATE TRIGGER trigger_validate_penduduk
--   BEFORE INSERT OR UPDATE ON "Penduduk"
--   FOR EACH ROW EXECUTE FUNCTION validate_nik_format();

-- 9. Index untuk pencarian no_wa (opsional)
CREATE INDEX IF NOT EXISTS idx_penduduk_no_wa 
  ON "Penduduk" ((data->>'no_wa'));

-- 10. Statistik tabel untuk query planner
ANALYZE "Penduduk";

-- Verifikasi index yang dibuat
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'Penduduk'
ORDER BY indexname;