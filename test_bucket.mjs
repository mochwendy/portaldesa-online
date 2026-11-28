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

async function testBucket() {
    // Test if surat-pdf bucket exists by trying to list objects
    try {
        const { data, error } = await supabase.storage.from('surat-pdf').list('');
        if (error) {
            console.log('surat-pdf bucket error:', error);
        } else {
            console.log('surat-pdf bucket exists, objects:', data);
        }
    } catch (err) {
        console.log('surat-pdf bucket exception:', err);
    }
    
    // Test if aspirasi-bukti bucket exists
    try {
        const { data, error } = await supabase.storage.from('aspirasi-bukti').list('');
        if (error) {
            console.log('aspirasi-bukti bucket error:', error);
        } else {
            console.log('aspirasi-bukti bucket exists, objects:', data);
        }
    } catch (err) {
        console.log('aspirasi-bukti bucket exception:', err);
    }
}

testBucket();