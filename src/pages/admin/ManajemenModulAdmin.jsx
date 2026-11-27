import React, { useState, useEffect } from 'react';
import { useAuth, useRoleAccess } from '@/lib/AuthContext';
import useAccessPermissions from '@/hooks/useAccessPermissions';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { ShieldCheck, Sliders, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

const ALL_MODULES = {
  dashboard: 'Dashboard',
  penduduk: 'Data Penduduk',
  layanan_surat: 'Layanan Surat',
  apbdes: 'Transparansi APBDes',
  pembangunan: 'Usulan Pembangunan',
  umkm: 'UMKM & BUMDes',
  berita: 'Berita Desa',
  aspirasi: 'Aspirasi Warga',
  kontak_darurat: 'Nomor Darurat',
  profil_desa: 'Profil Desa',
  pengguna: 'Pengelolaan Pengguna',
  pengaturan_web: 'Pengaturan Aplikasi',
};

const moduleDescriptions = {
  dashboard: 'Halaman utama dengan ringkasan aktivitas desa',
  penduduk: 'Data dan informasi penduduk desa',
  layanan_surat: 'Proses pengelolaan surat desa',
  apbdes: 'Anggaran Pendapatan dan Belanja Desa',
  pembangunan: 'Usulan dan proyek pembangunan desa',
  umkm: 'Usaha Kecil Menengah Desa',
  berita: 'Berita dan info terkini desa',
  aspirasi: 'Aspirasi dan masukan warga',
  kontak_darurat: 'Nomor darurat desa (Ambulans, Bhabinkamtibmas, ds.)',
  profil_desa: 'Profil dan identitas desa',
  pengguna: 'Pengelolaan akun dan grup pengguna',
  pengaturan_web: 'Konfigurasi tampilan aplikasi',
};

export default function ManajemenModulAdmin() {
  const { user } = useAuth();
  const { canAccess, group, loading, terdaftar, alasan } = useAccessPermissions();
  const [enabledModules, setEnabledModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    // Initialize enabled modules from localStorage or default to all
    const stored = localStorage.getItem('simdesta_enabled_modules');
    if (stored) {
      try {
        setEnabledModules(JSON.parse(stored));
      } catch {
        setEnabledModules(Object.keys(ALL_MODULES));
      }
    } else {
      // Default: all modules active for super admin
      setEnabledModules(Object.keys(ALL_MODULES));
    }
    setIsLoading(false);
  }, []);

  const handleToggle = (moduleId) => {
    setEnabledModules(prev => {
      const idx = prev.indexOf(moduleId);
      if (idx === -1) {
        // Add module
        return [...prev, moduleId];
      } else {
        // Remove module - prevent disabling dashboard
        if (moduleId === 'dashboard') {
          toast({
            title: 'Tidak Dapat Menonaktifkan Dashboard',
            description: 'Dashboard adalah modul wajib dan tidak bisa dinonaktifkan.',
            variant: 'destructive',
          });
          return prev;
        }
        return prev.filter(id => id !== moduleId);
      }
    });
  };

  const handleSave = () => {
    localStorage.setItem('simdesta_enabled_modules', JSON.stringify(enabledModules));
    toast({
      title: 'Pengaturan Tersimpan',
      description: 'Modul aplikasi telah diperbarui. Perubahan berlaku untuk Admin Desa dan Operator.',
      variant: 'default',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">Akses Ditolak</h2>
        <p className="text-muted-foreground">Halaman ini hanya dapat diakses oleh Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Kontrol Modul Aplikasi</h2>
        <Button onClick={handleSave} variant={saved ? 'secondary' : 'default'} disabled={saved}>
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Tersimpan
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
      
      <p className="text-muted-foreground mb-6 max-w-2xl">
        Atur modul mana yang tersedia untuk Admin Desa dan Operator. 
        Super Admin selalu memiliki akses ke semua modul. 
        Modul yang dinonaktifkan akan disembunyikan dari sidebar dan tidak dapat diakses melalui URL.
      </p>

      <Table>
        <TableHeader>
          <TableCell className="w-48">Modul</TableCell>
          <TableCell>Deskripsi</TableCell>
          <TableCell className="w-32 text-center">Status</TableCell>
          <TableCell className="w-24" />
        </TableHeader>
        <TableBody>
          {Object.entries(ALL_MODULES).map(([key, name]) => {
            const isEnabled = enabledModules.includes(key);
            const isDashboard = key === 'dashboard';
            return (
              <TableRow key={key} className="border-b hover:bg-primary/5">
                <TableCell className="font-medium">
                  {name}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {moduleDescriptions[key]}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggle(key)}
                    disabled={isDashboard}
                    aria-label={isEnabled ? `Nonaktifkan ${name}` : `Aktifkan ${name}`}
                  />
                </TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {isDashboard && <span className="text-primary">Wajib</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="mt-6 flex gap-4">
        <Button 
          variant="outline"
          onClick={() => {
            const allIds = Object.keys(ALL_MODULES).filter(id => id !== 'dashboard');
            if (enabledModules.filter(id => id !== 'dashboard').length === allIds.length) {
              setEnabledModules(['dashboard']);
            } else {
              setEnabledModules([...new Set([...enabledModules, ...allIds])]);
            }
          }}
        >
          {enabledModules.filter(id => id !== 'dashboard').length === Object.keys(ALL_MODULES).length - 1 
            ? 'Nonaktifkan Semua (Kecuali Dashboard)' 
            : 'Aktifkan Semua Modul'}
        </Button>
      </div>
    </div>
  );
}