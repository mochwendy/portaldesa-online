import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
    const envPath = resolve(process.cwd(), '.env.local');
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
const supabase = createClient(env.VITE_SUPABASE_URL.replace(/\/rest\/v1\/?$/, ''), env.VITE_SUPABASE_ANON_KEY);

async function checkTables() {
    const tables = [
        'Penduduk', 'Aspirasi', 'Berita', 'Pengumuman', 'PerangkatDesa',
        'ProfilDesa', 'APBDes', 'RealisasiPembangunan', 'UsulanPembangunan',
        'DokumenPembangunan', 'SuratKeterangan', 'UMKM', 'MenuPortal',
        'AkunAkses', 'UserGroup', 'User', 'WebsiteSetting',
        'KontakDarurat', 'IntegrasiLog', 'app_settings'
    ];
    
    for (const table of tables) {
        try {
            const { data, error, count } = await supabase.from(table).select('id', { count: 'exact', head: true });
            if (error) {
                console.log(`❌ ${table}: ${error.message} (code: ${error.code})`);
            } else {
                console.log(`✅ ${table}: ${count} rows`);
            }
        } catch (err) {
            console.log(`❌ ${table}: Exception - ${err.message}`);
        }
    }
}

checkTables();