import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Endpoint publik: memvalidasi kode QR pada surat yang ditandatangani elektronik via SIMDESTA.
// Hanya mengembalikan data resmi surat (tanpa NIK, nomor telepon, atau isi surat penuh).
const samarkan = (nama = '') =>
  String(nama)
    .split(/\s+/)
    .filter(Boolean)
    .map((kata) => `${kata.charAt(0).toUpperCase()}***`)
    .join(' ');

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const kode = String(body?.kode || '').trim().toUpperCase();

    if (!kode) {
      return Response.json({ valid: false, error: 'Kode verifikasi wajib diisi' }, { status: 400 });
    }

    const rows = await base44.asServiceRole.entities.SuratKeterangan.filter({ kode_verifikasi: kode });
    const surat = rows?.[0];

    if (!surat || surat.tipe_ttd !== 'QR' || surat.status === 'Ditolak') {
      return Response.json({ valid: false, kode });
    }

    const profil = (await base44.asServiceRole.entities.ProfilDesa.list('-created_date', 1))[0] || {};

    return Response.json({
      valid: true,
      kode,
      surat: {
        nomor_surat: surat.nomor_surat || '',
        jenis_surat: surat.jenis_surat || '',
        keperluan: surat.keperluan || '',
        tanggal_surat: surat.tanggal_surat || surat.tanggal_pengajuan || '',
        status: surat.status || '',
        waktu_ttd: surat.waktu_ttd || '',
        nama_pemohon: samarkan(surat.nama_pemohon),
        pejabat_nama: surat.pejabat_nama || '',
        pejabat_jabatan: surat.pejabat_jabatan || '',
        atas_nama: !!surat.atas_nama,
      },
      desa: {
        nama_desa: profil.nama_desa || '',
        kecamatan: profil.kecamatan || '',
        kabupaten: profil.kabupaten || '',
        provinsi: profil.provinsi || '',
      },
    });
  } catch (error: any) {
    return Response.json({ valid: false, error: error.message }, { status: 500 });
  }
}