import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import AccessibilityWidget from './AccessibilityWidget';
import EmergencyWidget from './EmergencyWidget';
import useWebsiteSettings from '@/hooks/useWebsiteSettings';
import { FileText, BarChart3, Home, ShoppingBag, MessageSquare } from 'lucide-react';

export default function PublicLayout() {
  const { settings } = useWebsiteSettings();
  const location = useLocation();

  const bottomNavItems = [
    { to: '/layanan-surat', label: 'Surat', icon: FileText },
    { to: '/transparansi-apbdes', label: 'Transparansi', icon: BarChart3 },
    { to: '/', label: 'Beranda', icon: Home, isCenter: true },
    { to: '/marketplace-umkm', label: 'Marketplace', icon: ShoppingBag },
    { to: '/aspirasi', label: 'Aspirasi', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <PublicNavbar />
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter />
      <AccessibilityWidget />
      <EmergencyWidget />

      {/* Bilah Navigasi Bawah Khusus HP */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 shadow-lg px-2 py-2">
        <div className="flex items-center justify-around">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            if (item.isCenter) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex flex-col items-center justify-center -mt-5 group"
                >
                  <div className="w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 hover:bg-teal-700 transition-transform transform active:scale-95">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 mt-1">{item.label}</span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                  isActive ? 'text-teal-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-none">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
