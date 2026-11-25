import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import UsulanStats from '@/components/pembangunan/UsulanStats';
import UsulanCharts from '@/components/pembangunan/UsulanCharts';
import UsulanStatusFlow from '@/components/pembangunan/UsulanStatusFlow';
import UsulanTable from '@/components/pembangunan/UsulanTable';
import UsulanFormDialog from '@/components/pembangunan/UsulanFormDialog';
import UsulanDetailDialog from '@/components/pembangunan/UsulanDetailDialog';
import DokumenManager from '@/components/pembangunan/DokumenManager';

const formatRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);

const safeArray = (val) => (Array.isArray(val) ? val : []);

export default function UsulanPembangunanAdmin() {
  const [usulan, setUsulan] = useState([]);
  const [dokumen, setDokumen] = useState([]);
  const [apbdes, setApbdes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: 'all', kategori: 'all' });
  const [activeTab, setActiveTab] = useState('usulan');

  const loadData = async () => {
    try {
      const [u, d, a] = await Promise.all([
        base44.entities.UsulanPembangunan.list('-created_date', 500),
        base44.entities.DokumenPembangunan.filter({ status: 'Aktif' }),
        base44.entities.APBDes.filter({ tahun_anggaran: 2026 }),
      ]);
      setUsulan(u); setDokumen(d); setApbdes(a);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredUsulan = usulan.filter(u => {
    if (filters.search && !u.judul_usulan?.toLowerCase().includes(filters.search.toLowerCase()) && !u.pengusul?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.status !== 'all' && u.status !== filters.status) return false;
    if (filters.kategori !== 'all' && u.kategori !== filters.kategori) return false;
    return true;
  });

  const handleSubmit = async (data) => {
    if (editing) await base44.entities.UsulanPembangunan.update(editing.id, data);
    else await base44.entities.UsulanPembangunan.create(data);
    setDialogOpen(false); setEditing(null); loadData();
  };

  const handleEdit = (u) => { setEditing(u); setDialogOpen(true); };
  const handleDetail = (u) => { setDetailItem(u); setDetailOpen(true); };

  const handleDelete = async (u) => {
    if (!confirm(`Hapus usulan "${u.judul_usulan}"?`)) return;
    await base44.entities.UsulanPembangunan.delete(u.id); loadData();
  };

  const handleStatusChange = async (id, status) => {
    await base44.entities.UsulanPembangunan.update(id, { status }); loadData();
  };

  const totalAnggaranUsulan = usulan.filter(u => u.status !== 'Ditolak').reduce((s, u) => s + (u.estimasi_anggaran || 0), 0);
  const apbdesItems = safeArray(apbdes);
  const totalBelanjaAPBDes = apbdesItems.filter(a => a.jenis === 'Belanja').reduce((s, a) => s + (a.anggaran || 0), 0);
  const persentaseSelaras = totalBelanjaAPBDes > 0 ? Math.min(100, Math.round((totalAnggaranUsulan / totalBelanjaAPBDes) * 100)) : 0;

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Usulan Pembangunan Desa</h1>
          <p className="text-sm text-muted-foreground">Kelola usulan dari RW/Dusun, RKPDes tahunan, dan dokumen juklak/juknis</p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" /> Tambah Usulan
        </Button>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {[
          { key: 'usulan', label: 'Data Usulan & Grafik' },
          { key: 'dokumen', label: 'Dokumen Juklak/Juknis' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'usulan' ? (
        <>
          <UsulanStats usulan={usulan} />
          <UsulanStatusFlow usulan={usulan} />
          <UsulanCharts usulan={usulan} />

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-sm mb-1">Penyelarasan dengan APBDes 2026</h3>
            <p className="text-xs text-muted-foreground mb-4">Perbandingan estimasi anggaran usulan dengan kapasitas APBDes tahun berjalan</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground">Total Estimasi Usulan</p>
                </div>
                <p className="text-lg font-extrabold text-primary">{formatRupiah(totalAnggaranUsulan)}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-muted-foreground">Anggaran Belanja APBDes</p>
                </div>
                <p className="text-lg font-extrabold text-amber-700">{formatRupiah(totalBelanjaAPBDes)}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs text-muted-foreground">Rasio Penyelarasan</p>
                </div>
                <p className="text-lg font-extrabold text-emerald-700">{persentaseSelaras}%</p>
                <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${persentaseSelaras}%` }} />
                </div>
              </div>
            </div>
          </div>

          <UsulanTable
            usulan={filteredUsulan}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDetail={handleDetail}
            filters={filters}
            onFilterChange={setFilters}
          />
        </>
      ) : (
        <DokumenManager dokumen={dokumen} onRefresh={loadData} />
      )}

      <UsulanFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        editing={editing}
      />
      <UsulanDetailDialog
        open={detailOpen}
        onOpenChange={(v) => { setDetailOpen(v); if (!v) setDetailItem(null); }}
        item={detailItem}
        onEdit={handleEdit}
      />
    </div>
  );
}