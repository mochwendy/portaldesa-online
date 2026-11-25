import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, CheckCheck, Eraser } from 'lucide-react';
import {
  ADMIN_MODULES, PERMISSION_ACTIONS, parsePermissions, serializePermissions,
  allPermissions,
} from '@/lib/adminModules';

export default function GroupPermissionsDialog({ open, onOpenChange, group, onSaved }) {
  const [perms, setPerms] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setPerms(parsePermissions(group?.permissions));
  }, [open, group]);

  const totalAllowed = useMemo(
    () => ADMIN_MODULES.filter((m) => perms[m.key]?.view).length,
    [perms],
  );

  const toggleCell = (moduleKey, action) => {
    setPerms((prev) => {
      const row = { ...(prev[moduleKey] || {}) };
      row[action] = !row[action];
      return { ...prev, [moduleKey]: row };
    });
  };

  const toggleModule = (moduleKey, actions) => {
    setPerms((prev) => {
      const row = prev[moduleKey] || {};
      const allChecked = actions.every((a) => row[a]);
      const nextRow = {};
      actions.forEach((a) => { nextRow[a] = !allChecked; });
      return { ...prev, [moduleKey]: nextRow };
    });
  };

  const handleSave = async () => {
    if (!group) return;
    setSaving(true);
    try {
      await base44.entities.UserGroup.update(group.id, {
        permissions: serializePermissions(perms),
      });
      onOpenChange(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-4xl">
        <div className="px-6 py-4 border-b border-border bg-card">
          <DialogTitle className="text-base font-semibold">
            Edit Permissions for user group &lsquo;{group?.nama}&rsquo;
          </DialogTitle>
          <DialogDescription className="text-xs mt-1">
            Centang modul dan fitur yang boleh diakses grup ini. {totalAllowed} dari {ADMIN_MODULES.length} modul aktif.
          </DialogDescription>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 backdrop-blur text-muted-foreground z-10">
              <tr>
                <th className="text-left font-semibold px-4 py-3 w-[38%]">Module / Group Menus</th>
                <th className="text-left font-semibold px-4 py-3">Roles</th>
                <th className="text-left font-semibold px-4 py-3">Roles</th>
              </tr>
            </thead>
            <tbody>
              {ADMIN_MODULES.map((mod, index) => {
                const row = perms[mod.key] || {};
                const rowChecked = mod.actions.every((a) => row[a]);
                return (
                  <tr
                    key={mod.key}
                    className={`border-t border-border ${index % 2 === 1 ? 'bg-muted/20' : ''}`}
                  >
                    <td className="px-4 py-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={rowChecked}
                          onCheckedChange={() => toggleModule(mod.key, mod.actions)}
                          className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                        />
                        <span className="font-medium">{mod.label}</span>
                      </label>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-x-5 gap-y-1">
                        {mod.actions.filter((a) => a !== 'create').map((action) => {
                          const meta = PERMISSION_ACTIONS.find((p) => p.key === action);
                          const label = action === 'view'
                            ? `Lihat & Ubah ${mod.label}`
                            : `${meta.label} ${mod.label}`;
                          return (
                            <label key={action} className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                              <Checkbox
                                checked={Boolean(row[action])}
                                onCheckedChange={() => toggleCell(mod.key, action)}
                                className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                              />
                              <span className="text-xs">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {mod.actions.includes('create') && (
                        <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                          <Checkbox
                            checked={Boolean(row.create)}
                            onCheckedChange={() => toggleCell(mod.key, 'create')}
                            className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <span className="text-xs">Tambah {mod.label}</span>
                        </label>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPerms(allPermissions())}>
              <CheckCheck className="w-4 h-4" /> Pilih semua
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPerms({})}>
              <Eraser className="w-4 h-4" /> Kosongkan
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Hak Akses
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}