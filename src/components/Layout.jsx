import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Wallet, Store,
  Megaphone, Building2, Share2, Menu, ShieldCheck,
  Newspaper, UserCog, Globe, ClipboardList, Navigation, HardHat,
  ShieldAlert, Loader2, UserRound, MessagesSquare, LogOut, Phone
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import useAccessPermissions from '@/hooks/useAccessPermissions';
import AkunBelumTerdaftar from '@/components/admin/AkunBelumTerdaftar';
import PortalNotifications from '@/components/admin/PortalNotifications';

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
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { canAccess, group, user, loading, terdaftar, alasan } = useAccessPermissions();

  const allItems = navItems.flatMap((item) => (item.children ? item.children : [item]));
  const currentModule = allItems.find((item) => item.to === location.pathname)?.module;
  const blocked = !loading && currentModule && !canAccess(currentModule);
  const pageLabel = allItems.find((item) => item.to === location.pathname)?.label || 'SIMDESTA';
  const accountLabel = group?.nama || 'Tanpa Grup';
  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role || 'Pengguna';

  // Area admin hanya untuk akun yang didaftarkan admin desa dan berstatus aktif.
  if (!loading && terdaftar === false) {
    return <AkunBelumTerdaftar alasan={alasan} email={user?.email} />;
  }

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
          {!loading && navItems.map((item) => {
            if (item.children) {
              const children = item.children.filter((child) => canAccess(child.module));
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
                        }`
                      }
                    >
                      <child.icon className="w-4 h-4 flex-shrink-0" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              );
            }

            if (!canAccess(item.module)) return null;

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
                  }`
                }
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
                {user?.full_name || 'Pengguna'}
              </p>
              <p className="text-primary-foreground/55 truncate">{accountLabel} · {roleLabel}</p>
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
                const { logout } = useAuth();
                logout(false);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive text-sm font-semibold hover:bg-destructive/90 transition-colors shadow-lg w-full justify-center"
            >
              <LogOut className="w-4 h-4" />
              Keluar
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
          {blocked ? (
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