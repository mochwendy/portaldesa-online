-- 6. Demografi Kurang condition manually
SELECT COUNT(*) as demografi_kurang_count
FROM "Penduduk"
WHERE 
    data->>'tanggal_lahir' = '' OR data->>'tanggal_lahir' IS NULL OR data->>'tanggal_lahir' = '-' OR data->>'tanggal_lahir' = '–' OR
    data->>'pendidikan' = '' OR data->>'pendidikan' IS NULL OR data->>'pendidikan' = '-' OR data->>'pendidikan' = '–' OR
    data->>'pekerjaan' = '' OR data->>'pekerjaan' IS NULL OR data->>'pekerjaan' = '-' OR data->>'pekerjaan' = '–' OR
    data->>'kelompok_usia' = 'Tidak Diketahui' OR
    data->>'rw' = '' OR data->>'rw' IS NULL OR data->>'rw' = '-' OR data->>'rw' = '–' OR
    data->>'alamat' = '' OR data->>'alamat' IS NULL OR data->>'alamat' = '-' OR data->>'alamat' = '–';

-- 7. Has WA condition manually
SELECT COUNT(*) as has_wa_count
FROM "Penduduk"
WHERE NOT (
    data->>'no_wa' = '' 
    OR data->>'no_wa' IS NULL 
    OR data->>'no_wa' = '-' 
    OR data->>'no_wa' = '–'
);