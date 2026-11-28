import { createSupabaseEntity } from '@/api/supabaseAdapter.js';
import { loadLocalData } from './localData';

let statsCache = null;
let statsCacheAt = 0;
const STATS_TTL = 60 * 1000;

const IS_LOCALHOST = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

function countToPairs(rows, field) {
  const counts = {};
  rows.forEach((r) => {
    const v = r[field] || '';
    if (v === '' || v === null || v === undefined) return;
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name: String(name).trim(), value: Number(value) || 0 }))
    .sort((a, b) => b.value - a.value);
}

export async function fetchAspirasiStats({ force = false } = {}) {
  if (!force && statsCache && Date.now() - statsCacheAt < STATS_TTL) return statsCache;

  if (IS_LOCALHOST) {
    const rows = await loadLocalData('Aspirasi');
    const countByStatus = {};
    const countByKategori = {};
    rows.forEach((r) => {
      const s = r.status || 'Tidak Diketahui';
      countByStatus[s] = (countByStatus[s] || 0) + 1;
      const k = r.kategori || 'Tidak Diketahui';
      countByKategori[k] = (countByKategori[k] || 0) + 1;
    });
    
    const stats = {
      total: rows.length,
      status: countByStatus,
      baru: countByStatus['Baru'] || 0,
      diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Dijawab'] || 0),
      selesai: countByStatus['Selesai'] || 0,
      ditolak: countByStatus['Ditolak'] || 0,
      kategori: countByKategori,
    };
    
    statsCache = stats;
    statsCacheAt = Date.now();
    return stats;
  }

  try {
    const aspirasiEntity = createSupabaseEntity('Aspirasi');
    const { items: rows, total } = await aspirasiEntity.list('-created_date', 10000);
    
    const countByStatus = {};
    const countByKategori = {};
    rows.forEach((r) => {
      const s = r.status || 'Tidak Diketahui';
      countByStatus[s] = (countByStatus[s] || 0) + 1;
      const k = r.kategori || 'Tidak Diketahui';
      countByKategori[k] = (countByKategori[k] || 0) + 1;
    });
    
    const stats = {
      total,
      status: countByStatus,
      baru: countByStatus['Baru'] || 0,
      diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Dijawab'] || 0),
      selesai: countByStatus['Selesai'] || 0,
      ditolak: countByStatus['Ditolak'] || 0,
      kategori: countByKategori,
    };
    
    statsCache = stats;
    statsCacheAt = Date.now();
    return stats;
  } catch (e) {
    console.warn('Supabase fetchAspirasiStats failed', e);
  }

  // Final fallback
  const rows = await loadLocalData('Aspirasi');
  const countByStatus = {};
  const countByKategori = {};
  rows.forEach((r) => {
    const s = r.status || 'Tidak Diketahui';
    countByStatus[s] = (countByStatus[s] || 0) + 1;
    const k = r.kategori || 'Tidak Diketahui';
    countByKategori[k] = (countByKategori[k] || 0) + 1;
  });
  
  const stats = {
    total: rows.length,
    status: countByStatus,
    baru: countByStatus['Baru'] || 0,
    diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Dijawab'] || 0),
    selesai: countByStatus['Selesai'] || 0,
    ditolak: countByStatus['Ditolak'] || 0,
    kategori: countByKategori,
  };
  
  statsCache = stats;
  statsCacheAt = Date.now();
  return stats;
}