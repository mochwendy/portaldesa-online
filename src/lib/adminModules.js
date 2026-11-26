// Daftar modul & fitur admin SIMDESTA yang dapat diatur hak aksesnya per grup pengguna.
export const PERMISSION_ACTIONS = [
    { key: 'view', label: 'Lihat & Ubah', short: 'Lihat/Ubah' },
    { key: 'delete', label: 'Hapus', short: 'Hapus' },
    { key: 'create', label: 'Tambah', short: 'Tambah' },
  ];
  
  const MODULE_DEFS = [
    { key: 'dashboard', label: 'Dashboard', actions: ['view'] },
    { key: 'penduduk', label: 'Data Penduduk' },
    { key: 'surat', label: 'Layanan Surat' },
    { key: 'pembangunan', label: 'Usulan Pembangunan' },
    { key: 'realisasi', label: 'Realisasi Pembangunan' },
    { key: 'apbdes', label: 'Transparansi APBDes' },
    { key: 'umkm', label: 'UMKM & BUMDes' },
    { key: 'berita', label: 'Berita Desa' },
    { key: 'perangkat', label: 'Perangkat Desa' },
    { key: 'pengumuman', label: 'Pengumuman' },
    { key: 'aspirasi', label: 'Aspirasi Warga' },
    { key: 'kontak_darurat', label: 'Nomor Darurat' },
    { key: 'profil', label: 'Profil Desa' },
    { key: 'integrasi', label: 'Integrasi Sistem' },
    { key: 'menu_portal', label: 'Pengaturan Menu Portal' },
    { key: 'website', label: 'Pengaturan Aplikasi' },
    { key: 'pengguna_grup', label: 'Pengaturan Grup Pengguna' },
    { key: 'pengguna_akun', label: 'Pengaturan Akun Pengguna' },
  ];
  
  export const ADMIN_MODULES = MODULE_DEFS.map((m) => ({
    ...m,
    actions: m.actions || ['view', 'create', 'delete'],
  }));
  
  export const actionsFor = (moduleKey) =>
    (ADMIN_MODULES.find((m) => m.key === moduleKey)?.actions) || ['view', 'create', 'delete'];
  
  export function parsePermissions(raw) {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }
  
  export const serializePermissions = (map) => JSON.stringify(map || {});
  
  export function hasPermission(map, moduleKey, action = 'view') {
    const row = (map || {})[moduleKey];
    return Boolean(row && row[action]);
  }
  
  export function countAllowedModules(map) {
    return ADMIN_MODULES.filter((m) => hasPermission(map, m.key, 'view')).length;
  }
  
  export function allPermissions() {
    return ADMIN_MODULES.reduce((acc, m) => {
      acc[m.key] = m.actions.reduce((a, action) => { a[action] = true; return a; }, {});
      return acc;
    }, {});
  }
  
  export const emptyPermissions = () => ({});