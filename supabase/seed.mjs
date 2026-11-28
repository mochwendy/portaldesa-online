import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { resolve, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Load environment variables from .env.local
function loadEnv() {
    const envPath = resolve(__dirname, '..', '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
    return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
    process.exit(1);
}

// Remove trailing /rest/v1/ if present for supabase-js client
const baseUrl = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '');

const supabase = createClient(baseUrl, SUPABASE_ANON_KEY, {
    db: {
        schema: 'public'
    },
    global: {
        fetch: fetch,
        headers: {
            'x-client-info': 'simdesta-seed-script'
        }
    },
    auth: {
        persistSession: false,
        autoRefreshToken: false
    },
    realtime: {
        enabled: false
    }
});

// CSV to Table mapping (from base44Client.js entityFileMap)
const CSV_TO_TABLE = {
    'Penduduk_export.csv': 'Penduduk',
    'Aspirasi_export.csv': 'Aspirasi',
    'Berita_export.csv': 'Berita',
    'Pengumuman_export.csv': 'Pengumuman',
    'PerangkatDesa_export.csv': 'PerangkatDesa',
    'ProfilDesa_export.csv': 'ProfilDesa',
    'APBDes_export.csv': 'APBDes',
    'RealisasiPembangunan_export (1).csv': 'RealisasiPembangunan',
    'UsulanPembangunan_export (1).csv': 'UsulanPembangunan',
    'DokumenPembangunan_export.csv': 'DokumenPembangunan',
    'SuratKeterangan_export.csv': 'SuratKeterangan',
    'UMKM_export.csv': 'UMKM',
    'MenuPortal_export.csv': 'MenuPortal',
    'AkunAkses_export.csv': 'AkunAkses',
    'UserGroup_export.csv': 'UserGroup',
    'WebsiteSetting_export.csv': 'WebsiteSetting',
    'KontakDarurat_export.csv': 'KontakDarurat',
    'IntegrasiLog_export.csv': 'IntegrasiLog',
};

// Parse CSV line handling quotes and commas
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(v => v.trim());
}

// Parse CSV content to array of objects
function parseCSV(content) {
    if (!content || typeof content !== 'string') return [];
    const lines = content.split('\n').filter(l => l && l.trim());
    if (lines.length < 2) return [];
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
    });
}

// Generate UUID (compatible with Node.js 20)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Convert CSV row to Supabase record format
function csvRowToRecord(row) {
    // Ensure we have an id
    const id = row.id || generateUUID();
    // Store all fields in data JSONB
    const { id: _, ...data } = row;
    return { id, data };
}

// Batch insert with upsert
async function batchInsert(tableName, records, batchSize = 500) {
    const total = records.length;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < total; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase
            .from(tableName)
            .upsert(batch, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
            console.error(`  Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
            errorCount += batch.length;
        } else {
            successCount += batch.length;
        }

        // Progress indicator
        process.stdout.write(`\r  Progress: ${Math.min(i + batchSize, total)}/${total} rows`);
    }
    console.log(); // New line after progress
    return { successCount, errorCount };
}

// Main seeding function
async function seed() {
    console.log('=== SIMDESTA v2 Supabase Seeding ===');
    console.log(`Supabase URL: ${baseUrl}`);
    console.log('');

    const dataDir = resolve(__dirname, '..', 'public', 'data');
    const files = readdirSync(dataDir);

    // Process CSV files
    for (const file of files) {
        if (extname(file) !== '.csv') continue;

        const tableName = CSV_TO_TABLE[file];
        if (!tableName) {
            console.log(`Skipping ${file} - no table mapping found`);
            continue;
        }

        console.log(`\nProcessing ${file} -> ${tableName}...`);
        const filePath = resolve(dataDir, file);
        const content = readFileSync(filePath, 'utf-8');
        const rows = parseCSV(content);
        console.log(`  Parsed ${rows.length} rows`);

        if (rows.length === 0) {
            console.log('  No data to insert');
            continue;
        }

        const records = rows.map(csvRowToRecord);
        const { successCount, errorCount } = await batchInsert(tableName, records);
        console.log(`  Inserted: ${successCount}, Errors: ${errorCount}`);
    }

    // Process demografi_summary.json -> app_settings
    console.log('\nProcessing demografi_summary.json -> app_settings...');
    const demoPath = resolve(dataDir, 'demografi_summary.json');
    if (readdirSync(dataDir).includes('demografi_summary.json')) {
        const demoContent = readFileSync(demoPath, 'utf-8');
        const demoData = JSON.parse(demoContent);
        const record = {
            id: 'demografi_summary',
            data: demoData
        };
        const { error } = await supabase
            .from('app_settings')
            .upsert(record, { onConflict: 'id' });
        if (error) {
            console.error('  Error inserting demografi_summary:', error.message);
        } else {
            console.log('  Inserted demografi_summary successfully');
        }
    } else {
        console.log('  demografi_summary.json not found, skipping');
    }

    console.log('\n=== Seeding Complete ===');
}

// Run seeding
seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});