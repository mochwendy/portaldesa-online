import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2, Save, UserPlus } from 'lucide-react';

const EMPTY = {
  nama: '', email: '', username: '', grup_kode: '', jabatan: '', status: 'Aktif',
};

const USERNAME_PATTERN = /^[a-z0-9._-]{3,}$/;

export default function AccountFormDialog({ open, onOpenChange, account, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [meEmail, setMeEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(account ? {
      nama: account.nama || '',
      email: account.email || '',
      username: account.username || '',
      grup_kode: account.grup_kode || '',
      jabatan: account.jabatan || '',
      status: account.status || 'Aktif',
    } : EMPTY);

    setLoadingGroups(true);
    base44.entities.UserGroup.list({ sort: 'urutan', limit: 100 })
      .then((res) => setGroups(res?.items || []))
      .catch(() => setGroups([]))
      .finally(() => setLoadingGroups(false));

    base44.auth.me()
      .then((u) => setMeEmail((u?.email || '').toLowerCase()))
      .catch(() => setMeEmail(''));
  }, [open, account]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedGroup = groups.find((g) => g.kode === form.grup_kode) || null;
  // Kewenangan mengikuti grup: hanya grup bertanda Super Admin yang berhak penuh.
  const role = selectedGroup?.is_admin ? 'admin' : 'user';

  const handleSave = async () => {
    setError('');

    const nama = form.nama.trim();
    const email = form.email.trim().toLowerCase();
    const username = form.username.trim().toLowerCase();

    if (!nama) return setError('Nama lengkap wajib diisi.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Email tidak valid. Gunakan email aktif pengguna.');
    if (!USERNAME_PATTERN.test(username)) {
      return setError('Username minimal 3 karakter, tanpa spasi (huruf, angka, titik, garis bawah, strip).');
    }
    if (!form.grup_kode) {
      return setError('Pilih grup pengguna agar hak akses modul dan menunya mengikuti pengaturan grup.');
    }
    if (account && meEmail && (account.email || '').toLowerCase() === meEmail
      && form.status !== 'Aktif') {
      return setError('Akun Anda sendiri harus tetap berstatus Aktif.');
    }

    setSaving(true);
    try {
      const payload = {
        nama,
        email,
        username,
        role,
        grup_kode: form.grup_kode,
        jabatan: form.jabatan.trim(),
        status: form.status,
      };

      if (account) {
        await base44.functions.invoke('kelolaAkunAkses', { ...payload, action: 'save', id: account.id });
        onOpenChange(false);
        onSaved?.();
        return;
      }

      await base44.functions.invoke('kelolaAkunAkses', { ...payload, action: 'save' });

      let note = `Akun "${nama}" tersimpan. Email undangan untuk membuat kata sandi dikirim ke ${email}.`;
      try {
        await base44.users.inviteUser(email, role);
      } catch (e) {
        try {
          await base44.auth.resetPasswordRequest(email);
          note = `Akun "${nama}" tersimpan. Tautan pengaturan kata sandi dikirim ke ${email}.`;
        } catch (e2) {
          note = `Akun "${nama}" tersimpan, tetapi email undangan gagal dikirim. `
            + 'Gunakan tombol "Kirim Tautan Sandi" pada daftar akun untuk mengirim ulang.';
        }
      }

      onOpenChange(false);
      onSaved?.();
      window.alert(note);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Gagal menyimpan akun pengguna.');
    } finally {
      setSaving(false);
    }
  };

  const noGroups = !loadingGroups && groups.length === 0;

  // Grup Super Admin bukan bagian dari jenjang kewenangan admin desa, jadi tidak ditawarkan.
  const isSuperAdminGroup = (g) => g.kode === 'SU' || /super\s*admin/i.test(g.nama || '');
  const selectableGroups = groups.filter(
    (g) => !isSuperAdminGroup(g) || g.kode === form.grup_kode,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-xl">
        <div className="bg-slate-700 px-6 py-4">
          <DialogTitle className="text-white text-base font-semibold">
            {account ? 'Form Akun Pengguna' : 'Form Akun Pengguna Baru'}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-xs mt-1">
            {account
              ? 'Perbarui identitas, grup, dan status akun pengguna.'
              : 'Akun dibuat oleh admin desa; hak akses mengikuti grup pengguna yang dipilih.'}
          </DialogDescription>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nama-akun">Nama Lengkap</Label>
              <Input
                id="nama-akun"
                value={form.nama}
                onChange={(e) => set('nama', e.target.value)}
                placeholder="Nama lengkap pengguna"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jabatan-akun">Jabatan / Unit Kerja</Label>
              <Input
                id="jabatan-akun"
                value={form.jabatan}
                onChange={(e) => set('jabatan', e.target.value)}
                placeholder="Contoh: Kaur Keuangan"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-akun">Email (Google / Undangan)</Label>
              <Input
                id="email-akun"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="nama@gmail.com"
                disabled={Boolean(account)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username-akun">Username Login</Label>
              <Input
                id="username-akun"
                value={form.username}
                onChange={(e) => set('username', e.target.value.toLowerCase())}
                placeholder="contoh: kaur.keuangan"
                className="lowercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grup Pengguna</Label>
            <Select
              value={form.grup_kode || 'none'}
              onValueChange={(v) => set('grup_kode', v === 'none' ? '' : v)}
              disabled={loadingGroups}
            >
              <SelectTrigger>
                {loadingGroups
                  ? <span className="text-muted-foreground text-sm">Memuat grup…</span>
                  : <SelectValue placeholder="Pilih grup" />}
              </SelectTrigger>
              <SelectContent>
                {selectableGroups.map((g) => (
                  <SelectItem key={g.id} value={g.kode}>{g.nama} ({g.kode})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Hak akses modul dan menu mengikuti pengaturan grup yang dipilih. Hanya grup Super Admin
              yang memiliki akses ke seluruh modul dan menu SIMDESTA.
            </p>
            {noGroups && (
              <p className="text-xs text-destructive">
                Belum ada grup pengguna. <Link to="/admin/pengguna/grup" className="underline font-medium">Tambah grup</Link> lebih dulu.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status Akun</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!account && (
            <p className="text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg p-3">
              Pengguna masuk dengan username atau email yang didaftarkan di sini. Kata sandi dibuat sendiri oleh
              pengguna melalui email undangan/tautan atur sandi, sehingga tidak disimpan di aplikasi.
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Batal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : account ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {account ? 'Simpan' : 'Simpan & Undang'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}