import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const KATEGORI = ['Pengaduan', 'Aspirasi', 'Permintaan Informasi'];
const STATUS_AKTIF = ['Aktif', 'Perantau'];

const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z]/g, '');

const badRequest = (message) => Response.json({ error: message }, { status: 400 });

export default async function (req) {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Metode tidak diizinkan' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const nik = String(body.nik || '').trim();
    const nama = String(body.nama || '').trim();
    const noTelepon = String(body.no_telepon || '').trim();
    const kategori = String(body.kategori || '').trim();
    const judul = String(body.judul || '').trim();
    const isi = String(body.isi || '').trim();

    if (!/^\d{16}$/.test(nik)) return badRequest('NIK harus terdiri dari 16 digit angka.');
    if (!nama || nama.length < 3) return badRequest('Nama lengkap wajib diisi.');
    if (!/^[0-9+\-\s]{8,20}$/.test(noTelepon)) return badRequest('Nomor WhatsApp tidak valid.');
    if (!KATEGORI.includes(kategori)) return badRequest('Kategori aspirasi tidak valid.');
    if (!judul || judul.length < 5) return badRequest('Judul minimal 5 karakter.');
    if (!isi || isi.length < 20) return badRequest('Uraian aspirasi minimal 20 karakter.');

    const base44 = createClientFromRequest(req);

    const { items } = await base44.asServiceRole.entities.Penduduk.filter({ nik }, { limit: 1 });
    const warga = items && items[0];

    if (!warga) {
      return badRequest('NIK tidak terdaftar dalam data penduduk Desa Tagog Apu.');
    }
    if (warga.status_kependudukan && !STATUS_AKTIF.includes(warga.status_kependudukan)) {
      return badRequest(`NIK tercatat dengan status "${warga.status_kependudukan}" sehingga tidak dapat menggunakan saluran aspirasi.`);
    }

    const namaInput = normalize(nama);
    const namaResmi = normalize(warga.nama_lengkap);
    if (!namaInput || !namaResmi || !(namaInput === namaResmi || namaResmi.includes(namaInput) || namaInput.includes(namaResmi))) {
      return badRequest('Nama tidak sesuai dengan data NIK pada data penduduk desa.');
    }

    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const nomorTiket = `ASP-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const alamat = [warga.alamat, warga.rt ? `RT ${warga.rt}` : '', warga.rw ? `RW ${warga.rw}` : '']
      .filter(Boolean)
      .join(' ');

    const record = await base44.asServiceRole.entities.Aspirasi.create({
      nomor_tiket: nomorTiket,
      nama: warga.nama_lengkap || nama,
      nik,
      no_telepon: noTelepon,
      kategori,
      judul,
      isi,
      alamat,
      status: 'Baru',
    });

    return Response.json({
      nomor_tiket: record.nomor_tiket,
      nama: record.nama,
      kategori: record.kategori,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}