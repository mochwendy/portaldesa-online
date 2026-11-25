// Menyimpan & memuat pengaturan kop surat yang dipakai bersama oleh editor dan generator PDF.
export const KOP_KEY = 'simdesta_kop_surat';

export function buildDefaultKop(profil) {
  return {
    baris1: profil ? `PEMERINTAH KABUPATEN ${(profil.kabupaten || '').replace(/^kabupaten\s+/i, '').toUpperCase()}` : '',
    baris2: profil ? `KECAMATAN ${(profil.kecamatan || '').replace(/^kecamatan\s+/i, '').toUpperCase()}` : '',
    baris3: profil ? `DESA ${(profil.nama_desa || '').replace(/^desa\s+/i, '').toUpperCase()}` : '',
    alamat: '',
    logo: '',
    footer: 'Berkas ini diproses & dicetak melalui SIMDESTA - DesaDigital Terpadu.',
  };
}

export function loadKop(profil) {
  const bawaan = buildDefaultKop(profil);
  try {
    const tersimpan = localStorage.getItem(KOP_KEY);
    return tersimpan ? { ...bawaan, ...JSON.parse(tersimpan) } : bawaan;
  } catch {
    return bawaan;
  }
}

export function saveKop(kop) {
  localStorage.setItem(KOP_KEY, JSON.stringify(kop));
}