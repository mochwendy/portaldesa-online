import React, { useEffect, useState } from 'react';
import { fetchPendudukByNoKk } from '@/api/supabaseAdapter';
import { Users, User, Phone, Calendar, MapPin, Loader2, Pencil, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import StatusBadge from '@/components/StatusBadge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const KELUARGA_ORDER = [
  'Kepala Keluarga',
  'Istri',
  'Anak',
  'Menantu',
  'Cucu',
  'Orang Tua',
  'Mertua',
  'Famili Lain',
  'Lainnya'
];

export default function KkDetailDrawer({ open, onOpenChange, noKk, onEdit, onView }) {
  const [anggota, setAnggota] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !noKk) {
      setAnggota([]);
      setLoading(false);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    
    const fetchAnggota = async () => {
      try {
        const items = await fetchPendudukByNoKk(noKk);
        setAnggota(items || []);
      } catch (e) {
        console.error('Fetch KK detail error:', e);
        setError('Gagal memuat data anggota keluarga');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnggota();
  }, [open, noKk]);

  const handleClose = () => {
    // Ensure drawer closes properly by calling onOpenChange with false
    onOpenChange(false);
  };

  const hitungUsia = (tanggalLahir) => {
    if (!tanggalLahir) return '-';
    const birth = new Date(tanggalLahir);
    if (isNaN(birth.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 0 ? `${age} thn` : '-';
  };

  const formatNoWa = (noWa) => {
    if (!noWa) return '-';
    // Format: 628xxxxxxxxxx -> 08xx-xxxx-xxxx
    const cleaned = noWa.replace(/^62/, '0');
    if (cleaned.length >= 10) {
      return cleaned.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3');
    }
    return noWa;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aktif': return 'bg-emerald-100 text-emerald-700';
      case 'Pindah': return 'bg-amber-100 text-amber-700';
      case 'Meninggal': return 'bg-red-100 text-red-700';
      case 'Perantau': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!open) return null;

  const kepalaKeluarga = anggota.find(a => a.status_keluarga === 'Kepala Keluarga');

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right" className="w-full md:w-96 lg:w-[500px]">
      <DrawerContent className="flex flex-col h-full">
        <DrawerHeader className="border-b border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DrawerTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-primary" />
                Detail Kartu Keluarga
              </DrawerTitle>
              <p className="font-mono text-sm text-muted-foreground mt-1">No. KK: {noKk}</p>
              {kepalaKeluarga && (
                <p className="text-sm font-medium mt-1">Kepala Keluarga: {kepalaKeluarga.nama_lengkap}</p>
              )}
            </div>
            <button onClick={handleClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat anggota keluarga...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full p-8 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : anggota.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Tidak ada anggota ditemukan untuk KK ini</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Kemungkinan data belum diisi atau No. KK salah ketik</p>
            </div>
          ) : (
            <ScrollArea className="h-full p-4">
              <div className="space-y-3">
                {anggota.map((a, idx) => (
                  <div 
                    key={a.id} 
                    className="border border-border rounded-xl p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{a.nama_lengkap}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full border border-border bg-muted">
                            {a.status_keluarga || '-'}
                          </span>
                          {a.status_kependudukan && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(a.status_kependudukan)}`}>
                              {a.status_kependudukan}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="font-mono">{a.nik}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            {a.jenis_kelamin === 'Laki-laki' ? 'L' : a.jenis_kelamin === 'Perempuan' ? 'P' : '-'}
                            {a.kelompok_usia && a.kelompok_usia !== 'Tidak Diketahui' && (
                              <> · {a.kelompok_usia.replace(' Tahun', '')}</>
                            )}
                          </span>
                          {a.no_wa && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {formatNoWa(a.no_wa)}
                            </span>
                          )}
                        </div>
                        {(a.alamat || a.rt || a.rw) && (
                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {a.alamat || ''}{a.rt ? ` RT ${a.rt}` : ''}{a.rw ? ` / RW ${a.rw}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { onView?.(a); onOpenChange(false); }}
                          title="Lihat detail"
                          className="h-8 w-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { onEdit?.(a); onOpenChange(false); }}
                          title="Edit data"
                          className="h-8 w-8"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <p>Total anggota: <span className="font-semibold">{anggota.length}</span> orang</p>
                <p className="mt-1">
                  Aktif: <span className="font-semibold text-emerald-600">
                    {anggota.filter(a => a.status_kependudukan === 'Aktif').length}
                  </span>{' '}
                  | Pindah: <span className="font-semibold text-amber-600">
                    {anggota.filter(a => a.status_kependudukan === 'Pindah').length}
                  </span>{' '}
                  | Meninggal: <span className="font-semibold text-red-600">
                    {anggota.filter(a => a.status_kependudukan === 'Meninggal').length}
                  </span>{' '}
                  | Perantau: <span className="font-semibold text-blue-600">
                    {anggota.filter(a => a.status_kependudukan === 'Perantau').length}
                  </span>
                </p>
              </div>
            </ScrollArea>
          )}
        </div>

        <DrawerFooter className="border-t border-border p-4">
          <Button variant="outline" className="w-full" onClick={handleClose}>
            Tutup
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}