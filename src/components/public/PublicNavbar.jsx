import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Building2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';

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

  return (
    <header className="sticky top-0 z-50 bg-[#0A635D] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center overflow-hidden">
              {settings.logo_url ? (
                <Image src={settings.logo_url} alt="Logo Desa" className="w-full h-full" fittingType="fit" />
              ) : (
                <Building2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h1 className="font-extrabold text-base leading-tight">Desa Tagog Apu</h1>
              <p className="text-[10px] text-teal-300/60 leading-tight">Kab. Bandung Barat</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) =>
              item.is_external ? (
                <a
                  key={item.to}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-teal-300/80 hover:bg-white/10 hover:text-teal-300 transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#E59824] text-slate-900'
                        : 'text-teal-300 hover:bg-white/10 hover:text-teal-300'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
            <Link
              to="/admin"
              onClick={(e) => {
                // Check if user is authenticated
                const isAuthenticated = localStorage.getItem('simdesta_auth_token');
                if (!isAuthenticated) {
                  e.preventDefault();
                  window.location.href = '/login?redirect=/admin';
                }
              }}
              className="ml-2 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" /> Admin
            </Link>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}