import { base44 } from '@/api/base44Client';
import { loadLocalData } from './localData';

export const FONT_OPTIONS = ['Plus Jakarta Sans', 'Inter', 'Poppins', 'Merriweather'];

export const HERO_OPTIONS = [
  { value: 'tengah', label: 'Tengah dengan foto desa' },
  { value: 'kiri', label: 'Rata kiri dengan foto desa' },
  { value: 'polos', label: 'Polos tanpa foto' },
];

export const DEFAULT_FOOTER_LINKS = [
  { label: 'Profil Desa', url: '/profil-desa' },
  { label: 'Perangkat Desa', url: '/perangkat-desa' },
  { label: 'Berita Desa', url: '/berita' },
  { label: 'Transparansi APBDes', url: '/transparansi-apbdes' },
  { label: 'Layanan Surat', url: '/layanan-surat' },
  { label: 'Marketplace UMKM', url: '/marketplace-umkm' },
];

export const DEFAULT_SETTINGS = {
  logo_url: '',
  warna_primary: '',
  warna_accent: '',
  font_judul: 'Plus Jakarta Sans',
  font_isi: 'Plus Jakarta Sans',
  gaya_hero: 'tengah',
  hero_badge: '',
  hero_judul: '',
  hero_deskripsi: '',
  footer_narasi: '',
  footer_alamat: '',
  footer_telepon: '',
  footer_email: '',
  footer_links: '',
  footer_copyright: '',
};

// Warna bawaan tema (dipakai sebagai nilai awal pada pemilih warna)
export const DEFAULT_PRIMARY_HEX = '#028374';
export const DEFAULT_ACCENT_HEX = '#df9920';

let cache = null;
let inflight = null;
const listeners = new Set();

const publish = (settings) => {
  cache = settings;
  listeners.forEach((fn) => fn(settings));
};

export const getSettingsCache = () => cache;

export function subscribeSettings(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function fetchSettings(force = false) {
  if (!force && cache) return cache;
  if (!force && inflight) return inflight;
  inflight = (async () => {
    try {
      const list = await base44.entities.WebsiteSetting.list('-updated_date', 1);
      publish({ ...DEFAULT_SETTINGS, ...(list[0] || {}) });
    } catch (e) {
      console.warn('API fetchSettings failed, falling back to local CSV', e);
      // Fallback ke CSV lokal
      try {
        const rows = await loadLocalData('WebsiteSetting');
        if (rows.length > 0) {
          publish({ ...DEFAULT_SETTINGS, ...rows[0] });
        } else {
          publish({ ...DEFAULT_SETTINGS });
        }
      } catch (err) {
        console.warn('Local CSV fallback also failed', err);
        publish({ ...DEFAULT_SETTINGS });
      }
    }
    inflight = null;
    return cache;
  })();
  return inflight;
}

export function setSettingsCache(next) {
  publish({ ...DEFAULT_SETTINGS, ...next });
}

const HEX_RE = /^#?([0-9a-f]{6})$/i;

function toRgb(hex) {
  const match = HEX_RE.exec(String(hex || '').trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function isLightHex(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return false;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 > 0.6;
}

// Mengubah HEX menjadi kanal HSL ("h s% l%") sesuai format token di index.css
function hslChannels(hex) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function parseFooterLinks(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && (l.label || l.url))
      .map((l) => ({ label: l.label || '', url: l.url || '' }));
  } catch (e) {
    return [];
  }
}

// Gaya CSS variabel yang diwariskan ke seluruh portal publik
export function themeStyle(settings = {}) {
  const style = {};
  const primary = hslChannels(settings.warna_primary);
  if (primary) {
    style['--primary'] = primary;
    style['--primary-foreground'] = isLightHex(settings.warna_primary) ? '160 30% 12%' : '40 30% 98%';
    style['--ring'] = primary;
  }
  const accent = hslChannels(settings.warna_accent);
  if (accent) {
    style['--accent'] = accent;
    style['--accent-foreground'] = isLightHex(settings.warna_accent) ? '160 30% 12%' : '40 30% 98%';
  }
  if (settings.font_judul) {
    style['--font-heading'] = `'${settings.font_judul}', ui-sans-serif, system-ui, sans-serif`;
    style['--font-display'] = style['--font-heading'];
  }
  if (settings.font_isi) {
    style['--font-body'] = `'${settings.font_isi}', ui-sans-serif, system-ui, sans-serif`;
  }
  return style;
}