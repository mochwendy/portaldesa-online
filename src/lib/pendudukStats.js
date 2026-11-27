import { base44 } from '@/api/base44Client';
import { loadLocalData } from './localData';

// Indikator kependudukan dihitung di server lewat fungsi publik, sehingga portal tetap tampil
// untuk pengunjung yang belum login tanpa membuka data pribadi penduduk.
// Hasil di-cache sebentar agar dashboard, beranda, dan halaman penduduk tidak memanggil ulang terus-menerus.
const STATS_TTL = 60 * 1000;
let statsCache = null;
let statsCacheAt = 0;
let summaryCache = null;

// Cek apakah sedang di localhost (tanpa Base44 backend)
const IS_LOCALHOST = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Load pre-computed demografi summary (fast, <5KB)
async function loadDemografiSummary() {
  if (summaryCache) return summaryCache;
  try {
    const res = await fetch('/data/demografi_summary.json');
    if (res.ok) {
      summaryCache = await res.json();
      return summaryCache;
    }
  } catch (e) {
    console.warn('Failed to load demografi_summary.json', e);
  }
  return null;
}

export async function fetchPendudukStats({ force = false } = {}) {
  if (!force && statsCache && Date.now() - statsCacheAt < STATS_TTL) return statsCache;

  // Fast path: load pre-computed summary JSON (<5KB, instant on Cloudflare Workers)
  const summary = await loadDemografiSummary();
  if (summary && !IS_LOCALHOST) {
    // Check if localStorage has newer Penduduk data
    let useSummary = true;
    try {
      const localPenduduk = localStorage.getItem('_Penduduk');
      if (localPenduduk) {
        const parsed = JSON.parse(localPenduduk);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Check if localStorage data is newer than summary
          const summaryDate = new Date(summary.generatedAt).getTime();
          const localDate = new Date(parsed[0].updated_date || 0).getTime();
          if (localDate > summaryDate) {
            useSummary = false; // localStorage has newer data
          }
        }
      }
    } catch (e) {
      // ignore localStorage parse errors
    }
    
    if (useSummary) {
      const stats = {
        total: summary.total,
        totalKK: summary.totalKK || 0,
        disabilitas: summary.disabilitas || 0,
        lakiLaki: summary.lakiLaki,
        perempuan: summary.perempuan,
        usiaProduktif: summary.usiaProduktif,
        gender: summary.gender || [],
        usia: summary.usia || [],
        pendidikan: summary.pendidikan || [],
        pekerjaan: summary.pekerjaan || [],
        perkawinan: summary.perkawinan || [],
        keluarga: summary.keluarga || [],
        agama: summary.agama || [],
        wilayah: summary.wilayah || [],
      };
      statsCache = stats;
      statsCacheAt = Date.now();
      return stats;
    }
  }

  // Di localhost, langsung baca dari CSV lokal tanpa menghubungi API Base44
  if (IS_LOCALHOST) {
    const rows = await loadLocalData('Penduduk');
    const total = rows.length;
    const lakiLaki = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'laki-laki').length;
    const perempuan = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'perempuan').length;
    const mkRows = new Set(rows.map((r) => r.no_kk).filter((k) => k));
    const totalKK = mkRows.size;

    // Usia produktif (15-64) dari kolom kelompok_usia
    let usiaProduktif = 0;
    rows.forEach((r) => {
      const k = (r.kelompok_usia || '');
      const m = k.match(/(\d+)/);
      if (m && Number(m[1]) >= 15 && Number(m[1]) <= 64) usiaProduktif++;
    });

    const disabilitas = rows.filter((r) => (r.disabilitas || '') !== '').length;

    const stats = {
      total,
      totalKK: totalKK || 0,
      disabilitas,
      lakiLaki,
      perempuan,
      usiaProduktif,
      gender: countToPairs(rows, 'jenis_kelamin'),
      usia: countToPairs(rows, 'kelompok_usia'),
      pendidikan: countToPairs(rows, 'pendidikan'),
      pekerjaan: countToPairs(rows, 'pekerjaan').slice(0, 10),
      perkawinan: countToPairs(rows, 'status_perkawinan'),
      keluarga: countToPairs(rows, 'status_keluarga'),
      agama: countToPairs(rows, 'agama'),
      wilayah: countToPairs(rows, 'rw', (v) => `RW ${v}`),
    };

    statsCache = stats;
    statsCacheAt = Date.now();
    return stats;
  }

  // Try API first (produksi)
  try {
    const response = await base44.functions.invoke('getPendudukStats', {});
    const raw = response?.data || {};

    const total = raw.total || 0;
    const disabilitas = raw.disabilitas || 0;
    const kk = raw.kk || 0;

    // Gender from API
    const genderPairs = [];
    if (raw.gender && Array.isArray(raw.gender)) {
      genderPairs.push(...raw.gender.filter((r) => r.jenis_kelamin && String(r.jenis_kelamin).trim()));
    }

    // USIA from API
    const usiaPairs = [];
    if (raw.usia && Array.isArray(raw.usia)) {
      usiaPairs.push(...raw.usia.filter((r) => r.kelompok_usia && String(r.kelompok_usia).trim()));
    }

    const lakiLaki = genderPairs.find((r) => String(r.jenis_kelamin || '').toLowerCase() === 'laki-laki')?.count || 0;
    const perempuan = genderPairs.find((r) => String(r.jenis_kelamin || '').toLowerCase() === 'perempuan')?.count || 0;

    const usiaProduktif = usiaPairs
      .filter((row) => ['15-24 Tahun', '25-44 Tahun', '45-64 Tahun'].includes(row.kelompok_usia || ''))
      .reduce((sum, row) => sum + (row.count || 0), 0);

    const stats = {
      total,
      totalKK: kk || 0,
      disabilitas,
      lakiLaki,
      perempuan,
      usiaProduktif,
      gender: genderPairs,
      usia: usiaPairs,
      pendidikan: toPairs(raw.pendidikan, 'pendidikan'),
      pekerjaan: toPairs(raw.pekerjaan, 'pekerjaan').slice(0, 10),
      perkawinan: toPairs(raw.perkawinan, 'status_perkawinan'),
      keluarga: toPairs(raw.keluarga, 'status_keluarga'),
      agama: toPairs(raw.agama, 'agama'),
      wilayah: normalizeWilayah(raw.wilayah || []),
    };

    statsCache = stats;
    statsCacheAt = Date.now();
    return stats;
  } catch (e) {
    console.warn('API fetchPendudukStats failed, falling back to summary JSON', e);
  }

  // Fallback to summary JSON if available
  if (summary) {
    const stats = {
      total: summary.total,
      totalKK: summary.totalKK || 0,
      disabilitas: summary.disabilitas || 0,
      lakiLaki: summary.lakiLaki,
      perempuan: summary.perempuan,
      usiaProduktif: summary.usiaProduktif,
      gender: summary.gender || [],
      usia: summary.usia || [],
      pendidikan: summary.pendidikan || [],
      pekerjaan: summary.pekerjaan || [],
      perkawinan: summary.perkawinan || [],
      keluarga: summary.keluarga || [],
      agama: summary.agama || [],
      wilayah: summary.wilayah || [],
    };
    statsCache = stats;
    statsCacheAt = Date.now();
    return stats;
  }

  // Final fallback ke CSV lokal (jika API dan summary JSON gagal)
  const rows = await loadLocalData('Penduduk');
  const total = rows.length;
  const lakiLaki = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'laki-laki').length;
  const perempuan = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'perempuan').length;
  const mkRows = new Set(rows.map((r) => r.no_kk).filter((k) => k));
  const totalKK = mkRows.size;

  // Usia produktif (15-64) dari kolom kelompok_usia
  let usiaProduktif = 0;
  rows.forEach((r) => {
    const k = (r.kelompok_usia || '');
    const m = k.match(/(\d+)/);
    if (m && Number(m[1]) >= 15 && Number(m[1]) <= 64) usiaProduktif++;
  });

  const disabilitas = rows.filter((r) => (r.disabilitas || '') !== '').length;

  const stats = {
    total,
    totalKK: totalKK || 0,
    disabilitas,
    lakiLaki,
    perempuan,
    usiaProduktif,
    gender: countToPairs(rows, 'jenis_kelamin'),
    usia: countToPairs(rows, 'kelompok_usia'),
    pendidikan: countToPairs(rows, 'pendidikan'),
    pekerjaan: countToPairs(rows, 'pekerjaan').slice(0, 10),
    perkawinan: countToPairs(rows, 'status_perkawinan'),
    keluarga: countToPairs(rows, 'status_keluarga'),
    agama: countToPairs(rows, 'agama'),
    wilayah: countToPairs(rows, 'rw', (v) => `RW ${v}`),
  };

  statsCache = stats;
  statsCacheAt = Date.now();
  return stats;
}

export function normalizeWilayah(rows) {
  return (rows || [])
    .filter((row) => row.rw)
    .map((row) => ({ name: `RW ${row.rw}`, value: row.count || 0 }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function countToPairs(rows, field, nameFn) {
  const counts = {};
  rows.forEach((r) => {
    const v = r[field] || '';
    if (v === '' || v === null || v === undefined) return;
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name: nameFn ? nameFn(name) : String(name).trim(), value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value);
}

export function toPairs(rows, field) {
  return (rows || [])
    .filter((row) => row[field] !== null && row[field] !== undefined && String(row[field]).trim() !== '')
    .map((row) => ({ name: String(row[field]).trim(), value: row.count || 0 }))
    .sort((a, b) => b.value - a.value);
}

export async function fetchAllPenduduk() {
  const stats = await fetchPendudukStats();
  return loadLocalData('Penduduk');
}

export function fetchRwOptions() {
  return loadLocalData('Penduduk').then(rows => {
    return [...new Set(rows.map(r => r.rw).filter(Boolean))].sort();
  });
}