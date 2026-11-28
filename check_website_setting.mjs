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

async function checkWebsiteSetting() {
    const { data, error } = await supabase.from('WebsiteSetting').select('*').limit(20);
    if (error) {
        console.error('Error:', error);
        return;
    }
    data.forEach((row, i) => {
        console.log(`\n--- Row ${i+1} ---`);
        console.log('id:', row.id);
        console.log('data keys:', row.data ? Object.keys(row.data) : 'null');
        if (row.data) {
            console.log('logo_url:', row.data.logo_url);
            console.log('Full data:', JSON.stringify(row.data, null, 2));
        }
    });
}

checkWebsiteSetting();