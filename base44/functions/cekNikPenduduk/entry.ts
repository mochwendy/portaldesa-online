import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { cariWargaByNik, normalisasiNik, PESAN_NIK_TIDAK_TERDAFTAR } from '../../shared/pendudukNik.ts';

// Validasi NIK otomatis pada form permohonan surat portal (dapat diakses tanpa login).
export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Metode tidak diizinkan' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const nik = normalisasiNik(body.nik);

    if (nik.length !== 16) {
      return Response.json({ error: 'NIK harus terdiri dari 16 digit angka.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const warga = await cariWargaByNik(base44, nik);

    if (!warga) {
      return Response.json({ terdaftar: false, pesan: PESAN_NIK_TIDAK_TERDAFTAR });
    }

    return Response.json({
      terdaftar: true,
      nama: warga.nama_lengkap || '',
      status_kependudukan: warga.status_kependudukan || 'Aktif',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}