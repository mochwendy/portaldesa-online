import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Wallet, Store,
  Megaphone, Building2, Share2, Menu, ShieldCheck,
  Newspaper, UserCog, Globe, ClipboardList, Navigation, HardHat,
  ShieldAlert, Loader2, UserRound, MessagesSquare, LogOut, Phone, Sliders
} from 'lucide-react';
import { useAuth, SUPER_ADMIN_CREDENTIALS, ROLE_LEVELS, ROLE_LABELS } from '@/lib/AuthContext';
import useAccessPermissions from '@/hooks/useAccessPermissions';
import AkunBelumTerdaftar from '@/components/admin/AkunBelumTerdaftar';
import PortalNotifications from '@/components/admin/PortalNotifications';

const ALL_MODULES = {
  dashboard: 'Dashboard',
  penduduk: 'Data Penduduk',
  surat: 'Layanan Surat',
  apbdes: 'Transparansi APBDes',
  pembangunan: 'Usulan Pembangunan',
  umkm: 'UMKM & BUMDes',
  berita: 'Berita Desa',
  aspirasi: 'Aspirasi Warga',
  kontak_darurat: 'Nomor Darurat',
  profil: 'Profil Desa',
  integrasi: 'Integrasi Sistem',
  menu_portal: 'Pengaturan Menu Portal',
  website: 'Pengaturan Aplikasi',
  pengguna_grup: 'Grup Pengguna',
  pengguna_akun: 'Akun Pengguna',
  manajemen_modul: 'Kontrol Modul Aplikasi',
};

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, module: 'dashboard' },
  { to: '/admin/penduduk', label: 'Data Penduduk', icon: Users, module: 'penduduk' },
  { to: '/admin/surat', label: 'Layanan Surat', icon: FileText, module: 'surat' },
  { to: '/admin/pembangunan', label: 'Usulan Pembangunan', icon: ClipboardList, module: 'pembangunan' },
  { to: '/admin/realisasi', label: 'Realisasi Pembangunan', icon: HardHat, module: 'realisasi' },
  { to: '/admin/apbdes', label: 'Transparansi APBDes', icon: Wallet, module: 'apbdes' },
  { to: '/admin/umkm', label: 'UMKM & BUMDes', icon: Store, module: 'umkm' },
  { to: '/admin/berita', label: 'Berita Desa', icon: Newspaper, module: 'berita' },
  { to: '/admin/perangkat-desa', label: 'Perangkat Desa', icon: UserCog, module: 'perangkat' },
  { to: '/admin/pengumuman', label: 'Pengumuman', icon: Megaphone, module: 'pengumuman' },
  { to: '/admin/aspirasi', label: 'Aspirasi Warga', icon: MessagesSquare, module: 'aspirasi' },
  { to: '/admin/kontak-darurat', label: 'Nomor Darurat', icon: Phone, module: 'kontak_darurat' },
  { to: '/admin/profil-desa', label: 'Profil Desa', icon: Building2, module: 'profil' },
  { to: '/admin/integrasi', label: 'Integrasi Sistem', icon: Share2, module: 'integrasi' },
  { to: '/admin/menu-portal', label: 'Pengaturan Menu Portal', icon: Navigation, module: 'menu_portal' },
  { to: '/admin/pengaturan-website', label: 'Pengaturan Aplikasi', icon: Globe, module: 'website' },
  {
    label: 'Pengaturan Pengguna',
    icon: ShieldCheck,
    children: [
      { to: '/admin/pengguna/grup', label: 'Grup Pengguna', icon: ShieldCheck, module: 'pengguna_grup' },
      { to: '/admin/pengguna/akun', label: 'Akun Pengguna', icon: UserCog, module: 'pengguna_akun' },
    ],
  },
  { to: '/admin/manajemen-modul', label: 'Kontrol Modul Aplikasi', icon: Sliders, module: 'manajemen_modul', superAdminOnly: true },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess, group, user, loading, terdaftar, alasan, logout } = useAccessPermissions();

  // 4-tier role hierarchy: super_admin (3) > admin_desa (2) > operator (1) > warga (0)
  // Super admin: full access without filter
  // All other groups (ADM, KADES, SEKDES, STAF, WARGA): MUST follow group.permissions strictly
  const isSuperAdmin = user?.role_level === ROLE_LEVELS.SUPER_ADMIN || user?.email === SUPER_ADMIN_CREDENTIALS.email;
  const roleLabel = isSuperAdmin ? 'Super Admin' : user?.role_label || 'Pengguna';

  // Get enabled modules from localStorage (set by Super Admin in Kontrol Modul Aplikasi)
  const [enabledModules, setEnabledModules] = useState(() => {
    try {
      const stored = localStorage.getItem('simdesta_enabled_modules');
      return stored ? JSON.parse(stored) : Object.keys(ALL_MODULES);
    } catch {
      return Object.keys(ALL_MODULES);
    }
  });

  // For super-admin: show ALL items without any filtering
  // For ALL other groups (including Admin Desa): filter by enabled_modules AND group.permissions
  const filteredNavItems = isSuperAdmin
    ? navItems
    : navItems.filter((item) => {
        // Super admin only items (Kontrol Modul Aplikasi)
        if (item.superAdminOnly) return false;

        // Check if module is enabled
        if (item.module) {
          // Always allow dashboard
          if (item.module === 'dashboard') return true;
          // Check if module is in enabled list (simdesta_enabled_modules)
          if (!enabledModules.includes(item.module)) return false;
        }

        // For children groups
        if (item.children) {
          const hasAccessibleChildren = item.children.some((child) => {
            if (child.superAdminOnly) return false;
            if (child.module) {
              if (child.module === 'dashboard') return true;
              if (!enabledModules.includes(child.module)) return false;
            }
            // All non-super-admin groups must follow permissions
            return canAccess(child.module);
          });
          return hasAccessibleChildren;
        }

        // All non-super-admin groups must follow permissions
        return canAccess(item.module);
      });

  const allItems = filteredNavItems.flatMap((item) => (item.children ? item.children : [item]));
  const currentModule = allItems.find((item) => item.to === location.pathname)?.module;
  // Block access if not super-admin and no permission
  const blocked = !loading && currentModule && !canAccess(currentModule) && !isSuperAdmin;
  
  const pageLabel = allItems.find((item) => item.to === location.pathname)?.label || 'SIMDESTA';
  const accountLabel = isSuperAdmin ? 'Super Admin' : (group?.nama || 'Tanpa Grup');

  // Area admin hanya untuk akun yang didaftarkan admin desa dan berstatus aktif.
  if (!loading && terdaftar === false) {
    return <AkunBelumTerdaftar alasan={alasan} email={user?.email} />;
  }

  // Check if current route is a disabled module (for non-super-admin)
  const isDisabledModule = !isSuperAdmin && currentModule && currentModule !== 'dashboard' && !enabledModules.includes(currentModule);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#0A635D] text-teal-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-tight tracking-tight">SIMDESTA</h1>
              <p className="text-xs text-primary-foreground/60">Desa Digital Mandiri</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary-foreground/40" />
            </div>
          )}
          {!loading && filteredNavItems.map((item) => {
            if (item.children) {
              // For super admin, show ALL children without any filtering
              const children = isSuperAdmin
                ? item.children
                : item.children.filter((child) => {
                    if (child.superAdminOnly) return false;
                    if (child.module) {
                      if (child.module === 'dashboard') return true;
                      if (!enabledModules.includes(child.module)) return false;
                    }
                    return canAccess(child.module);
                  });
              if (children.length === 0) return null;
              return (
                <div key={item.label} className="pt-2 space-y-1">
                  <div className="flex items-center gap-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-teal-100/70">
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </div>
                  {children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-orange-500 text-orange-100 shadow-md'
                            : 'text-teal-100/70 hover:bg-white/10 hover:text-primary-foreground'
                        }`}
                    >
                      <child.icon className="w-4 h-4 flex-shrink-0" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              );
            }

            // For super admin, show ALL items without any filtering (already filtered in filteredNavItems)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-500 text-orange-100 shadow-md'
                      : 'text-teal-100/70 hover:bg-white/10 hover:text-primary-foreground'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3 flex flex-col">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <UserRound className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-semibold text-primary-foreground truncate">
                {isSuperAdmin ? 'Pemilik Aplikasi' : (user?.full_name || 'Pengguna')}
              </p>
              <p className="text-primary-foreground/55 truncate">
                {isSuperAdmin ? 'Pemilik Aplikasi — Super Admin' : `${accountLabel} · ${roleLabel}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500 text-orange-100 text-sm font-semibold hover:bg-orange-600 transition-colors w-full justify-center"
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              Lihat Portal
            </Link>
            <button
              onClick={() => {
                logout(false);
                navigate('/login', { replace: true });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 text-sm font-semibold transition-colors w-full justify-center"
            >
              <LogOut className="w-4 h-4" />
              Keluar / Logout
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 flex flex-col bg-slate-50 min-h-screen text-slate-900">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-primary">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-primary text-sm lg:hidden">SIMDESTA</span>
            <span className="hidden lg:block text-sm font-semibold text-foreground truncate">{pageLabel}</span>
          </div>
          <PortalNotifications />
        </header>

        <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {isDisabledModule ? (
            <div className="max-w-md mx-auto mt-16 bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="font-heading font-bold text-lg text-foreground">Modul Ini Dinonaktifkan</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Modul <span className="font-semibold text-foreground">{ALL_MODULES[currentModule] || currentModule}</span> telah dinonaktifkan oleh Pemilik Aplikasi (Super Admin).
                <br />
                Silakan hubungi Super Admin jika Anda memerlukan akses ke modul ini.
              </p>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
              >
                <LayoutDashboard className="w-4 h-4" /> Kembali ke Dashboard
              </Link>
            </div>
          ) : blocked ? (
            <div className="max-w-md mx-auto mt-16 bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-7 h-7 text-destructive" />
              </div>
              <h2 className="font-heading font-bold text-lg text-foreground">Akses Ditolak</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Grup <span className="font-semibold text-foreground">{accountLabel}</span> tidak memiliki
                hak akses untuk membuka menu ini.
              </p>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
              >
                <LayoutDashboard className="w-4 h-4" /> Kembali ke Dashboard
              </Link>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}