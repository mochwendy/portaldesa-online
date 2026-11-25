import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, FileText, MessagesSquare, Store, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { STATUS_STYLES } from '@/components/aspirasi/AspirasiTable';

const GROUPS = [
  { key: 'surat', label: 'Permohonan Surat (Portal)', to: '/admin/surat', icon: FileText, tone: 'bg-blue-50 text-blue-600' },
  { key: 'aspirasi', label: 'Aspirasi Warga', to: '/admin/aspirasi', icon: MessagesSquare, tone: 'bg-amber-50 text-amber-600' },
  { key: 'umkm', label: 'Pendaftaran UMKM Mandiri', to: '/admin/umkm', icon: Store, tone: 'bg-emerald-50 text-emerald-600' },
];

const formatTanggal = (value) =>
  value ? new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const describe = (groupKey, item) => {
  if (groupKey === 'surat') {
    return { title: item.nama_pemohon, sub: `${item.jenis_surat || '-'} · ${item.nomor_surat || '-'}`, status: item.status };
  }
  if (groupKey === 'aspirasi') {
    return { title: item.judul || item.nama, sub: `${item.nomor_tiket || '-'} · ${item.kategori || '-'}`, status: item.status };
  }
  return { title: item.nama_usaha, sub: `${item.nama_pemilik || '-'} · ${item.kategori || '-'}`, status: null };
};

export default function PortalNotifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    base44.functions
      .invoke('getPortalNotifications')
      .then((res) => setData(res.data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const pending = data?.pending || 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        className="relative w-10 h-10 rounded-xl border border-border bg-background flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        aria-label="Notifikasi portal"
      >
        <Bell className="w-5 h-5" />
        {pending > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {pending > 99 ? '99+' : pending}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-xl">
            <div className="sticky top-0 bg-card flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
              <div>
                <p className="font-bold text-sm">Notifikasi Portal</p>
                <p className="text-xs text-muted-foreground">Kiriman warga melalui portal desa</p>
              </div>
              <button
                type="button"
                onClick={load}
                className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted"
                aria-label="Muat ulang notifikasi"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="divide-y divide-border">
              {GROUPS.map((group) => {
                const groupData = data?.[group.key];
                const items = groupData?.items || [];
                return (
                  <div key={group.key} className="p-3 space-y-2">
                    <Link
                      to={group.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between gap-2 hover:underline"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center ${group.tone}`}>
                          <group.icon className="w-3.5 h-3.5" />
                        </span>
                        {group.label}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">{groupData?.count ?? 0}</span>
                    </Link>

                    {loading && !data ? (
                      <p className="text-xs text-muted-foreground py-2">Memuat...</p>
                    ) : items.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-1">Tidak ada kiriman baru.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {items.map((item) => {
                          const info = describe(group.key, item);
                          return (
                            <Link
                              key={item.id}
                              to={group.to}
                              onClick={() => setOpen(false)}
                              className="flex items-start justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{info.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {info.sub} · {formatTanggal(item.created_date)}
                                </p>
                              </div>
                              {info.status && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[info.status] || 'bg-muted text-muted-foreground'}`}>
                                  {info.status}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}