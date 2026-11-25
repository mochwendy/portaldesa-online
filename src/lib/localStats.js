import { loadLocalData } from './localData';

export async function fetchLocalAspirasiStats() {
  const rows = await loadLocalData('Aspirasi');
  const countByStatus = {};
  rows.forEach((r) => {
    const s = r.status || 'Tidak Diketahui';
    countByStatus[s] = (countByStatus[s] || 0) + 1;
  });
  const total = rows.length;
  const baru = countByStatus['Baru'] || 0;
  const diproses = (countByStatus['Diproses'] || 0) + (countByStatus['Dijawab'] || 0);
  const selesai = countByStatus['Selesai'] || 0;
  const ditolak = countByStatus['Ditolak'] || 0;

  return {
    total,
    status: countByStatus,
    baru,
    diproses,
    selesai,
    ditolak,
    kategori: {},
  };
}

export async function fetchLocalSuratStats() {
  const rows = await loadLocalData('SuratKeterangan');
  const countByStatus = {};
  rows.forEach((r) => {
    const s = r.status || 'Tidak Diketahui';
    countByStatus[s] = (countByStatus[s] || 0) + 1;
  });
  const total = rows.length;
  const diajukan = countByStatus['Diajukan'] || 0;
  const diproses = (countByStatus['Diproses'] || 0) + (countByStatus['Disetujui'] || 0);
  const selesai = countByStatus['Selesai'] || 0;
  const ditolak = countByStatus['Ditolak'] || 0;

  return {
    total,
    status: countByStatus,
    diajukan,
    diproses,
    selesai,
    ditolak,
  };
}

export async function fetchLocalUMKM() {
  const rows = await loadLocalData('UMKM');
  return rows.filter((r) => (r.status || '').toLowerCase() === 'aktif');
}

export async function fetchLocalAPBDes(tahun = 2026) {
  const rows = await loadLocalData('APBDes');
  const filterTahun = rows.filter((r) => String(r.tahun_anggaran) === String(tahun));
  const totalPendapatan = filterTahun
    .filter((a) => a.jenis === 'Pendapatan')
    .reduce((s, a) => s + (a.anggaran || 0), 0);
  const totalBelanja = filterTahun
    .filter((a) => a.jenis === 'Belanja')
    .reduce((s, a) => s + (a.anggaran || 0), 0);
  const totalRealisasi = filterTahun
    .filter((a) => a.jenis === 'Belanja')
    .reduce((s, a) => s + (a.realisasi || 0), 0);
  const persentase = totalBelanja > 0 ? Math.round((totalRealisasi / totalBelanja) * 100) : 0;
  const belanjaByKategori = {};
  filterTahun.filter((a) => a.jenis === 'Belanja').forEach((a) => {
    belanjaByKategori[a.kategori] = (belanjaByKategori[a.kategori] || 0) + (a.anggaran || 0);
  });
  return { rows: filterTahun, totalPendapatan, totalBelanja, totalRealisasi, persentase, belanjaByKategori };
}

export async function fetchLocalRealisasi() {
  const rows = await loadLocalData('RealisasiPembangunan');
  const withProgress = rows.map((r) => {
    const total = r.anggaran || 0;
    const realisasi = r.realisasi_anggaran || 0;
    const pct = r.persentase_progress ?? (total > 0 ? Math.round((realisasi / total) * 100) : 0);
    return { ...r, persentase_progress: pct };
  });
  const rataRata = withProgress.length
    ? withProgress.reduce((s, r) => s + (r.persentase_progress || 0), 0) / withProgress.length
    : 0;
  const totalAnggaran = withProgress.reduce((s, r) => s + (r.anggaran || 0), 0);
  const totalRealisasi = withProgress.reduce((s, r) => s + (r.realisasi_anggaran || 0), 0);
  return { rows: withProgress, rataRata, totalAnggaran, totalRealisasi };
}

export async function fetchLocalProfil() {
  const rows = await loadLocalData('ProfilDesa');
  return rows.length > 0 ? rows[0] : null;
}