import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GroupFormDialog from '@/components/users/GroupFormDialog';
import GroupPermissionsDialog from '@/components/users/GroupPermissionsDialog';
import {
  Loader2, Plus, Pencil, X, ShieldCheck, ShieldAlert, KeyRound, Info, Shield, Building2, Users, User,
} from 'lucide-react';
import { ADMIN_MODULES, parsePermissions, countAllowedModules } from '@/lib/adminModules';
import { ROLE_LABELS, ROLE_LEVELS } from '@/lib/AuthContext';

export default function UserGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [permissionGroup, setPermissionGroup] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.entities.UserGroup.list({ sort: 'urutan', limit: 100 });
      setGroups(Array.isArray(res) ? res : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (group) => { setEditing(group); setFormOpen(true); };

  const handleDelete = async (group) => {
    const confirmed = window.confirm(
      `Hapus grup "${group.nama}"? Pengguna yang masih memakai kode grup ini akan kehilangan hak aksesnya.`,
    );
    if (!confirmed) return;
    setDeletingId(group.id);
    try {
      await base44.entities.UserGroup.delete(group.id);
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
    } finally {
      setDeletingId(null);
    }
  };

  // Derive role_level from group kode for CSV data that doesn't have role_level field
  const deriveRoleLevel = (group) => {
    // If role_level already exists, use it
    if (group.role_level !== undefined && group.role_level !== null) {
      return group.role_level;
    }
    // Derive from kode
    const kode = group.kode || '';
    switch (kode) {
      case 'SU': return ROLE_LEVELS.SUPER_ADMIN;
      case 'ADM':
      case 'KADES': return ROLE_LEVELS.ADMIN_DESA;
      case 'SEKDES': return ROLE_LEVELS.OPERATOR; // Sekdes is operator level
      case 'STAF': return ROLE_LEVELS.OPERATOR;
      case 'WARGA':
      case 'GUEST': return ROLE_LEVELS.WARGA;
      default: return ROLE_LEVELS.OPERATOR; // Default to operator
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan Grup Pengguna"
        subtitle="Kelola grup pengguna beserta matriks hak akses modul SIMDESTA"
      >
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" /> Tambah Grup
        </Button>
      </PageHeader>

      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3 w-[30%]">Group Name</th>
                <th className="text-left font-semibold px-4 py-3">Description</th>
                <th className="text-right font-semibold px-4 py-3 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const allowed = countAllowedModules(parsePermissions(group.permissions));
                // Derive role_level from kode if not set (for old CSV data)
                const roleLevel = deriveRoleLevel(group);
                // Determine role icon and badge based on role_level
                const getRoleIcon = (level) => {
                  if (level >= ROLE_LEVELS.SUPER_ADMIN) return <Shield className="w-3 h-3" />;
                  if (level >= ROLE_LEVELS.ADMIN_DESA) return <Building2 className="w-3 h-3" />;
                  if (level >= ROLE_LEVELS.OPERATOR) return <Users className="w-3 h-3" />;
                  return <User className="w-3 h-3" />;
                };
                const getRoleBadge = (level) => {
                  if (level >= ROLE_LEVELS.SUPER_ADMIN) return <Badge variant="default" className="bg-primary text-primary-foreground"><Shield className="w-3 h-3 mr-1" />Super Admin</Badge>;
                  if (level >= ROLE_LEVELS.ADMIN_DESA) return <Badge variant="secondary"><Building2 className="w-3 h-3 mr-1" />Admin Desa</Badge>;
                  if (level >= ROLE_LEVELS.OPERATOR) return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />Operator</Badge>;
                  return <Badge variant="outline"><User className="w-3 h-3 mr-1" />Warga</Badge>;
                };
                const isAdminGroup = roleLevel >= ROLE_LEVELS.ADMIN_DESA;
                return (
                  <tr key={group.id} className="border-t border-border hover:bg-muted/20 align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isAdminGroup ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {isAdminGroup ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{group.nama}</p>
                          <p className="text-xs text-muted-foreground">ID#: {group.kode}</p>
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {getRoleBadge(roleLevel)}
                            {isAdminGroup && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Admin
                              </span>
                            )}
                            {group.required_app_id && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                App ID
                              </span>
                            )}
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                              {allowed}/{ADMIN_MODULES.length} modul
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground leading-relaxed">
                      {group.deskripsi || <span className="italic">Belum ada deskripsi</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(group)}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(group)}
                          disabled={deletingId === group.id}
                        >
                          {deletingId === group.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <X className="w-3.5 h-3.5" />}
                          Delete
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPermissionGroup(group)}>
                          <KeyRound className="w-3.5 h-3.5" /> Edit Permissions
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                    Belum ada grup pengguna. Tambahkan grup pertama Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <h3 className="font-bold flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-primary" /> Catatan Hak Akses
        </h3>
        <p className="text-sm text-muted-foreground">
          Grup bertanda <span className="font-semibold text-foreground">Admin</span> (level ≥ Admin Desa) memiliki hak akses penuh.
          Untuk grup lain, menu pada sidebar admin hanya muncul sesuai centang modul yang diberikan, dan kode grup dipasang
          pada akun pengguna di halaman Pengaturan Akun Pengguna.
        </p>
      </div>

      <GroupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        group={editing}
        onSaved={load}
      />
      <GroupPermissionsDialog
        open={Boolean(permissionGroup)}
        onOpenChange={(open) => { if (!open) setPermissionGroup(null); }}
        group={permissionGroup}
        onSaved={load}
      />
    </div>
  );
}