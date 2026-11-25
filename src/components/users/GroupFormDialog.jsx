import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import { serializePermissions } from '@/lib/adminModules';

const EMPTY = {
  nama: '', kode: '', deskripsi: '', is_admin: false, required_app_id: false,
};

export default function GroupFormDialog({ open, onOpenChange, group, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(group ? {
      nama: group.nama || '',
      kode: group.kode || '',
      deskripsi: group.deskripsi || '',
      is_admin: Boolean(group.is_admin),
      required_app_id: Boolean(group.required_app_id),
    } : EMPTY);
  }, [open, group]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setError('');
    if (!form.nama.trim() || !form.kode.trim()) {
      setError('Nama grup dan kode grup wajib diisi.');
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
      };
      if (group) {
        await base44.entities.UserGroup.update(group.id, payload);
      } else {
        await base44.entities.UserGroup.create({
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