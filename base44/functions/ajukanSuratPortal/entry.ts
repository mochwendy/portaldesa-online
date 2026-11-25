import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { cariWargaByNik, normalisasiNik, PESAN_NIK_TIDAK_TERDAFTAR } from '../../shared/pendudukNik.ts';

const badRequest = (message) => Response.json({ error: message }, { status: 400 });

const nomorBaru = () => {
  const n = Math.floor(Math.random() * 9999) + 1;
  return `470/${String(n).padStart(4, '0')}/SK/${new Date().getFullYear()}`;
};

// Pengajuan surat melalui saluran Portal dengan validasi NIK otomatis.
export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Metode tidak diizinkan' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const nik = normalisasiNik(body.nik_pemohon);
    const namaInput = String(body.nama_pemohon || '').trim();
    const noTelepon = String(body.no_telepon || '').trim();
    const jenisSurat = String(body.jenis_surat || '').trim();
    const keperluan = String(body.keperluan || '').trim();
    const tanggal = String(body.tanggal_pengajuan || '').trim() || new Date().toISOString().split('T')[0];

    if (nik.length !== 16) return badRequest('NIK harus terdiri dari 16 digit angka.');
    if (!namaInput || namaInput.length < 3) return badRequest('Nama lengkap wajib diisi.');
    if (!/^[0-9+\-\s()]{8,20}$/.test(noTelepon)) return badRequest('Nomor WhatsApp tidak valid.');
    if (!jenisSurat) return badRequest('Jenis surat wajib dipilih.');
    if (!keperluan || keperluan.length < 5) return badRequest('Keperluan minimal 5 karakter.');

    const base44 = createClientFromRequest(req);
    const warga = await cariWargaByNik(base44, nik);
    const nomor = String(body.nomor_surat || '').trim() || nomorBaru();

    // NIK tidak terdata → pengajuan dihentikan dan dicatat berstatus Ditolak.
    if (!warga) {
      const ditolak = await base44.asServiceRole.entities.SuratKeterangan.create({
        nomor_surat: nomor,
        nik_pemohon: nik,
        nama_pemohon: namaInput,
        no_telepon: noTelepon,
        jenis_surat: jenisSurat,
        keperluan,
        tanggal_pengajuan: tanggal,
        channel: 'Portal',
        status: 'Ditolak',
        catatan: `${PESAN_NIK_TIDAK_TERDAFTAR} (validasi NIK otomatis)`,
      });
      return Response.json({
        diterima: false,
        nomor_surat: ditolak.nomor_surat,
        alasan: PESAN_NIK_TIDAK_TERDAFTAR,
      });
    }

    const record = await base44.asServiceRole.entities.SuratKeterangan.create({
      nomor_surat: nomor,
      nik_pemohon: warga.nik,
      nama_pemohon: warga.nama_lengkap || namaInput,
      no_telepon: noTelepon,
      jenis_surat: jenisSurat,
      keperluan,
      tanggal_pengajuan: tanggal,
      channel: 'Portal',
      status: 'Diajukan',
    });

    return Response.json({
      diterima: true,
      nomor_surat: record.nomor_surat,
      nama_pemohon: record.nama_pemohon,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}