import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const KATEGORI_OPTIONS = [
  { value: 'menu_utama', label: 'Menu Utama (Navbar)' },
  { value: 'menu_footer', label: 'Menu Footer' },
];

const DEFAULTS = {
  label: '', path: '', icon: '', urutan: 0,
  published: true, is_external: false, kategori: 'menu_utama',
};

export default function MenuPortalFormDialog({ open, onOpenChange, editingItem, onSaved }) {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(editingItem ? { ...DEFAULTS, ...editingItem } : DEFAULTS);
      setError('');
    }
  }, [open, editingItem]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.label.trim() || !form.path.trim()) {
      setError('Label dan Path wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const data = {
        label: form.label.trim(),
        path: form.path.trim(),
        icon: form.icon?.trim() || '',
        urutan: Number(form.urutan) || 0,
        published: !!form.published,
        is_external: !!form.is_external,
        kategori: form.kategori || 'menu_utama',
      };
      if (editingItem) {
        await base44.entities.MenuPortal.update(editingItem.id, data);
      } else {
        await base44.entities.MenuPortal.create(data);
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan menu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Edit Menu' : 'Tambah Menu'}</DialogTitle>
          <DialogDescription>Atur menu navigasi portal publik Smart Desa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Label Menu *</Label>
            <Input value={form.label} onChange={(e) => set('label', e.target.value)} placeholder="contoh: Berita" disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label>Path / URL *</Label>
            <Input value={form.path} onChange={(e) => set('path', e.target.value)} placeholder="/berita atau https://..." disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={form.urutan} onChange={(e) => set('urutan', e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.kategori} onValueChange={(v) => set('kategori', v)} disabled={loading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KATEGORI_OPTIONS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Icon (opsional)</Label>
            <Input value={form.icon} onChange={(e) => set('icon', e.target.value)} placeholder="Nama icon lucide, contoh: FileText" disabled={loading} />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={!!form.published} onCheckedChange={(v) => set('published', v)} disabled={loading} />
              <span className="text-sm">Dipublikasi</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={!!form.is_external} onCheckedChange={(v) => set('is_external', v)} disabled={loading} />
              <span className="text-sm">Link Eksternal</span>
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={loading}>Batal</Button></DialogClose>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingItem ? 'Simpan Perubahan' : 'Tambah Menu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}