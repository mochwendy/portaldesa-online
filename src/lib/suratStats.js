import { base44 } from '@/api/base44Client';
import { loadLocalData } from './localData';

let statsCache = null;
let statsCacheAt = 0;
const STATS_TTL = 60 * 1000;

const IS_LOCALHOST = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export async function fetchSuratStats({ force = false } = {}) {
  if (!force && statsCache && Date.now() - statsCacheAt < STATS_TTL) return statsCache;

  if (IS_LOCALHOST) {
    const rows = await loadLocalData('SuratKeterangan');
    const countByStatus = {};
    rows.forEach((r) => {
      const s = r.status || 'Tidak Diketahui';
      countByStatus[s] = (countByStatus[s] || 0) + 1;
    });
    
    const stats = {
      total: rows.length,
      status: countByStatus,
      diajukan: countByStatus['Diajukan'] || 0,
      diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Disetujui'] || 0),
      selesai: countByStatus['Selesai'] || 0,
      ditolak: countByStatus['Ditolak'] || 0,
    };
    
    statsCache = stats;
    statsCacheAt = Date.now();
    return stats;
  }

  try {
    const response = await base44.functions.invoke('getSuratStats', {});
    const raw = response?.data || {};
    
    const stats = {
      total: raw.total || 0,
      status: raw.status || {},
      diajukan: raw.diajukan || 0,
      diproses: raw.diproses || 0,
      selesai: raw.selesai || 0,
      ditolak: raw.ditolak || 0,
    };
    
    statsCache = stats;
    statsCacheAt = Date.now();
    return stats;
  } catch (e) {
    console.warn('API fetchSuratStats failed', e);
  }

  // Final fallback
  const rows = await loadLocalData('SuratKeterangan');
  const countByStatus = {};
  rows.forEach((r) => {
    const s = r.status || 'Tidak Diketahui';
    countByStatus[s] = (countByStatus[s] || 0) + 1;
  });
  
  const stats = {
    total: rows.length,
    status: countByStatus,
    diajukan: countByStatus['Diajukan'] || 0,
    diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Disetujui'] || 0),
    selesai: countByStatus['Selesai'] || 0,
    ditolak: countByStatus['Ditolak'] || 0,
  };
  
  statsCache = stats;
  statsCacheAt = Date.now();
  return stats;
}