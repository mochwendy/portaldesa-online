import React, { useEffect, useState } from 'react';
import { createSupabaseEntity } from '@/api/supabaseAdapter.js';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Save, Shield, User, Users, Building2 } from 'lucide-react';
import { serializePermissions } from '@/lib/adminModules';
import { ROLES, ROLE_LABELS, ROLE_LEVELS, SUPER_ADMIN_CREDENTIALS } from '@/lib/AuthContext';
import { useAuth } from '@/lib/AuthContext';

const EMPTY = {
  nama: '', kode: '', deskripsi: '', is_admin: false, required_app_id: false, role_level: 1,
};

export default function GroupFormDialog({ open, onOpenChange, group, onSaved }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN || user?.email === SUPER_ADMIN_CREDENTIALS.email;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Role options for dropdown
  const roleOptions = [
    { value: ROLE_LEVELS[ROLES.SUPER_ADMIN], label: ROLE_LABELS[ROLES.SUPER_ADMIN], icon: Shield, restricted: true },
    { value: ROLE_LEVELS[ROLES.ADMIN_DESA], label: ROLE_LABELS[ROLES.ADMIN_DESA], icon: Building2 },
    { value: ROLE_LEVELS[ROLES.OPERATOR], label: ROLE_LABELS[ROLES.OPERATOR], icon: Users },
    { value: ROLE_LEVELS[ROLES.WARGA], label: ROLE_LABELS[ROLES.WARGA], icon: User },
  ];

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(group ? {
      nama: group.nama || '',
      kode: group.kode || '',
      deskripsi: group.deskripsi || '',
      is_admin: Boolean(group.is_admin),
      required_app_id: Boolean(group.required_app_id),
      role_level: group.role_level ?? 1,
    } : EMPTY);
  }, [open, group]);

  // Auto-set is_admin when role_level changes
  const setRoleLevel = (value) => {
    const level = parseInt(value, 10);
    setForm(prev => ({
      ...prev,
      role_level: level,
      is_admin: level >= ROLE_LEVELS[ROLES.ADMIN_DESA],
    }));
  };

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setError('');
    if (!form.nama.trim() || !form.kode.trim()) {
      setError('Nama grup dan kode grup wajib diisi.');
      return;
    }
    // Prevent non-super-admin from creating super_admin groups
    if (!isSuperAdmin && form.role_level === ROLE_LEVELS[ROLES.SUPER_ADMIN]) {
      setError('Hanya Super Admin yang dapat membuat grup dengan tingkat Super Admin.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        kode: form.kode.trim().toUpperCase(),
        deskripsi: form.deskripsi.trim(),
        is_admin: form.is_admin,
        required_app_id: form.required_app_id,
        role_level: form.role_level,
      };
      const entity = createSupabaseEntity('UserGroup');
      if (group) {
        await entity.update(group.id, payload);
      } else {
        await entity.create({
          ...payload,
          permissions: serializePermissions({}),
          bawaan_sistem: false,
          urutan: 99,
        });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Gagal menyimpan grup pengguna.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-xl">
        <div className="bg-slate-700 px-6 py-4">
          <DialogTitle className="text-white text-base font-semibold">
            {group ? 'Form User Group' : 'Form User Group Baru'}
          </DialogTitle>
          <DialogDescription className="text-white/70 text-xs mt-1">
            Atur identitas grup beserta penandaan admin aplikasi.
          </DialogDescription>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nama-grup">Group Name</Label>
            <Input
              id="nama-grup"
              value={form.nama}
              onChange={(e) => set('nama', e.target.value)}
              placeholder="Contoh: Admin Desa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kode-grup">Kode / ID Grup</Label>
            <Input
              id="kode-grup"
              value={form.kode}
              onChange={(e) => set('kode', e.target.value.toUpperCase())}
              placeholder="Contoh: ADM"
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">Dipakai sebagai penanda grup pada akun pengguna.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deskripsi-grup">Group Description</Label>
            <Textarea
              id="deskripsi-grup"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => set('deskripsi', e.target.value)}
              placeholder="Uraikan hak akses dan tanggung jawab grup ini."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-level">Tingkat Hierarki Peran</Label>
            <Select
              value={String(form.role_level)}
              onValueChange={setRoleLevel}
              disabled={!isSuperAdmin && form.role_level === ROLE_LEVELS[ROLES.SUPER_ADMIN]}
            >
              <SelectTrigger id="role-level" className="w-full" disabled={!isSuperAdmin}>
                <SelectValue placeholder="Pilih tingkat hierarki" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={String(opt.value)}
                    disabled={!isSuperAdmin && opt.restricted}
                    className="flex items-center gap-2"
                  >
                    <opt.icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                    {!isSuperAdmin && opt.restricted && <span className="ml-auto text-xs text-muted-foreground">(Super Admin only)</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isSuperAdmin && (
              <p className="text-xs text-muted-foreground">
                Hanya Super Admin yang dapat menetapkan grup dengan tingkat Super Admin.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Otomatis menentukan flag Is Admin: Level ≥ {ROLE_LEVELS[ROLES.ADMIN_DESA]} (Admin Desa) = Is Admin true.
            </p>
          </div>

          <div className="border-t border-border pt-4 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.is_admin}
                onCheckedChange={(v) => set('is_admin', Boolean(v))}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              Is Admin
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={form.required_app_id}
                onCheckedChange={(v) => set('required_app_id', Boolean(v))}
              />
              Required Application ID
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}