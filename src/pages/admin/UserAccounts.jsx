import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import AccountFormDialog from '@/components/users/AccountFormDialog';
import {
  Loader2, UserPlus, Pencil, Trash2, UsersRound, ShieldCheck, UserCheck, KeyRound, Info,
} from 'lucide-react';
import { ROLE_STYLES } from '@/lib/userRoles';

export default function UserAccounts() {
  const [rows, setRows] = useState([]);
  const [groups, setGroups] = useState([]);
  const [me, setMe] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [sendingId, setSendingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [akunRes, groupRes, meRes] = await Promise.allSettled([
        base44.functions.invoke('kelolaAkunAkses', { action: 'list' }).then((res) => res.data),
        base44.entities.UserGroup.list({ sort: 'urutan', limit: 100 }),
        base44.auth.me(),
      ]);

      const akunData = akunRes.status === 'fulfilled' ? (akunRes.value || {}) : {};
      const akunItems = Array.isArray(akunData?.items) ? akunData.items : [];
      const groupItems = groupRes.status === 'fulfilled' ? (Array.isArray(groupRes.value) ? groupRes.value : []) : [];
      const currentUser = meRes.status === 'fulfilled' ? meRes.value : null;

      setRows(akunItems);
      setGroups(groupItems);
      setIsSuperAdmin(Boolean(akunData.is_super_admin));
      setMe(currentUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGroupChange = async (row, code) => {
    const grupKode = code === 'none' ? '' : code;
    setUpdatingId(row.id);
    try {
      await base44.functions.invoke('kelolaAkunAkses', { action: 'set-group', id: row.id, grup_kode: grupKode });
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, grup_kode: grupKode } : r)));
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Gagal memperbarui grup pengguna.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendPassword = async (row) => {
    setSendingId(row.id);
    try {
      await base44.auth.resetPasswordRequest(row.email);
      window.alert(`Tautan untuk mengatur kata sandi dikirim ke ${row.email}.`);
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Gagal mengirim tautan kata sandi.');
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Hapus akun "${row.nama || row.email}"? Pengguna tidak dapat lagi masuk ke aplikasi.`,
    );
    if (!confirmed) return;
    setDeletingId(row.id);
    try {
      await base44.functions.invoke('kelolaAkunAkses', { action: 'delete', id: row.id });
      await load();
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Akun tidak dapat dihapus. Hubungi pengelola aplikasi.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeCount = rows.filter((r) => (r.status || 'Aktif') === 'Aktif').length;
  const isSuperGroup = (kode) => Boolean(groups.find((g) => g.kode === kode)?.is_admin);
  const adminCount = rows.filter((r) => isSuperGroup(r.grup_kode)).length;
  // Grup Super Admin hanya ditampilkan untuk Super Admin.
  const selectableGroups = isSuperAdmin ? groups : groups.filter((g) => !g.is_admin);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Akun Pengguna"
        subtitle="Daftarkan username, email, dan grup pengguna SIMDESTA"
      >
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <UserPlus className="w-4 h-4" /> Tambah Akun
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Akun', value: rows.length, icon: UsersRound },
          { label: 'Akun Aktif', value: activeCount, icon: UserCheck },
          { label: 'Super Admin', value: adminCount, icon: ShieldCheck },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-extrabold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Pengguna</th>
                <th className="text-left font-semibold px-4 py-3">Email</th>
                <th className="text-left font-semibold px-4 py-3">Username</th>
                <th className="text-left font-semibold px-4 py-3">Grup Pengguna</th>
                <th className="text-left font-semibold px-4 py-3">Kewenangan</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isMe = me && row.akun_login && row.akun_login.id === me.id;
                const isSuper = isSuperGroup(row.grup_kode);
                const role = isSuper ? 'admin' : 'user';
                const status = row.status || 'Aktif';
                return (
                  <tr key={row.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {(row.nama || row.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{row.nama || 'Belum diatur'}{isMe ? ' · Anda' : ''}</p>
                          <p className="text-xs text-muted-foreground">{row.jabatan || 'Jabatan belum diisi'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs">{row.username || '—'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {row.akun_login ? 'Sudah aktivasi' : 'Belum aktivasi'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={row.grup_kode || 'none'}
                        onValueChange={(v) => handleGroupChange(row, v)}
                        disabled={updatingId === row.id}
                      >
                        <SelectTrigger className="w-44">
                          {updatingId === row.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <SelectValue placeholder="Pilih grup" />}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tanpa grup</SelectItem>
                          {selectableGroups.map((g) => (
                            <SelectItem key={g.id} value={g.kode}>{g.nama}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_STYLES[role] || ROLE_STYLES.user}`}>
                        {isSuper ? 'Super Admin' : 'Pengguna / Staf'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status === 'Aktif' ? 'default' : 'secondary'}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditing(row); setFormOpen(true); }}
                          title="Edit akun"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendPassword(row)}
                          disabled={sendingId === row.id}
                          title="Kirim tautan atur kata sandi"
                        >
                          {sendingId === row.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <KeyRound className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id || isMe}
                          title={isMe ? 'Tidak dapat menghapus akun sendiri' : 'Hapus akun'}
                        >
                          {deletingId === row.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4 text-destructive" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Belum ada akun terdaftar. Tambahkan akun pertama Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-primary" /> Catatan Akses
        </h3>
        <p className="text-sm text-muted-foreground">
          Hanya akun yang terdaftar pada daftar ini yang dapat masuk ke area admin SIMDESTA, baik melalui
          username, email, maupun Google. Hak akses modul dan menu sepenuhnya mengikuti grup pengguna yang
          dipilih, dan hanya grup Super Admin yang memiliki akses ke seluruh modul serta menu SIMDESTA.
          Kepala Desa, Sekretaris, dan Staf mengikuti hak akses grupnya masing-masing. Akun bergrup Super
          Admin tidak ditampilkan dan hanya dapat dikelola oleh Super Admin.
        </p>
      </div>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
        onSaved={load}
      />
    </div>
  );
}