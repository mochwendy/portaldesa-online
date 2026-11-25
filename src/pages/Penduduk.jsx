import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Pencil, Trash2, Filter, Download, Upload, ChevronLeft, ChevronRight, Loader2, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PendudukStatsGrid from '@/components/penduduk/PendudukStatsGrid';
import PendudukFormDialog from '@/components/penduduk/PendudukFormDialog';
import PendudukImportDialog from '@/components/penduduk/PendudukImportDialog';
import PendudukDetailDialog from '@/components/penduduk/PendudukDetailDialog';
import { fetchPendudukStats, fetchAllPenduduk, fetchRwOptions } from '@/lib/pendudukStats';
import { downloadPendudukExcel } from '@/lib/pendudukExcel';

const PAGE_SIZE = 25;

export default function Penduduk() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [pageInfo, setPageInfo] = useState({ has_more: false, next_cursor: null });
  const [cursorStack, setCursorStack] = useState([null]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRw, setFilterRw] = useState('all');
  const [rwOptions, setRwOptions] = useState([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [importOpen, setImportOpen] = useState(false);

  const cursor = cursorStack[cursorStack.length - 1];
  // Penanda permintaan terakhir: hasil pencarian lama tidak boleh menimpa data terbaru.
  const requestRef = useRef(0);

  const buildQuery = () => {
    const query = {};
    if (filterStatus !== 'all') query.status_kependudukan = filterStatus;
    if (filterRw !== 'all') query.rw = filterRw;
    const keyword = search.trim();
    if (keyword) {
      query.$or = [
        { nama_lengkap: { $regex: keyword } },
        { nik: { $regex: keyword } },
        { no_kk: { $regex: keyword } },
      ];
    }
    return query;
  };

  const loadStats = async (force = false) => {
    try {
      setStats(await fetchPendudukStats({ force }));
    } catch (e) { console.error(e); }
  };

  const loadPage = async (activeCursor) => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    try {
      const query = buildQuery();
      const [result, count] = await Promise.all([
        base44.entities.Penduduk.filter(query, {
          sort: 'nama_lengkap',
          limit: PAGE_SIZE,
          ...(activeCursor ? { cursor: activeCursor } : {}),
        }),
        base44.entities.Penduduk.count(query),
      ]);
      if (requestId !== requestRef.current) return;
      setRows(result.items || []);
      setPageInfo({ has_more: result.has_more, next_cursor: result.next_cursor });
      setTotal(count);
    } catch (e) {
      if (requestId === requestRef.current) console.error(e);
    } finally {
      if (requestId === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => { loadStats(); fetchRwOptions().then(setRwOptions).catch(() => {}); }, []);
  useEffect(() => { loadPage(cursor); }, [cursor, search, filterStatus, filterRw]);

  const resetPaging = () => setCursorStack([null]);
  const changeFilter = (setter) => (value) => { setter(value); resetPaging(); };

  const refresh = () => { loadPage(cursor); loadStats(true); };

  const remove = async (id) => {
    if (!confirm('Hapus data penduduk ini?')) return;
    await base44.entities.Penduduk.delete(id);
    refresh();
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const records = await fetchAllPenduduk();
      if (records.length === 0) return;
      downloadPendudukExcel(records);
    } finally {
      setExporting(false);
    }
  };

  const usiaText = (r) => (r.kelompok_usia ? r.kelompok_usia.replace(' Tahun', '') : '-');

  return (
    <div>
      <PageHeader title="Data Penduduk" subtitle="Data kependudukan berbasis Kartu Keluarga (KK) Desa Tagog Apu">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-1" /> Impor Excel
          </Button>
          <Button variant="outline" onClick={exportAll} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} Ekspor Excel
          </Button>
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Penduduk
          </Button>
        </div>
      </PageHeader>

      <div className="mb-6">
        <PendudukStatsGrid stats={stats} />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row gap-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIK, atau nomor KK..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPaging(); }}
              className="pl-9"
            />
          </div>
          <Select value={filterRw} onValueChange={changeFilter(setFilterRw)}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Semua RW" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua RW</SelectItem>
              {rwOptions.map((rw) => <SelectItem key={rw} value={rw}>RW {rw}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={changeFilter(setFilterStatus)}>
            <SelectTrigger className="w-full lg:w-44">
              <Filter className="w-4 h-4 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {['Aktif', 'Pindah', 'Meninggal', 'Perantau'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">NIK</th>
                <th className="text-left px-4 py-3 font-semibold">Nama</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">No. KK</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">L/P</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Usia</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Status Keluarga</th>
                <th className="text-left px-4 py-3 font-semibold hidden xl:table-cell">Pendidikan</th>
                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Pekerjaan</th>
                <th className="text-left px-4 py-3 font-semibold hidden xl:table-cell">Alamat</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{r.nik}</td>
                  <td className="px-4 py-3 font-medium">{r.nama_lengkap}</td>
                  <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-muted-foreground">{r.no_kk || '-'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{r.jenis_kelamin === 'Laki-laki' ? 'L' : r.jenis_kelamin === 'Perempuan' ? 'P' : '-'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{usiaText(r)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{r.status_keluarga || '-'}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">{r.pendidikan || '-'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{r.pekerjaan || '-'}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">
                    {r.alamat}{r.rt ? ` RT ${r.rt}` : ''}{r.rw ? `/RW ${r.rw}` : ''}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status_kependudukan} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setDetail(r)} title="Lihat semua data" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditing(r); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="text-center text-muted-foreground py-10">Memuat data...</p>}
          {!loading && rows.length === 0 && <p className="text-center text-muted-foreground py-12">Tidak ada data ditemukan</p>}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString('id-ID')} data ditemukan · halaman {cursorStack.length}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={cursorStack.length === 1 || loading} onClick={() => setCursorStack((s) => s.slice(0, -1))}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={!pageInfo.has_more || loading} onClick={() => setCursorStack((s) => [...s, pageInfo.next_cursor])}>
              Berikutnya <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      <PendudukFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initial={editing}
        onSaved={refresh}
      />
      <PendudukImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refresh}
      />
      <PendudukDetailDialog
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        penduduk={detail}
        onEdit={(p) => { setDetail(null); setEditing(p); setFormOpen(true); }}
      />
    </div>
  );
}