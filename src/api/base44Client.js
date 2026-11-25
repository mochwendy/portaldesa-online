import { appParams } from '@/lib/app-params';
import { loadLocalData } from '@/lib/localData';

export const IS_LOCALHOST = true;

const MOCK_USER = {
  id: 'mock-admin-local',
  email: 'admin@localhost',
  full_name: 'Admin Lokal (Mock)',
  role: 'admin',
  is_mock: true,
};

async function fetchCSV(filename) {
  const url = `/data/${filename}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  const text = await res.text();
  return text;
}

function parseCSV(content) {
  if (!content || typeof content !== 'string') return [];
  const lines = content.split('\n').filter((l) => l && l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

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
};

async function loadEntityData(entityName) {
  const filename = entityFileMap[entityName] || `${entityName}_export.csv`;
  const text = await fetchCSV(filename);
  return parseCSV(text);
}

function matchCond(row, key, val) {
  if (val && typeof val === 'object' && val.$regex !== undefined) {
    return String(row[key] || '').toLowerCase().includes(String(val.$regex).toLowerCase());
  }
  return row[key] === val;
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

function createEntityAPI(entityName) {
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
      const lim = opts.limit || 25;
      let start = 0;
      if (opts.cursor) {
        const idx = res.findIndex((r) => r.id === opts.cursor);
        start = idx >= 0 ? idx + 1 : 0;
      }
      const items = res.slice(start, start + lim);
      const has_more = start + lim < res.length;
      return { items, has_more, next_cursor: has_more && items.length ? items[items.length - 1].id : null };
    },
    async count(query = {}) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      return localQuery(rows, query).length;
    },
    async get(id) {
      const rows = Array.isArray(await loadEntityData(entityName)) ? await loadEntityData(entityName) : [];
      return rows.find((r) => r.id === id) || null;
    },
    async create(data) { return { ...data, id: crypto.randomUUID() }; },
    async update(id, data) { return { ...data, id }; },
    async delete() { return { success: true }; },
    async aggregate({ groupBy } = {}) {
      const rows = await loadEntityData(entityName);
      const counts = {};
      rows.forEach((r) => { const k = r[groupBy] || ''; counts[k] = (counts[k] || 0) + 1; });
      return { rows: Object.entries(counts).map(([k, c]) => ({ [groupBy]: k, count: c })) };
    },
  };
}

async function fetchPendudukStats() {
  const rows = await loadEntityData('Penduduk');
  const total = rows.length;
  const lakiLaki = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'laki-laki').length;
  const perempuan = rows.filter((r) => (r.jenis_kelamin || '').toLowerCase() === 'perempuan').length;
  const mkRows = new Set(rows.map((r) => r.no_kk).filter((k) => k));
  const totalKK = mkRows.size;

  let usiaProduktif = 0;
  rows.forEach((r) => {
    const k = (r.kelompok_usia || '');
    const m = k.match(/(\d+)/);
    if (m && Number(m[1]) >= 15 && Number(m[1]) <= 64) usiaProduktif++;
  });

  const disabilitas = rows.filter((r) => (r.disabilitas || '') !== '').length;

  const genderCounts = {};
  rows.forEach((r) => {
    const g = r.jenis_kelamin || 'Tidak Diketahui';
    genderCounts[g] = (genderCounts[g] || 0) + 1;
  });
  const gender = Object.entries(genderCounts).map(([jenis_kelamin, count]) => ({ jenis_kelamin, count }));

  const usiaCounts = {};
  rows.forEach((r) => {
    const u = r.kelompok_usia || 'Tidak Diketahui';
    usiaCounts[u] = (usiaCounts[u] || 0) + 1;
  });
  const usia = Object.entries(usiaCounts).map(([kelompok_usia, count]) => ({ kelompok_usia, count }));

  const pendidikanCounts = {};
  rows.forEach((r) => {
    const p = r.pendidikan || 'Tidak Diketahui';
    pendidikanCounts[p] = (pendidikanCounts[p] || 0) + 1;
  });
  const pendidikan = Object.entries(pendidikanCounts).map(([pendidikan, count]) => ({ pendidikan, count }));

  const pekerjaanCounts = {};
  rows.forEach((r) => {
    const p = r.pekerjaan || 'Tidak Diketahui';
    pekerjaanCounts[p] = (pekerjaanCounts[p] || 0) + 1;
  });
  const pekerjaan = Object.entries(pekerjaanCounts).map(([pekerjaan, count]) => ({ pekerjaan, count })).slice(0, 10);

  const perkawinanCounts = {};
  rows.forEach((r) => {
    const p = r.status_perkawinan || 'Tidak Diketahui';
    perkawinanCounts[p] = (perkawinanCounts[p] || 0) + 1;
  });
  const perkawinan = Object.entries(perkawinanCounts).map(([status_perkawinan, count]) => ({ status_perkawinan, count }));

  const keluargaCounts = {};
  rows.forEach((r) => {
    const k = r.status_keluarga || 'Tidak Diketahui';
    keluargaCounts[k] = (keluargaCounts[k] || 0) + 1;
  });
  const keluarga = Object.entries(keluargaCounts).map(([status_keluarga, count]) => ({ status_keluarga, count }));

  const agamaCounts = {};
  rows.forEach((r) => {
    const a = r.agama || 'Tidak Diketahui';
    agamaCounts[a] = (agamaCounts[a] || 0) + 1;
  });
  const agama = Object.entries(agamaCounts).map(([agama, count]) => ({ agama, count }));

  const wilayahCounts = {};
  rows.forEach((r) => {
    const rw = r.rw || '';
    if (rw) wilayahCounts[rw] = (wilayahCounts[rw] || 0) + 1;
  });
  const wilayah = Object.entries(wilayahCounts).map(([rw, count]) => ({ rw, count })).sort((a, b) => a.rw.localeCompare(b.rw));

  return {
    total,
    totalKK,
    disabilitas,
    lakiLaki,
    perempuan,
    usiaProduktif,
    gender,
    usia,
    pendidikan,
    pekerjaan,
    perkawinan,
    keluarga,
    agama,
    wilayah,
  };
}

async function fetchAspirasiStats() {
  const rows = await loadEntityData('Aspirasi');
  const countByStatus = {};
  const countByKategori = {};
  rows.forEach((r) => {
    const s = r.status || 'Tidak Diketahui';
    countByStatus[s] = (countByStatus[s] || 0) + 1;
    const k = r.kategori || 'Tidak Diketahui';
    countByKategori[k] = (countByKategori[k] || 0) + 1;
  });
  return {
    total: rows.length,
    status: countByStatus,
    baru: countByStatus['Baru'] || 0,
    diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Dijawab'] || 0),
    selesai: countByStatus['Selesai'] || 0,
    ditolak: countByStatus['Ditolak'] || 0,
    kategori: countByKategori,
  };
}

async function fetchSuratStats() {
  const rows = await loadEntityData('SuratKeterangan');
  const countByStatus = {};
  rows.forEach((r) => {
    const s = r.status || 'Tidak Diketahui';
    countByStatus[s] = (countByStatus[s] || 0) + 1;
  });
  return {
    total: rows.length,
    status: countByStatus,
    diajukan: countByStatus['Diajukan'] || 0,
    diproses: (countByStatus['Diproses'] || 0) + (countByStatus['Disetujui'] || 0),
    selesai: countByStatus['Selesai'] || 0,
    ditolak: countByStatus['Ditolak'] || 0,
  };
}

const entities = {};
const entityNames = [
  'Penduduk', 'Aspirasi', 'Berita', 'Pengumuman', 'PerangkatDesa',
  'ProfilDesa', 'APBDes', 'RealisasiPembangunan', 'UsulanPembangunan',
  'DokumenPembangunan', 'SuratKeterangan', 'UMKM', 'MenuPortal',
  'AkunAkses', 'UserGroup', 'WebsiteSetting',
];

entityNames.forEach((name) => {
  entities[name] = createEntityAPI(name);
});

const functions = {
  async invoke(funcName, params = {}) {
    console.log('[base44] functions.invoke:', funcName);
    switch (funcName) {
      case 'getPendudukStats':
        return { data: await fetchPendudukStats() };
      case 'getAspirasiStats':
        return { data: await fetchAspirasiStats() };
      case 'getSuratStats':
        return { data: await fetchSuratStats() };
      default:
        console.warn('[base44] unknown function:', funcName);
        return { data: null };
    }
  },
};

const auth = {
  async me() {
    return MOCK_USER;
  },
  async logout(redirectUrl) {
    console.log('[base44] auth.logout', redirectUrl);
  },
  redirectToLogin(redirectUrl) {
    console.log('[base44] auth.redirectToLogin', redirectUrl);
    if (redirectUrl) window.location.href = redirectUrl;
  },
};

const app = {
  async getPublicSettings() {
    const rows = await loadEntityData('WebsiteSetting');
    return rows[0] || {};
  },
};

export const base44 = {
  entities,
  functions,
  auth,
  app,
};

export async function fetchEntitiesLocal(entityName) {
  if (IS_LOCALHOST) {
    const rows = await loadEntityData(entityName);
    return Array.isArray(rows) ? rows : [];
  }
  return null;
}

export async function fetchFunctionLocal(funcName, params) {
  if (IS_LOCALHOST) {
    const result = await functions.invoke(funcName, params);
    return result.data;
  }
  return null;
}