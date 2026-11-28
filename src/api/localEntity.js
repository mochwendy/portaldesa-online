import { fetchCSV, parseCSV } from './base44Client.js';

const entityFileMap = {
  Penduduk: 'Penduduk_export.csv',
  Aspirasi: 'Aspirasi_export.csv',
  Berita: 'Berita_export.csv',
  Pengumuman: 'Pengumuman_export.csv',
  PerangkatDesa: 'PerangkatDesa_export.csv',
  ProfilDesa: 'ProfilDesa_export.csv',
  APBDes: 'APBDes_export.csv',
  RealisasiPembangunan: 'RealisasiPembangunan_export (1).csv',
  UsulanPembangunan: 'UsulanPembangunan_export (1).csv',
  DokumenPembangunan: 'DokumenPembangunan_export.csv',
  SuratKeterangan: 'SuratKeterangan_export.csv',
  UMKM: 'UMKM_export.csv',
  MenuPortal: 'MenuPortal_export.csv',
  AkunAkses: 'AkunAkses_export.csv',
  UserGroup: 'UserGroup_export.csv',
  WebsiteSetting: 'WebsiteSetting_export.csv',
  KontakDarurat: 'KontakDarurat_export.csv',
};

async function loadEntityData(entityName) {
  const local = localStorage.getItem(`_${entityName}`);
  if (local) return JSON.parse(local);
  const filename = entityFileMap[entityName] || `${entityName}_export.csv`;
  const text = await fetchCSV(filename);
  return parseCSV(text);
}

function persistRows(entityName, rows) {
  localStorage.setItem(`_${entityName}`, JSON.stringify(rows));
}

function matchCond(row, key, val) {
  if (val && typeof val === 'object' && val.$regex !== undefined) {
    return String(row[key] || '').toLowerCase().includes(String(val.$regex).toLowerCase());
  }
  if (typeof val === 'number') {
    return Number(row[key]) === val;
  }
  if (typeof val === 'boolean') {
    const rowVal = String(row[key]).toLowerCase();
    return (val && rowVal === 'true') || (!val && rowVal === 'false');
  }
  return String(row[key]) === String(val);
}

function localQuery(rows, query = {}) {
  let res = rows;
  if (query.$or && Array.isArray(query.$or)) {
    res = res.filter((r) =>
      query.$or.some((cond) =>
        Object.entries(cond).every(([k, v]) => matchCond(r, k, v))
      )
    );
  }
  Object.entries(query).forEach(([key, val]) => {
    if (key === '$or') return;
    res = res.filter((r) => matchCond(r, key, val));
  });
  return res;
}

function sortRows(rows, sortSpec) {
  if (!sortSpec || typeof sortSpec !== 'string') return rows;
  const desc = sortSpec.startsWith('-');
  const key = desc ? sortSpec.slice(1) : sortSpec;
  return [...rows].sort((a, b) => {
    const va = a[key] ?? '';
    const vb = b[key] ?? '';
    if (va < vb) return desc ? 1 : -1;
    if (va > vb) return desc ? -1 : 1;
    return 0;
  });
}

export function createEntityAPI(entityName) {
  return {
    async list(sortOrOpts, limit) {
      let sortSpec = null, lim = null;
      if (typeof sortOrOpts === 'string') { sortSpec = sortOrOpts; lim = limit; }
      else if (sortOrOpts) { sortSpec = sortOrOpts.sort; lim = sortOrOpts.limit; }
      let rows = await loadEntityData(entityName);
      rows = Array.isArray(rows) ? rows : [];
      rows = sortRows(rows, sortSpec);
      if (lim) rows = rows.slice(0, lim);
      return rows;
    },
    async filter(query = {}, opts = {}) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      let res = localQuery(rows, query);
      res = sortRows(res, opts.sort);
      const wantsPagination = opts.limit !== undefined || opts.cursor != null;
      if (!wantsPagination) return res;
      const start = opts.cursor != null ? Number(opts.cursor) || 0 : 0;
      const end = start + opts.limit;
      const items = res.slice(start, end);
      const nextCursor = end < res.length ? end : null;
      return { items, total: res.length, has_more: end < res.length, next_cursor: nextCursor };
    },
    async count(query = {}) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      return localQuery(rows, query).length;
    },
    async get(id) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      return rows.find((r) => r.id === id) || null;
    },
    async create(data) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      const id = crypto.randomUUID();
      const row = { ...data, id };
      rows.push(row);
      persistRows(entityName, rows);
      return row;
    },
    async update(id, data) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) {
        rows[idx] = { ...rows[idx], ...data, id };
        persistRows(entityName, rows);
        return rows[idx];
      }
      const row = { ...data, id };
      rows.push(row);
      persistRows(entityName, rows);
      return row;
    },
    async delete(id) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      const idx = rows.findIndex((r) => r.id === id);
      if (idx >= 0) rows.splice(idx, 1);
      persistRows(entityName, rows);
      return { success: true };
    },
    async aggregate({ groupBy } = {}) {
      const rows = await loadEntityData(entityName);
      const counts = {};
      rows.forEach((r) => { const k = r[groupBy] || ''; counts[k] = (counts[k] || 0) + 1; });
      return { rows: Object.entries(counts).map(([k, c]) => ({ [groupBy]: k, count: c })) };
    },
  };
}