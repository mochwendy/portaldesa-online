import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
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
const supabase = createClient(env.VITE_SUPABASE_URL.replace(/\/rest\/v1\/?$/, ''), env.VITE_SUPABASE_ANON_KEY, {
    // Fix for Node.js 20 without native WebSocket support
    db: { schema: 'public' },
    realtime: { params: { eventsPerSecond: 10 }, transport: ws },
    auth: { persistSession: false, autoRefreshToken: false }
});

async function listBuckets() {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error listing buckets:', error);
        } else {
            console.log('Buckets:', data.map(b => ({ name: b.name, public: b.public })));
            
            // Check if 'realisasi' bucket exists
            const realisasiBucket = data.find(b => b.name === 'realisasi');
            if (realisasiBucket) {
                console.log('Realisasi bucket exists:', realisasiBucket);
                // Check public URL for a test file
                const { data: urlData } = supabase.storage.from('realisasi').getPublicUrl('test');
                console.log('Public URL for test:', urlData.publicUrl);
            } else {
                console.log('Realisasi bucket NOT FOUND');
            }
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

listBuckets();