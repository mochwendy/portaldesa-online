import { appParams } from '@/lib/app-params';
import { loadLocalData } from '@/lib/localData';

export const IS_LOCALHOST = !import.meta.env.VITE_BASE44_APP_BASE_URL;

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
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(v => v.trim());
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

// Membersihkan string numerik/rupiah/Ribu menjadi Number valid; fallback 0 bila tidak valid.
function toNumber(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val == null) return 0;
  const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function matchCond(row, key, val) {
  if (val && typeof val === 'object' && val.$regex !== undefined) {
    return String(row[key] || '').toLowerCase().includes(String(val.$regex).toLowerCase());
  }
  // Handle loose equality for numbers (CSV values are strings)
  if (typeof val === 'number') {
    return Number(row[key]) === val;
  }
  // Handle boolean comparison (CSV may have "true"/"false")
  if (typeof val === 'boolean') {
    const rowVal = String(row[key]).toLowerCase();
    return (val && rowVal === 'true') || (!val && rowVal === 'false');
  }
  // Handle string comparison (CSV values are strings)
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
  'AkunAkses', 'UserGroup', 'User', 'WebsiteSetting',
  'KontakDarurat',
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
      case 'kelolaAkunAkses':
        return await invokeKelolaAkunAkses(params);
      default:
        console.warn('[base44] unknown function:', funcName);
        return { data: null };
    }
  },
};

async function invokeKelolaAkunAkses(params = {}) {
  const { action, id, ...data } = params;
  const akunRows = await loadEntityData('AkunAkses');
  const groupRows = await loadEntityData('UserGroup');

  if (action === 'list') {
    // Build akun_login map from User entity (email -> user) if available
    let byEmail = {};
    try {
      const userRows = await loadEntityData('User');
      userRows.forEach((u) => {
        byEmail[String(u.email || '').toLowerCase()] = { id: u.id, email: u.email };
      });
    } catch (e) {
      // User entity may not exist, continue without it
    }

    // Return ALL accounts (including super admin) - filtering is done at UI layer
    return {
      data: {
        items: akunRows.map((a) => ({
          ...a,
          akun_login: byEmail[String(a.email || '').toLowerCase()] || null,
        })),
        is_super_admin: false,
      },
    };
  }

  if (action === 'save') {
    const { nama, email, username, role, grup_kode, jabatan, status, password } = data;
    const targetGroup = groupRows.find(g => g.kode === grup_kode);
    const roleLevel = targetGroup?.role_level ?? 1;
    const nextRole = roleLevel >= 2 ? 'admin' : 'user';

    if (id) {
      // Update existing
      const idx = akunRows.findIndex(r => r.id === id);
      if (idx >= 0) {
        const group = groupRows.find(g => g.kode === grup_kode);
        const updated = {
          ...akunRows[idx],
          nama,
          email,
          username,
          role: nextRole,
          grup_kode,
          grup_nama: group?.nama || grup_kode,
          user_group_id: grup_kode,
          user_group: grup_kode,
          jabatan,
          status,
          ...(password && { password }),
        };
        akunRows[idx] = updated;
        persistRows('AkunAkses', akunRows);
        return { data: { item: updated } };
      }
    } else {
      // Create new
      const group = groupRows.find(g => g.kode === grup_kode);
      const newRow = {
        id: crypto.randomUUID(),
        nama,
        email,
        username,
        role: nextRole,
        grup_kode,
        grup_nama: group?.nama || grup_kode,
        user_group_id: grup_kode,
        user_group: grup_kode,
        jabatan,
        status: status || 'Aktif',
        password: password || '',
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      akunRows.push(newRow);
      persistRows('AkunAkses', akunRows);
      return { data: { item: newRow } };
    }
  }

  if (action === 'set-group') {
    const { grup_kode } = data;
    const targetGroup = groupRows.find(g => g.kode === grup_kode);
    const roleLevel = targetGroup?.role_level ?? 1;
    const nextRole = roleLevel >= 2 ? 'admin' : 'user';

    const idx = akunRows.findIndex(r => r.id === id);
    if (idx >= 0) {
      const group = groupRows.find(g => g.kode === grup_kode);
      const updated = {
        ...akunRows[idx],
        grup_kode,
        grup_nama: group?.nama || grup_kode,
        user_group_id: grup_kode,
        user_group: grup_kode,
        role: nextRole,
      };
      akunRows[idx] = updated;
      persistRows('AkunAkses', akunRows);
      return { data: { ok: true, grup_kode, role: nextRole } };
    }
    return { data: { error: 'Akun tidak ditemukan' } };
  }

  if (action === 'delete') {
    const idx = akunRows.findIndex(r => r.id === id);
    if (idx >= 0) {
      akunRows.splice(idx, 1);
      persistRows('AkunAkses', akunRows);
      return { data: { ok: true } };
    }
    return { data: { error: 'Akun tidak ditemukan' } };
  }

  return { data: { ok: true } };
}

const auth = {
  async me() {
    return MOCK_USER;
  },
  async logout(redirectUrl) {
    this.setToken(null);
    if (redirectUrl) window.location.href = redirectUrl;
  },
  redirectToLogin(redirectUrl) {
    console.log('[base44] auth.redirectToLogin', redirectUrl);
    if (redirectUrl) window.location.href = redirectUrl;
  },
  setToken(token) {
    if (token) {
      localStorage.setItem('base44_token', token);
      // Also update the appParams if available
      if (window.appParams) {
        window.appParams.token = token;
      }
    } else {
      localStorage.removeItem('base44_token');
      if (window.appParams) {
        window.appParams.token = null;
      }
    }
  },
};

const app = {
  async getPublicSettings() {
    const rows = await loadEntityData('WebsiteSetting');
    return rows[0] || {};
  },
};

const integrations = {
  Core: {
    async CreateFileSignedUrl({ file_uri, expires_in }) {
      return { signed_url: `/data/files/${file_uri}` };
    },
    async UploadPrivateFile({ file }) {
      return { file_uri: file.name || 'uploaded-file' };
    },
  },
};

export const base44 = {
  entities,
  functions,
  auth,
  app,
  integrations,
};

export { toNumber };

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