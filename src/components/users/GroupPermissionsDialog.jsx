import React, { useEffect, useMemo, useState } from 'react';
import { createSupabaseEntity } from '@/api/supabaseAdapter.js';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, CheckCheck, Eraser, Info, AlertTriangle, Lock } from 'lucide-react';
import {
  ADMIN_MODULES, PERMISSION_ACTIONS, parsePermissions, serializePermissions,
  allPermissions,
} from '@/lib/adminModules';
import { useAuth } from '@/lib/AuthContext';
import { ROLES, SUPER_ADMIN_CREDENTIALS } from '@/lib/AuthContext';

export default function GroupPermissionsDialog({ open, onOpenChange, group, onSaved }) {
  const { user } = useAuth();
  const [perms, setPerms] = useState({});
  const [saving, setSaving] = useState(false);

  // Check if current user is super_admin
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN || user?.email === SUPER_ADMIN_CREDENTIALS.email;

  // Get enabled modules from localStorage (set by Super Admin in Kontrol Modul Aplikasi)
  const [enabledModules, setEnabledModules] = useState(() => {
    try {
      const stored = localStorage.getItem('simdesta_enabled_modules');
      return stored ? JSON.parse(stored) : Object.keys(ADMIN_MODULES.reduce((acc, m) => ({ ...acc, [m.key]: true }), {}));
    } catch {
      return ADMIN_MODULES.map(m => m.key);
    }
  });

  // Show ALL 18 modules (excluding superAdminOnly "manajemen_modul") in the dialog
  // For non-super-admin, modules not in enabledModules are shown but disabled (read-only)
  const allModules = useMemo(() => {
    return ADMIN_MODULES.filter(m => m.key !== 'manajemen_modul');
  }, []);

  // Check which modules are disabled by Super Admin
  const disabledModules = useMemo(() => {
    return allModules.filter(m => !enabledModules.includes(m.key));
  }, [enabledModules]);

  useEffect(() => {
    if (open) setPerms(parsePermissions(group?.permissions));
  }, [open, group]);

  const totalAllowed = useMemo(
    () => allModules.filter((m) => perms[m.key]?.view).length,
    [perms],
  );

  const isModuleDisabled = (moduleKey) => !enabledModules.includes(moduleKey);

  const toggleCell = (moduleKey, action) => {
    // Don't allow toggling if module is disabled by Super Admin
    if (isModuleDisabled(moduleKey)) return;
    setPerms((prev) => {
      const row = { ...(prev[moduleKey] || {}) };
      row[action] = !row[action];
      return { ...prev, [moduleKey]: row };
    });
  };

  const toggleModule = (moduleKey, actions) => {
    // Don't allow toggling if module is disabled by Super Admin
    if (isModuleDisabled(moduleKey)) return;
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
      const entity = createSupabaseEntity('UserGroup');
      await entity.update(group.id, {
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
            Centang modul dan fitur yang boleh diakses grup ini. {totalAllowed} dari {allModules.length} modul tersedia.
            {disabledModules.length > 0 && (
              <span className="text-amber-600 ml-1">({disabledModules.length} modul dinonaktifkan oleh Super Admin)</span>
            )}
          </DialogDescription>
        </div>

        {/* Info banner for disabled modules */}
        {disabledModules.length > 0 && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Modul berikut dinonaktifkan oleh Super Admin di <strong>Kontrol Modul Aplikasi</strong>:</p>
              <p className="mt-1">{disabledModules.map(m => m.label).join(', ')} tidak dapat diberikan hak akses (ditampilkan untuk informasi, checkbox terkunci).</p>
            </div>
          </div>
        )}

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
              {allModules.map((mod, index) => {
                const row = perms[mod.key] || {};
                const rowChecked = mod.actions.every((a) => row[a]);
                const modDisabled = isModuleDisabled(mod.key);
                return (
                  <tr
                    key={mod.key}
                    className={`border-t border-border ${index % 2 === 1 ? 'bg-muted/20' : ''} ${modDisabled ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={rowChecked}
                          onCheckedChange={() => toggleModule(mod.key, mod.actions)}
                          disabled={modDisabled}
                          className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                        />
                        <span className="font-medium flex items-center gap-1">
                          {mod.label}
                          {modDisabled && <Lock className="w-3 h-3 text-amber-500" title="Dinonaktifkan oleh Super Admin" />}
                        </span>
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
                                disabled={modDisabled}
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
                            disabled={modDisabled}
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
            <Button variant="outline" size="sm" onClick={() => setPerms(allPermissions())} disabled={disabledModules.length === allModules.length}>
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