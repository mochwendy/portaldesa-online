import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  FileText, Plus, Search, Filter, CheckCircle, Clock, XCircle, FilePen
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import SuratProsesDialog from '@/components/surat/SuratProsesDialog';
import { kirimNotifikasiSelesai } from '@/lib/suratWaSelesai';

const today = new Date().toISOString().split('T')[0];

export default function LayananSurat() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [active, setActive] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setRecords(await base44.entities.SuratKeterangan.list('-created_date', 200));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = records.filter((r) => {
    const matchSearch = !search ||
      r.nama_pemohon?.toLowerCase().includes(search.toLowerCase()) ||
      r.nik_pemohon?.includes(search);
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const diajukan = records.filter((r) => r.status === 'Diajukan').length;
  const diproses = records.filter((r) => r.status === 'Diproses').length;
  const selesai = records.filter((r) => r.status === 'Selesai').length;

  const nomorBaru = `470/${String(records.length + 1).padStart(4, '0')}/SK/${new Date().getFullYear()}`;

  const openProses = (record) => { setActive(record); setDialogOpen(true); };

  const updateStatus = async (id, status) => {
    await base44.entities.SuratKeterangan.update(id, {
      status,
      tanggal_selesai: status === 'Selesai' ? today : undefined
    });
    if (status === 'Selesai') {
      const surat = records.find((r) => r.id === id);
      if (surat?.no_telepon) {
        await kirimNotifikasiSelesai(surat);
      } else {
        alert('Status diperbarui ke Selesai, namun nomor WhatsApp warga tidak tersedia. Notifikasi tidak dapat dikirim.');
      }
    }
    load();
  };

  const remove = async (id) => {
    if (!confirm('Hapus pengajuan surat ini?')) return;
    await base44.entities.SuratKeterangan.delete(id);
    load();
  };

  return (
    <div>
      <PageHeader title="Layanan Surat Keterangan" subtitle="Pembuatan surat pengantar, keterangan, dan pernyataan berbasis NIK — dari portal maupun loket desa">
        <Button onClick={() => openProses(null)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-1" /> Buat Surat Baru
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Total Surat" value={records.length} accent="bg-primary/10 text-primary" />
        <StatCard icon={Clock} label="Diajukan" value={diajukan} accent="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock} label="Diproses" value={diproses} accent="bg-amber-50 text-amber-600" />
        <StatCard icon={CheckCircle} label="Selesai" value={selesai} accent="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari nama atau NIK pemohon..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Diajukan">Diajukan</SelectItem>
              <SelectItem value="Diproses">Diproses</SelectItem>
              <SelectItem value="Disetujui">Disetujui</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Ditolak">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Memuat data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Nomor</th>
                  <th className="text-left px-4 py-3 font-semibold">Pemohon</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Jenis Surat</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Saluran</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{r.nomor_surat}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{r.nama_pemohon}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.nik_pemohon}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{r.jenis_surat}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{r.channel || 'Portal'}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openProses(r)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" title="Buat / edit surat">
                          <FilePen className="w-4 h-4" />
                        </button>
                        {r.status === 'Diajukan' && (
                          <button onClick={() => updateStatus(r.id, 'Diproses')} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Proses">
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {r.status === 'Diproses' && (
                          <button onClick={() => updateStatus(r.id, 'Selesai')} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Selesai">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Hapus">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Belum ada pengajuan surat</p>
            )}
          </div>
        )}
      </div>

      <SuratProsesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        record={active}
        nomorBaru={nomorBaru}
        onSaved={load}
      />
    </div>
  );
}