-- ============================================================
-- DIAGNOSIS QUERIES - Run these in Supabase SQL Editor
-- ============================================================

-- 1. Check if functions exist
SELECT funcname, prosrc 
FROM pg_proc 
WHERE funcname IN ('filter_penduduk_audit', 'count_penduduk_audit')
ORDER BY funcname;

-- 2. Check table structure and sample data
SELECT 
    id,
    data->>'nik' as nik,
    data->>'no_kk' as no_kk,
    data->>'nama_lengkap' as nama,
    data->>'tanggal_lahir' as tgl_lahir,
    data->>'pendidikan' as pendidikan,
    data->>'pekerjaan' as pekerjaan,
    data->>'kelompok_usia' as kelompok_usia,
    data->>'rw' as rw,
    data->>'alamat' as alamat,
    data->>'no_wa' as no_wa,
    data->>'status_kependudukan' as status
FROM "Penduduk"
LIMIT 10;

-- 3. Count total rows
SELECT COUNT(*) as total FROM "Penduduk";

-- 4. Test KK Kosong condition manually
SELECT COUNT(*) as kk_kosong_count
FROM "Penduduk"
WHERE 
    data->>'no_kk' = '' 
    OR data->>'no_kk' IS NULL 
    OR data->>'no_kk' = '-' 
    OR data->>'no_kk' = '–';

-- 5. Test NIK Invalid condition manually
SELECT COUNT(*) as nik_invalid_count
FROM "Penduduk"
WHERE NOT (data->>'nik' ~ '^\d{16}$');

-- 6. Test Demografi Kurang condition manually
SELECT COUNT(*) as demografi_kurang_count
FROM "Penduduk"
WHERE 
    data->>'tanggal_lahir' = '' OR data->>'tanggal_lahir' IS NULL OR data->>'tanggal_lahir' = '-' OR data->>'tanggal_lahir' = '–' OR
    data->>'pendidikan' = '' OR data->>'pendidikan' IS NULL OR data->>'pendidikan' = '-' OR data->>'pendidikan' = '–' OR
    data->>'pekerjaan' = '' OR data->>'pekerjaan' IS NULL OR data->>'pekerjaan' = '-' OR data->>'pekerjaan' = '–' OR
    data->>'kelompok_usia' = 'Tidak Diketahui' OR
    data->>'rw' = '' OR data->>'rw' IS NULL OR data->>'rw' = '-' OR data->>'rw' = '–' OR
    data->>'alamat' = '' OR data->>'alamat' IS NULL OR data->>'alamat' = '-' OR data->>'alamat' = '–';

-- 7. Test Has WA condition manually
SELECT COUNT(*) as has_wa_count
FROM "Penduduk"
WHERE NOT (
    data->>'no_wa' = '' 
    OR data->>'no_wa' IS NULL 
    OR data->>'no_wa' = '-' 
    OR data->>'no_wa' = '–'
);

-- 8. Test the actual RPC function (if created)
-- SELECT * FROM filter_penduduk_audit('kk_kosong', NULL, NULL, NULL, 10, 0);
-- SELECT count_penduduk_audit('kk_kosong', NULL, NULL, NULL);

-- 9. Check grants
SELECT 
    routine_name, 
    grantee, 
    privilege_type
FROM information_schema.routine_privileges
WHERE routine_name IN ('filter_penduduk_audit', 'count_penduduk_audit')
ORDER BY routine_name, grantee;

-- 10. If functions don't exist, run the CREATE FUNCTION statements from final_rpc_fixes.sql