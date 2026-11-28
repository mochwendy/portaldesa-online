import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
    const envPath = resolve(__dirname, '.env.local');
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

async function check() {
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Buckets:', data.map(b => b.name));
        // Check if 'realisasi' bucket exists
        const realisasiBucket = data.find(b => b.name === 'realisasi');
        if (realisasiBucket) {
            console.log('Realisasi bucket exists:', realisasiBucket);
            // Check public URL for a test file
            const { data: urlData } = supabase.storage.from('realisasi').getPublicUrl('test');
            console.log('Public URL for test:', urlData.publicUrl);
        } else {
            console.log('Realisasi bucket NOT FOUND');
            // Check if aspirasi-bukti exists as alternative
            const aspirasiBucket = data.find(b => b.name === 'aspirasi-bukti');
            if (aspirasiBucket) {
                console.log('aspirasi-bukti bucket exists:', aspirasiBucket);
            }
        }
    }
}
check();