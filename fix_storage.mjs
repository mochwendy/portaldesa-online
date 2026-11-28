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

async function ensureBuckets() {
    const buckets = ['surat-pdf', 'aspirasi-bukti'];
    
    for (const name of buckets) {
        console.log(`Checking bucket: ${name}...`);
        const { data, error } = await supabase.storage.getBucket(name);
        
        if (error) {
            console.log(`Bucket ${name} not found or inaccessible: ${error.message}`);
            console.log(`Attempting to create bucket ${name}...`);
            const { error: createError } = await supabase.storage.createBucket(name, {
                public: true // Make them public for easier access for now
            });
            if (createError) {
                console.error(`FAILED to create bucket ${name}:`, createError);
                console.log('IMPORTANT: Please create this bucket manually in Supabase Dashboard -> Storage');
            } else {
                console.log(`Successfully created bucket: ${name}`);
            }
        } else {
            console.log(`Bucket ${name} already exists.`);
        }
    }
}

ensureBuckets();