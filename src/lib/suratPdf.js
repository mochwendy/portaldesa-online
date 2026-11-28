// Membuat berkas PDF surat dari data tersimpan, untuk dilampirkan pada notifikasi WhatsApp.
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { buildLetterHtml } from '@/lib/suratDocument';
import { buatQrSurat } from '@/lib/suratVerifikasi';
import { loadKop } from '@/lib/suratKop';
import { findTemplate, buildVars, fillTemplate } from '@/lib/suratTemplates';
import { safeJsonParse } from '@/utils';
import { createSupabaseEntity } from '@/api/supabaseAdapter';

const PAGE_W = 215;
const PAGE_H = 330;
const MARGIN_X = 12;
const MARGIN_TOP = 12;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const CONTENT_H = PAGE_H - MARGIN_TOP - 12;

const namaDesaBersih = (profil) => (profil?.nama_desa || '').replace(/^desa\s+/i, '').toUpperCase();

const judulJabatan = (jabatan) =>
  !jabatan ? '' : jabatan === 'Kepala Desa' ? 'KEPALA DESA' : `${jabatan} DESA`;

async function isiSurat(record, profil) {
  if (record.isi_surat) return record.isi_surat;
  const template = findTemplate(record.jenis_surat);
  if (!template) return '';
  const pendudukEntity = createSupabaseEntity('Penduduk');
  const penduduk = (await pendudukEntity.filter({ nik: record.nik_pemohon })).items[0];
  if (!penduduk) return '';
  const extras = safeJsonParse(record.extras_json, {});
  return fillTemplate(template.body, buildVars(penduduk, profil, extras, record.keperluan || ''));
}

async function htmlKePdfBlob(html) {
  const wadah = document.createElement('div');
  const lebarPx = 660;
  const tinggiPx = Math.round((lebarPx * CONTENT_H) / CONTENT_W);
  wadah.style.cssText = `position:fixed;left:-10000px;top:0;width:${lebarPx}px;min-height:${tinggiPx}px;box-sizing:border-box;background:#ffffff;display:flex;flex-direction:column`;
  wadah.innerHTML = html;
  const hal = wadah.querySelector('.letter-page');
  if (hal) hal.style.cssText += ';display:flex;flex-direction:column;flex:1 1 auto';
  const ft = wadah.querySelector('.letter-footer');
  if (ft) ft.style.marginTop = 'auto';
  document.body.appendChild(wadah);
  try {
    const canvas = await html2canvas(wadah, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    const tinggiMm = (canvas.height * CONTENT_W) / canvas.width;
    const gambar = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({ unit: 'mm', format: [PAGE_W, PAGE_H], orientation: 'portrait' });
    for (let geser = 0; geser < tinggiMm; geser += CONTENT_H) {
      if (geser > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');
      pdf.addImage(gambar, 'JPEG', MARGIN_X, MARGIN_TOP - geser, CONTENT_W, tinggiMm);
    }
    return pdf.output('blob');
  } finally {
    wadah.remove();
  }
}

/**
 * Membuat PDF surat lalu mengunggahnya ke Supabase Storage (bucket: surat-pdf).
 * Mengembalikan file_uri; warga mengunduhnya lewat halaman /unduh-surat?kode=...
 */
export async function buatPdfSuratUri(record) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase tidak dikonfigurasi');
  }
  
  const profilEntity = createSupabaseEntity('ProfilDesa');
  const [profil] = await profilEntity.list('-created_date', 1);
  const kop = loadKop(profil);
  const kode = record.kode_verifikasi || '';
  const qr = record.tipe_ttd === 'QR' && kode ? await buatQrSurat(kode) : '';
  
  const perangkatEntity = createSupabaseEntity('PerangkatDesa');
  const perangkatList = await perangkatEntity.list('urutan', 100);
  const perangkat = perangkatList.find((p) => p.id === record.pejabat_id) || null;

  const html = buildLetterHtml({
    kop,
    judul: record.jenis_surat || 'SURAT KETERANGAN',
    nomor: record.nomor_surat || '-',
    isi: await isiSurat(record, profil),
    tanggal: record.tanggal_surat || record.tanggal_selesai || new Date().toISOString().split('T')[0],
    kota: namaDesaBersih(profil),
    ttd: {
      tipe: record.tipe_ttd || 'Manual',
      atasNama: !!record.atas_nama,
      url: '',
      qr,
      kode,
      nama: record.pejabat_nama,
      nip: perangkat?.nip || '',
      jabatan: judulJabatan(record.pejabat_jabatan),
      desa: namaDesaBersih(profil),
    },
  });

  const blob = await htmlKePdfBlob(html);
  const namaBerkas = `${(record.nomor_surat || 'surat').replace(/[^a-zA-Z0-9._-]+/g, '-')}.pdf`;
  const file = new File([blob], namaBerkas, { type: 'application/pdf' });
  
  // Upload to Supabase Storage
  const filePath = `surat/${record.id}/${namaBerkas}`;
  const { data, error } = await supabase.storage
    .from('surat-pdf')
    .upload(filePath, file, { cacheControl: '3600', upsert: true });
  
  if (error) {
    console.error('Error uploading PDF to Supabase Storage:', error);
    throw error;
  }
  
  return data.path;
}