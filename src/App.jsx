import ErrorBoundary from '@/lib/ErrorBoundary';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import PublicLayout from '@/components/public/PublicLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';

// Mengarahkan tamu ke halaman masuk sambil menyimpan tujuan awal (mis. /admin/surat).
const ToLogin = () => (
  <Navigate
    to={`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`}
    replace
  />
);

// Public website pages
import Beranda from '@/pages/public/Beranda';
import BeritaPublik from '@/pages/public/BeritaPublik';
import BeritaDetail from '@/pages/public/BeritaDetail';
import ProfilDesaPublik from '@/pages/public/ProfilDesaPublik';
import PerangkatDesaPublik from '@/pages/public/PerangkatDesaPublik';
import TransparansiAPBDesPublik from '@/pages/public/TransparansiAPBDesPublik';
import LayananSuratPublik from '@/pages/public/LayananSuratPublik';
import MarketplaceUMKM from '@/pages/public/MarketPlaceUMKM';
import RencanaPembangunanPublik from '@/pages/public/RencanaPembangunanPublik';
import RealisasiPembangunanPublik from '@/pages/public/RealisasiPembangunanPublik';
import DaftarUMKM from '@/pages/public/DaftarUMKM';
import AspirasiWarga from '@/pages/public/AspirasiWarga';
import VerifikasiSurat from '@/pages/public/VerifikasiSurat';
import UnduhSurat from '@/pages/public/UnduhSurat';

// Admin/CMS pages
import Dashboard from '@/pages/Dashboard';
import Penduduk from '@/pages/Penduduk';
import LayananSurat from '@/pages/LayananSurat';
import TransparansiAPBDes from '@/pages/TransparansiAPBDes';
import UMKM from '@/pages/UMKM';
import Pengumuman from '@/pages/Pengumuman';
import ProfilDesa from '@/pages/ProfilDesa';
import IntegrasiSistem from '@/pages/IntegrasiSistem';
import BeritaAdmin from '@/pages/admin/BeritaAdmin';
import PerangkatDesaAdmin from '@/pages/admin/PerangkatDesaAdmin';
import UsulanPembangunanAdmin from '@/pages/admin/UsulanPembangunanAdmin';
import UserGroups from '@/pages/admin/UserGroups';
import UserAccounts from '@/pages/admin/UserAccounts';
import MenuPortalAdmin from '@/pages/admin/MenuPortalAdmin';
import PengaturanWebsite from '@/pages/admin/PengaturanWebsite';
import RealisasiPembangunanAdmin from '@/pages/admin/RealisasiPembangunanAdmin';
import AspirasiAdmin from '@/pages/admin/AspirasiAdmin';
import KontakDaruratAdmin from '@/pages/admin/KontakDaruratAdmin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Catatan: Untuk website publik berfungsi tanpa login, atur visibilitas app
  // ke "Public" di Dashboard → App Settings → General → App Visibility.
  // ProtectedRoute akan menangani redirect ke login untuk halaman admin.

  return (
    <ErrorBoundary>
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />

      {/* Public website routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Beranda />} />
        <Route path="/berita" element={<BeritaPublik />} />
        <Route path="/berita/:id" element={<BeritaDetail />} />
        <Route path="/profil-desa" element={<ProfilDesaPublik />} />
        <Route path="/perangkat-desa" element={<PerangkatDesaPublik />} />
        <Route path="/transparansi-apbdes" element={<TransparansiAPBDesPublik />} />
        <Route path="/layanan-surat" element={<LayananSuratPublik />} />
        <Route path="/marketplace-umkm" element={<MarketplaceUMKM />} />
        <Route path="/daftar-umkm" element={<DaftarUMKM />} />
        <Route path="/aspirasi" element={<AspirasiWarga />} />
        <Route path="/verifikasi-surat" element={<VerifikasiSurat />} />
        <Route path="/verifikasi-surat/:kode" element={<VerifikasiSurat />} />
        <Route path="/unduh-surat" element={<UnduhSurat />} />
        <Route path="/rencana-pembangunan" element={<RencanaPembangunanPublik />} />
        <Route path="/realisasi-pembangunan" element={<RealisasiPembangunanPublik />} />
      </Route>

      {/* Admin/CMS routes */}
      <Route element={<ProtectedRoute unauthenticatedElement={<ToLogin />} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/penduduk" element={<Penduduk />} />
          <Route path="/admin/surat" element={<LayananSurat />} />
          <Route path="/admin/apbdes" element={<TransparansiAPBDes />} />
          <Route path="/admin/pembangunan" element={<UsulanPembangunanAdmin />} />
          <Route path="/admin/umkm" element={<UMKM />} />
          <Route path="/admin/pengumuman" element={<Pengumuman />} />
          <Route path="/admin/profil-desa" element={<ProfilDesa />} />
          <Route path="/admin/berita" element={<BeritaAdmin />} />
          <Route path="/admin/perangkat-desa" element={<PerangkatDesaAdmin />} />
          <Route path="/admin/integrasi" element={<IntegrasiSistem />} />
          <Route path="/admin/pengguna" element={<Navigate to="/admin/pengguna/grup" replace />} />
          <Route path="/admin/pengguna/grup" element={<UserGroups />} />
          <Route path="/admin/pengguna/akun" element={<UserAccounts />} />
          <Route path="/admin/menu-portal" element={<MenuPortalAdmin />} />
          <Route path="/admin/pengaturan-website" element={<PengaturanWebsite />} />
          <Route path="/admin/realisasi" element={<RealisasiPembangunanAdmin />} />
          <Route path="/admin/aspirasi" element={<AspirasiAdmin />} />
          <Route path="/admin/kontak-darurat" element={<KontakDaruratAdmin />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
