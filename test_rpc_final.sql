-- Test all RPC functions
SELECT count_penduduk_audit('kk_kosong', NULL, NULL, NULL);
SELECT count_penduduk_audit('nik_invalid', NULL, NULL, NULL);
SELECT count_penduduk_audit('demografi_kurang', NULL, NULL, NULL);
SELECT count_penduduk_audit('has_wa', NULL, NULL, NULL);

-- Test filter functions with small limit
SELECT * FROM filter_penduduk_audit('nik_invalid', NULL, NULL, NULL, 5, 0);
SELECT * FROM filter_penduduk_audit('demografi_kurang', NULL, NULL, NULL, 5, 0);
SELECT * FROM filter_penduduk_audit('has_wa', NULL, NULL, NULL, 5, 0);