import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

/**
 * Tampilan penolakan akses untuk akun yang tidak didaftarkan admin desa
 * atau yang statusnya nonaktif.
 */
export default function AkunBelumTerdaftar({ alasan, email }) {
  const nonaktif = alasan === 'nonaktif';
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('simdesta_auth_token');
    localStorage.removeItem('simdesta_auth_user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-extrabold mb-2">
          {nonaktif ? 'Akun Dinonaktifkan' : 'Akun Belum Terdaftar'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {nonaktif
            ? 'Akun ini tidak memiliki akses aktif ke area admin SIMDESTA.'
            : 'Akun ini belum didaftarkan oleh admin SIMDESTA, sehingga tidak dapat mengakses area admin.'}
        </p>
        {email && <p className="text-xs text-muted-foreground mt-2">Email: {email}</p>}
        <p className="text-xs text-muted-foreground mt-4 mb-6">
          Hubungi admin desa untuk pendaftaran atau pengaktifan akun Anda.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" asChild>
            <Link to="/"><ArrowLeft className="w-4 h-4" /> Portal Desa</Link>
          </Button>
          <Button onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Keluar
          </Button>
        </div>
      </div>
    </div>
  );
}