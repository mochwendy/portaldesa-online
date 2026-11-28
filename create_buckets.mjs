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

async function createBuckets() {
    const buckets = ['surat-pdf', 'aspirasi-bukti', 'realisasi'];
    
    for (const bucketName of buckets) {
        try {
            const { data, error } = await supabase.storage.createBucket(bucketName, {
                public: bucketName === 'aspirasi-bukti' || bucketName === 'realisasi',
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            });
            
            if (error) {
                if (error.statusCode === 409) {
                    console.log(`Bucket '${bucketName}' already exists`);
                } else {
                    console.error(`Error creating bucket '${bucketName}':`, error);
                }
            } else {
                console.log(`Created bucket '${bucketName}' with public=${bucketName === 'aspirasi-bukti' || bucketName === 'realisasi'}`);
            }
        } catch (err) {
            console.error(`Exception creating bucket '${bucketName}':`, err);
        }
    }
}

createBuckets().catch(console.error);