// Pencarian NIK pada data penduduk desa — dipakai bersama oleh validasi NIK portal & pengajuan surat.
export const PESAN_NIK_TIDAK_TERDAFTAR =
  'NIK tidak terdaftar pada data penduduk desa. Silakan hubungi Kantor Desa pada jam layanan (Senin–Jumat, 08.00–15.00 WIB) untuk verifikasi atau registrasi ulang data penduduk Anda.';

export const JAM_LAYANAN = 'Senin–Jumat, 08.00–15.00 WIB';

export const normalisasiNik = (value) => String(value || '').replace(/\D/g, '').slice(0, 16);

export async function cariWargaByNik(base44, nik) {
  const { items } = await base44.asServiceRole.entities.Penduduk.filter({ nik }, { limit: 1 });
  return (items && items[0]) || null;
}