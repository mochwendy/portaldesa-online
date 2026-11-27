import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Building2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';
import { useAuth } from '@/lib/AuthContext';

const FALLBACK_ITEMS = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/profil-desa', label: 'Profil Desa' },
  { to: '/perangkat-desa', label: 'Perangkat Desa' },
  { to: '/berita', label: 'Berita' },
  { to: '/rencana-pembangunan', label: 'Rencana Pembangunan' },
  { to: '/transparansi-apbdes', label: 'Transparansi' },
  { to: '/layanan-surat', label: 'Layanan Surat' },
  { to: '/marketplace-umkm', label: 'Marketplace' },
  { to: '/aspirasi', label: 'Aspirasi Warga' },
];

export default function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState(FALLBACK_ITEMS);
  const { settings } = useWebsiteSettings();
  const { isAuthenticated, isLoadingAuth } = useAuth();

  useEffect(() => {
    base44.entities.MenuPortal.filter(
      { published: true, kategori: 'menu_utama' },
      { sort: 'urutan', limit: 50 }
    )
      .then((result) => {
        if (result && result.items && result.items.length > 0) {
          setNavItems(result.items.map((m) => ({
            to: m.path,
            label: m.label,
            end: m.path === '/',
            is_external: !!m.is_external,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const adminLink = isAuthenticated ? '/admin' : '/login?redirect=/admin';
  const adminLabel = isAuthenticated ? 'Admin' : 'Admin / Masuk';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center overflow-hidden">
              {settings.logo_url ? (
                <Image src={settings.logo_url} alt="Logo Desa" className="w-full h-full" fittingType="fit" />
              ) : (
                <Building2 className="w-5 h-5 text-teal-600" />
              )}
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight text-slate-900">Desa Tagog Apu</h1>
              <p className="text-[10px] text-slate-500 leading-tight">Kab. Bandung Barat</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-2">
            {navItems.map((item) =>
              item.is_external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  {item.label}
                </NavLink>
              )
            )}
            <Link
              to={adminLink}
              className="ml-2 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" /> {adminLabel}
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-16 inset-x-0 bg-white border-b border-slate-200 shadow-xl px-4 py-4 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
          {navItems.map((item) =>
            item.is_external ? (
              <a
                key={item.to}
                href={item.to}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                  }`}
              >
                {item.label}
              </NavLink>
            )
          )}
          <Link
            to={adminLink}
            onClick={() => setMobileOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            <Lock className="w-4 h-4" /> {adminLabel}
          </Link>
        </div>
      )}
    </header>
  );
}
