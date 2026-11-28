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

async function fixWebsiteSetting() {
    console.log('🔧 Fixing WebsiteSetting table...\n');
    
    // 1. Get the latest valid upload (signed URL)
    const { data: recentUploads } = await supabase
        .from('WebsiteSetting')
        .select('id, data, updated_at')
        .like('data->>logo_url', 'https://bzblzgpuufjasxlnhyof.supabase.co%')
        .order('updated_at', { ascending: false })
        .limit(1);
    
    let logoUrl = '/logos/desa-default.svg'; // fallback
    
    if (recentUploads && recentUploads.length > 0) {
        logoUrl = recentUploads[0].data.logo_url;
        console.log('✅ Found recent signed URL:', logoUrl.substring(0, 80) + '...');
    } else {
        console.log('⚠️ No recent signed URL found, using default');
    }
    
    // 2. Delete ALL rows
    console.log('\n🗑️ Deleting all 12 rows...');
    const { error: delError } = await supabase
        .from('WebsiteSetting')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
    if (delError) {
        console.error('Delete error:', delError);
        return;
    }
    console.log('✅ All rows deleted');
    
    // 3. Create single clean row
    const now = new Date().toISOString();
    const cleanData = {
        id: crypto.randomUUID(),
        data: {
            logo_url: logoUrl,
            warna_primary: '#028374',
            warna_accent: '',
            font_judul: 'Plus Jakarta Sans',
            font_isi: 'Plus Jakarta Sans',
            gaya_hero: 'tengah',
            hero_badge: 'Selamat Datang Di Portal Layanan dan Inovasi Digital',
            hero_judul: '',
            hero_deskripsi: 'Mari Kita  Sambut  Era Baru Pelayanan Publik Pemerintah Desa Tagogapu',
            footer_narasi: 'Portal Layanan dan Inovasi Digital Desa Tagogapu merupakan sistem terintegrasi yang dikembangkan secara mandiri oleh Pemerintah Desa untuk memperkaya dan memperkuat fungsi website resmi desa berbasis SIDEKA-NG. Kehadiran portal ini memperluas cakupan layanan publik daring, transparansi data desa, serta ruang inovasi ekonomi dan partisipasi warga yang lebih responsif terhadap kebutuhan masyarakat lokal.',
            footer_alamat: 'Kp Bojong Suren Tagog Apu, Padalarang, Bandung Barat',
            footer_telepon: '(022) 1234-5678',
            footer_email: 'desatagogapu19@gmail.com',
            footer_links: '[{"label":"Website Desa Tagog Apu","url":"https://tagogapu.desa.id/"},{"label":"Cek Faskes BPJS","url":"https://faskes.bpjs-kesehatan.go.id/aplicares/#/?kdprop=11&jnsppk=P"},{"label":"Cek Bansos","url":"https://cekbansos.kemensos.go.id/"},{"label":"Jaga Desa","url":"https://jagadesa.kejaksaan.go.id/"},{"label":"Perlinsos / Desil","url":"https://perlinsos.kemensos.go.id/login-ikd"}]',
            footer_copyright: '© 2026 SIMDESTA - PEMERINTAH DESA TAGOG APU PADALARANG BANDUNG BARAT',
            is_sample: 'false',
            created_date: now,
            updated_date: now,
            created_by_id: '6abb730e81a0de8b8650b498'
        },
        created_at: now,
        updated_at: now
    };
    
    console.log('\n📝 Inserting clean row...');
    const { data, error } = await supabase
        .from('WebsiteSetting')
        .insert(cleanData)
        .select()
        .single();
    
    if (error) {
        console.error('❌ Insert error:', error);
        return;
    }
    
    console.log('✅ WebsiteSetting fixed!');
    console.log('   ID:', data.id);
    console.log('   logo_url:', data.data.logo_url);
    console.log('   warna_primary:', data.data.warna_primary);
    console.log('\n🎉 Done! Refresh /admin/pengaturan-website');
}

fixWebsiteSetting().catch(console.error);