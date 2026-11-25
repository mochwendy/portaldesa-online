function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') {
        result.push(current.trim());
        current = '';
      } else current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSV(content) {
  if (!content || typeof content !== 'string') return [];
  const lines = content.split('\n').filter((l) => l && l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

const cache = new Map();
const rawCache = new Map();

async function fetchCSV(filename) {
  if (rawCache.has(filename)) return rawCache.get(filename);
  try {
    const url = `/data/${filename}`;
    console.log('[localData] fetching CSV:', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
    const text = await res.text();
    console.log('[localData] CSV loaded OK:', filename, 'chars:', text.length);
    rawCache.set(filename, text);
    return text;
  } catch (e) {
    console.error('[localData] fetchCSV failed:', filename, e);
    throw e;
  }
}

export async function loadLocalData(entityName) {
  if (cache.has(entityName)) return cache.get(entityName);
  const fileMap = {
    RealisasiPembangunan: 'RealisasiPembangunan_export (1).csv',
    UsulanPembangunan: 'UsulanPembangunan_export (1).csv',
  };
  const filename = fileMap[entityName] || `${entityName}_export.csv`;
  try {
    const text = await fetchCSV(filename);
    const rows = parseCSV(text).map((r) => {
      // Numeric fields per entity
      if (r.anggaran) r.anggaran = Number(r.anggaran) || 0;
      if (r.realisasi) r.realisasi = Number(r.realisasi) || 0;
      if (r.realisasi_anggaran) r.realisasi_anggaran = Number(r.realisasi_anggaran) || 0;
      if (r.persentase_progress) r.persentase_progress = Number(r.persentase_progress) || 0;
      if (r.estimasi_anggaran) r.estimasi_anggaran = Number(r.estimasi_anggaran) || 0;
      if (r.urutan) r.urutan = Number(r.urutan) || 0;
      if (r.jumlah_penduduk) r.jumlah_penduduk = String(r.jumlah_penduduk);
      // Penduduk-specific
      if (r.listrik) r.listrik = Number(r.listrik) || 0;
      if (r.rt) r.rt = String(r.rt);
      if (r.rw) r.rw = String(r.rw);
      if (r.is_sample) r.is_sample = r.is_sample === 'true';
      // APBDes
      if (r.tahun_anggaran) r.tahun_anggaran = String(r.tahun_anggaran);
      // Realisasi/Usulan
      if (r.tahun_anggaran) r.tahun_anggaran = String(r.tahun_anggaran);
      return r;
    });
    console.log('[localData] loadLocalData', entityName, 'rows:', rows.length);
    cache.set(entityName, Array.isArray(rows) ? rows : []);
    return cache.get(entityName);
  } catch (e) {
    console.error('loadLocalData error:', e);
    cache.set(entityName, []);
    return [];
  }
}

export function getLocalData(entityName) {
  return Array.isArray(cache.get(entityName)) ? cache.get(entityName) : [];
}