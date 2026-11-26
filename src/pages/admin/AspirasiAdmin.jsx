import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import AspirasiStats from '@/components/aspirasi/AspirasiStats';
import AspirasiTable from '@/components/aspirasi/AspirasiTable';
import AspirasiDetailDialog from '@/components/aspirasi/AspirasiDetailDialog';
import { KATEGORI_OPTIONS } from '@/components/aspirasi/AspirasiForm';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_OPTIONS = ['Baru', 'Diproses', 'Dijawab', 'Selesai', 'Ditolak'];

export default function AspirasiAdmin() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, baru: 0, diproses: 0, selesai: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [kategori, setKategori] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const buildQuery = () => {
    const query = {};
    if (status !== 'all') query.status = status;
    if (kategori !== 'all') query.kategori = kategori;
    const keyword = search.trim();
    if (keyword) {
      query.$or = [
        { nama: { $regex: keyword } },
        { nik: { $regex: keyword } },
        { nomor_tiket: { $regex: keyword } },
        { judul: { $regex: keyword } },
      ];
    }
    return query;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const [page, total, baru, diproses, selesai] = await Promise.all([
        base44.entities.Aspirasi.filter(query, { sort: '-created_date', limit: 50 }),
        base44.entities.Aspirasi.count(query),
        base44.entities.Aspirasi.count({ status: 'Baru' }),
        base44.entities.Aspirasi.count({ status: 'Diproses' }),
        base44.entities.Aspirasi.count({ status: 'Selesai' }),
      ]);
      setItems(page || []);
      setStats({ total, baru, diproses, selesai });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadData, 250);
    return () => clearTimeout(timer);
  }, [search, status, kategori]);

  const openDetail = (item) => {
    setSelected(item);
    setDialogOpen(true);
  };

  const remove = async (item) => {
    if (!confirm(`Hapus aspirasi ${item.nomor_tiket} dari ${item.nama}?`)) return;
    await base44.entities.Aspirasi.delete(item.id);
    loadData();
  };

  return (
    <div>
      <PageHeader title="Pengelolaan Aspirasi Warga" subtitle="Tampung, tindak lanjuti, dan jawab aspirasi warga dari portal smart desa">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/aspirasi" target="_blank">
              <ExternalLink className="w-4 h-4 mr-1" /> Formulir Publik
            </Link>
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" /> Muat Ulang
          </Button>
        </div>
      </PageHeader>

      <div className="mb-6">
        <AspirasiStats stats={stats} />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row gap-3 border-b border-border">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIK, nomor tiket, atau judul..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full lg:w-44"><SelectValue placeholder="Semua Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={kategori} onValueChange={setKategori}>
            <SelectTrigger className="w-full lg:w-52"><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {KATEGORI_OPTIONS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <AspirasiTable items={items} loading={loading} onDetail={openDetail} onDelete={remove} />

        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Menampilkan {items.length} dari {stats.total.toLocaleString('id-ID')} aspirasi sesuai filter.
          </p>
        </div>
      </div>

      <AspirasiDetailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        aspirasi={selected}
        onSaved={loadData}
      />
    </div>
  );
}