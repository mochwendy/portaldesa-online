import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import MenuPortalFormDialog from '@/components/menu/MenuPortalFormDialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Menu as MenuIcon } from 'lucide-react';

const KATEGORI_LABELS = {
  menu_utama: 'Menu Utama',
  menu_footer: 'Menu Footer',
};

export default function MenuPortalAdmin() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await base44.entities.MenuPortal.filter({}, { sort: 'urutan', limit: 100 });
      setMenus(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleTogglePublish = async (menu) => {
    setTogglingId(menu.id);
    try {
      await base44.entities.MenuPortal.update(menu.id, { published: !menu.published });
      setMenus((prev) => prev.map((m) => (m.id === menu.id ? { ...m, published: !m.published } : m)));
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (menu) => {
    if (!window.confirm(`Hapus menu "${menu.label}"?`)) return;
    setDeletingId(menu.id);
    try {
      await base44.entities.MenuPortal.delete(menu.id);
      setMenus((prev) => prev.filter((m) => m.id !== menu.id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (menu) => { setEditing(menu); setDialogOpen(true); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const publishedCount = menus.filter((m) => m.published).length;
  const unpublishedCount = menus.length - publishedCount;

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan Menu Portal" subtitle="Kelola menu navigasi portal publik Smart Desa — atur publish/unpublish setiap menu">
        <Button onClick={openAdd}><Plus className="w-4 h-4" /> Tambah Menu</Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <MenuIcon className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Menu</span>
          </div>
          <p className="text-2xl font-extrabold">{menus.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-muted-foreground">Dipublikasi</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{publishedCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <EyeOff className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Disembunyikan</span>
          </div>
          <p className="text-2xl font-extrabold text-muted-foreground">{unpublishedCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3 w-10"></th>
                <th className="text-left font-medium px-4 py-3">Label Menu</th>
                <th className="text-left font-medium px-4 py-3">Path / URL</th>
                <th className="text-left font-medium px-4 py-3">Kategori</th>
                <th className="text-center font-medium px-4 py-3">Urutan</th>
                <th className="text-center font-medium px-4 py-3">Status Publish</th>
                <th className="text-right font-medium px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground/40"><GripVertical className="w-4 h-4" /></td>
                  <td className="px-4 py-3 font-medium">{m.label}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.path}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">{KATEGORI_LABELS[m.kategori] || m.kategori}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{m.urutan ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={!!m.published}
                        onCheckedChange={() => handleTogglePublish(m)}
                        disabled={togglingId === m.id}
                      />
                      <span className={`text-xs font-medium whitespace-nowrap ${m.published ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {m.published ? 'Publish' : 'Unpublish'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(m)} disabled={deletingId === m.id}>
                        {deletingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Belum ada menu. Klik "Tambah Menu" untuk mulai.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MenuPortalFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingItem={editing} onSaved={load} />
    </div>
  );
}