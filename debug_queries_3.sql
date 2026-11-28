-- 7. Has WA condition manually
SELECT COUNT(*) as has_wa_count
FROM "Penduduk"
WHERE NOT (
    data->>'no_wa' = '' 
    OR data->>'no_wa' IS NULL 
    OR data->>'no_wa' = '-' 
    OR data->>'no_wa' = '–'
);