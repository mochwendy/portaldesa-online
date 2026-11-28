import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient.js';
import { createSupabaseEntity, supabaseKelolaAkunAkses, getPortalNotifications, supabaseSubmitAspirasi } from './supabaseAdapter.js';
import { createEntityAPI } from './localEntity.js';

export const IS_LOCALHOST = false;
export { isSupabaseConfigured };

export async function fetchCSV(filename) {
  const url = `/data/${filename}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${filename}: ${res.status}`);
  const text = await res.text();
  return text;
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

export function parseCSVLine(line) {
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

// Membersihkan string numerik/rupiah/Ribu menjadi Number valid; fallback 0 bila tidak valid.
export function toNumber(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val == null) return 0;
  const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

// Create Supabase entities
const entityNames = [
  'Penduduk', 'Aspirasi', 'Berita', 'Pengumuman', 'PerangkatDesa',
  'ProfilDesa', 'APBDes', 'RealisasiPembangunan', 'UsulanPembangunan',
  'DokumenPembangunan', 'SuratKeterangan', 'UMKM', 'MenuPortal',
  'AkunAkses', 'UserGroup', 'User', 'WebsiteSetting',
  'KontakDarurat',
];

const entities = {};
if (isSupabaseConfigured()) {
  entityNames.forEach((name) => {
    entities[name] = createSupabaseEntity(name);
  });
} else {
  // Fallback to local storage entities for development without Supabase
  entityNames.forEach((name) => {
    entities[name] = createEntityAPI(name);
  });
}

const functions = {
  async invoke(funcName, params = {}) {
    switch (funcName) {
      case 'getPendudukStats':
        return { data: await import('@/lib/pendudukStats').then(m => m.fetchPendudukStats()) };
      case 'getAspirasiStats':
        return { data: await import('@/lib/aspirasiStats').then(m => m.fetchAspirasiStats()) };
      case 'getSuratStats':
        return { data: await import('@/lib/suratStats').then(m => m.fetchSuratStats()) };
      case 'getPortalNotifications':
        if (isSupabaseConfigured()) {
          return { data: await getPortalNotifications() };
        }
        return { data: [] };
      case 'submitAspirasi':
        if (isSupabaseConfigured()) {
          return { data: await supabaseSubmitAspirasi(params) };
        }
        return { data: null };
      case 'kelolaAkunAkses':
        if (isSupabaseConfigured()) {
          return { data: await supabaseKelolaAkunAkses(params) };
        }
        return { data: { items: [], is_super_admin: false } };
      case 'verifySurat':
        // Handled directly in VerifikasiSurat page
        return { data: null };
      case 'getSuratPdfUrl':
        // Handled directly in UnduhSurat page
        return { data: null };
      default:
        console.warn('[api] unknown function:', funcName);
        return { data: null };
    }
  },
};

const auth = {
  async me() {
    return null; // Handled by AuthContext
  },
  async logout(redirectUrl) {
    if (redirectUrl) window.location.href = redirectUrl;
  },
  redirectToLogin(redirectUrl) {
    if (redirectUrl) window.location.href = redirectUrl;
  },
  setToken(token) {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  },
};

const app = {
  async getPublicSettings() {
    if (isSupabaseConfigured()) {
      const entity = createSupabaseEntity('WebsiteSetting');
      const rows = await entity.list('-created_date', 1);
      return rows[0] || {};
    }
    return {};
  },
};

const integrations = {
  Core: {
    async CreateFileSignedUrl({ file_uri, expires_in }) {
      if (isSupabaseConfigured() && file_uri) {
        const { data } = await supabase.storage
          .from('surat-pdf')
          .createSignedUrl(file_uri, expires_in || 3600);
        return { signed_url: data?.signedUrl };
      }
      return { signed_url: '' };
    },
    async UploadPrivateFile({ file }) {
      if (!isSupabaseConfigured()) return { file_uri: file.name || 'uploaded-file' };
      const filePath = `uploads/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('surat-pdf')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });
      if (error) throw error;
      return { file_uri: data.path };
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