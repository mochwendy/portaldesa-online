import React, { useEffect, useState, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, Save, UserPlus, Key, Eye, EyeOff } from 'lucide-react';
const EMPTY = {
  nama: '', email: '', username: '', password: '', passwordConfirm: '', showPassword: false, grup_kode: '', jabatan: '', status: 'Aktif',
};

const ROLE_LABELS_BY_LEVEL = {
  3: 'Super Admin',
  2: 'Admin Desa',
  1: 'Operator',
  0: 'Warga',
};

const USERNAME_PATTERN = /^[a-z0-9._-]{3,}$/;

export default function AccountFormDialog({ open, onOpenChange, account, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [meEmail, setMeEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permissionPreview, setPermissionPreview] = useState(null);

  // Import required modules for permission preview
  const [ADMIN_MODULES, parsePermissions] = useMemo(() => {
    // Lazy load to avoid circular dependency issues
    return [null, null];
  }, []);

  // Load groups and permissions on open
  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(account ? {
      nama: account.nama || '',
      email: account.email || '',
      username: account.username || '',
      password: account.password || '',
      passwordConfirm: '',
      showPassword: false,
      grup_kode: account.grup_kode || '',
      jabatan: account.jabatan || '',
      status: account.status || 'Aktif',
    } : EMPTY);

    setLoadingGroups(true);
    base44.entities.UserGroup.list({ sort: 'urutan', limit: 100 })
      .then((res) => setGroups(Array.isArray(res) ? res : []))
      .catch(() => setGroups([]))
      .finally(() => setLoadingGroups(false));

    base44.auth.me()
      .then((u) => setMeEmail((u?.email || '').toLowerCase()))
      .catch(() => setMeEmail(''));
  }, [open, account]);

  // Load permission preview when group changes
  useEffect(() => {
    if (form.grup_kode && groups.length > 0) {
      const selectedGroup = groups.find(g => g.kode === form.grup_kode);
      if (selectedGroup) {
        // Get enabled modules from localStorage
        let enabledModules = [];
        try {
          const stored = localStorage.getItem('simdesta_enabled_modules');
          enabledModules = stored ? JSON.parse(stored) : [];
        } catch {
          enabledModules = [];
        }

        // Import ADMIN_MODULES and parsePermissions
        import('@/lib/adminModules').then(({ ADMIN_MODULES, parsePermissions }) => {
          // Filter modules for non-super-admin
          const filteredModules = ADMIN_MODULES.filter(m => enabledModules.length === 0 || enabledModules.includes(m.key));
          
          // Count allowed modules based on group permissions and enabled modules
          const permissions = parsePermissions(selectedGroup.permissions);
          let allowedCount = 0;
          const allowedModules = [];
          for (const mod of filteredModules) {
            if (permissions[mod.key]?.view) {
              allowedCount++;
              allowedModules.push({ key: mod.key, label: mod.label });
            }
          }
          
          setPermissionPreview({
            group: selectedGroup,
            allowedCount,
            totalModules: filteredModules.length,
            loading: false,
            disabledModules: ADMIN_MODULES.length - filteredModules.length,
            allowedModules,
          });
        }).catch(() => {
          setPermissionPreview({ group: selectedGroup, loading: false });
        });
      }
    } else {
      setPermissionPreview(null);
    }
  }, [form.grup_kode, groups]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const selectedGroup = groups.find((g) => g.kode === form.grup_kode) || null;
  // Kewenangan mengikuti grup: hanya grup dengan role_level >= 2 yang berhak 'admin'.
  const role = (selectedGroup?.role_level ?? 1) >= 2 ? 'admin' : 'user';

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

    // Password validation
    if (!account && form.password && form.password.length < 8) {
      return setError('Kata sandi minimal 8 karakter.');
    }
    if (form.password && form.password !== form.passwordConfirm) {
      return setError('Konfirmasi kata sandi tidak sama.');
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
        password: form.password || undefined,
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

  // Get allowed modules count for a group
  const getAllowedModulesCount = (group) => {
    if (!group) return 0;
    try {
      const permissions = parsePermissions(group.permissions);
      // Count modules with 'view' permission
      return Object.keys(permissions).filter(key => permissions[key]?.view).length;
    } catch {
      return 0;
    }
  };

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

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password-akun">Kata Sandi</Label>
              <div className="relative">
                <Input
                  id="password-akun"
                  type={form.showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder={account ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
                  className="pr-10 h-12"
                  autoComplete={account ? 'off' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => set('showPassword', !form.showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={form.showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {form.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.password && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Akan di-hash & disimpan untuk login
                </p>
              )}
              {!form.password && !account && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Kosongkan untuk menggunakan default: <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs">tagogapu123</code>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirm">Konfirmasi Kata Sandi</Label>
              <div className="relative">
                <Input
                  id="password-confirm"
                  type={form.showPassword ? 'text' : 'password'}
                  value={form.passwordConfirm || ''}
                  onChange={(e) => set('passwordConfirm', e.target.value)}
                  placeholder="Ulangi kata sandi"
                  className="pr-10 h-12"
                  autoComplete={account ? 'off' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => set('showPassword', !form.showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={form.showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {form.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
                {selectableGroups.map((g) => {
                  const roleLevel = g.role_level ?? 1;
                  const roleLabel = ROLE_LABELS_BY_LEVEL[roleLevel] || 'Operator';
                  const displayText = `${g.nama} (${g.kode}) — ${roleLabel}`;
                  return <SelectItem key={g.id} value={g.kode}>{displayText}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Hak akses modul dan menu mengikuti pengaturan grup yang dipilih. Hanya grup Super Admin
              yang memiliki akses ke seluruh modul dan menu SIMDESTA.
            </p>
            
            {/* Permission Preview */}
            {permissionPreview && !permissionPreview.loading && permissionPreview.group && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Pratinjau Hak Akses:</p>
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Badge variant="secondary" className="px-3 py-1 text-xs">
                    {permissionPreview.allowedCount} / {permissionPreview.totalModules} modul aktif
                  </Badge>
                  {permissionPreview.disabledModules > 0 && (
                    <Badge variant="destructive" className="px-3 py-1 text-xs">
                      {permissionPreview.disabledModules} modul dinonaktifkan
                    </Badge>
                  )}
                  <Badge variant="outline" className="px-3 py-1 text-xs">
                    Level: {permissionPreview.group.role_level ?? 1} ({ROLE_LABELS_BY_LEVEL[permissionPreview.group.role_level ?? 1] || 'Operator'})
                  </Badge>
                </div>
                {permissionPreview.allowedModules && permissionPreview.allowedModules.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Modul yang dapat diakses:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {permissionPreview.allowedModules.map((mod, i) => (
                        <Badge key={i} variant="outline" className="text-xs px-2 py-0.5">
                          {mod.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ini adalah modul yang akan tersedia untuk akun ini saat login.
                </p>
              </div>
            )}
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