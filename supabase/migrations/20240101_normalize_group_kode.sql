-- SQL migration: Normalize legacy ADMDES group code to canonical ADM in Supabase JSONB
-- Run this once via: supabase db exec < 20240101_normalize_group_kode.sql

-- 1. Update AkunAkses JSONB data column - convert ADMDES -> ADM and clean nama
UPDATE akun_akses
SET data = jsonb_set(
    data,
    '{grup_kode}',
    CASE
      WHEN (data->>'grup_kode') IS NULL THEN '""'
      WHEN (data->>'grup_kode') = 'ADMDES' THEN '"ADM"'
      WHEN (data->>'grup_kode') LIKE '%ADMDES%' THEN replace((data->>'grup_kode'), 'ADMDES', 'ADM')
      ELSE (data->>'grup_kode')
    END::text,
    true
  )
WHERE (data->>'grup_kode') IS NOT NULL
  AND ((data->>'grup_kode') = 'ADMDES'
       OR (data->>'grup_kode') LIKE '%ADMDES%');

-- 2. Fix grup_nama inside JSONB - replace 'Admin Desa (ADMDES)' -> 'Admin Desa'
UPDATE akun_akses
SET data = jsonb_set(
    data,
    '{grup_nama}',
    CASE
      WHEN (data->>'grup_nama') LIKE '%(ADMDES)%' THEN replace((data->>'grup_nama'), '(ADMDES)', '')
      WHEN (data->>'grup_nama') LIKE '%Admin Desa (ADMDES)%' THEN '"Admin Desa"'
      ELSE (data->>'grup_nama')
    END::text,
    true
  )
WHERE (data->>'grup_nama') IS NOT NULL
  AND ((data->>'grup_nama') LIKE '%(ADMDES)%'
       OR (data->>'grup_nama') LIKE '%Admin Desa (ADMDES)%');

-- 3. Update UserGroup table - normalize kode and fix nama
UPDATE user_group
SET kode = 'ADM',
    nama = 'Admin Desa'
WHERE kode = 'ADMDES';

-- 4. Also normalize any KADES to ADM if needed (optional)
UPDATE user_group
SET kode = 'ADM',
    nama = 'Admin Desa'
WHERE kode = 'KADES';

-- 5. Run VACUUM to reclaim storage after mass updates
VACUUM ANALYZE akun_akses, user_group;

-- Summary
SELECT 'Normalisasi selesai:' AS info;
SELECT COUNT(*) AS total_akun, 
       COUNT(CASE WHEN (data->>'grup_kode') = 'ADMDES' THEN 1 END) AS still_admdes
FROM akun_akses;
SELECT COUNT(*) AS total_groups,
       COUNT(CASE WHEN kode = 'ADMDES' THEN 1 END) AS still_admdes_groups
FROM user_group;