import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import AccountFormDialog from '@/components/users/AccountFormDialog';
import {
  Loader2, UserPlus, Pencil, Trash2, UsersRound, ShieldCheck, UserCheck, KeyRound, Info, Shield, AlertTriangle, ShieldAlert,
} from 'lucide-react';
import { ROLE_LEVELS, ROLE_LABELS } from '@/lib/AuthContext';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_STYLES } from '@/lib/userRoles';

export default function UserAccounts() {
  const { user } = useAuth();
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

  // Helper: derive role_level from group kode since CSV doesn't have role_level column
  const getRoleLevel = (kode) => {
    switch (kode) {
      case 'SU': return 3; // Super Admin
      case 'ADM': return 2; // Admin Desa
      case 'SEKDES':
      case 'KADES': return 2; // Admin Desa level
      case 'STAF': return 1; // Operator
      case 'WARGA':
      case 'GUEST':
      default: return 0; // Warga
    }
  };

  // Helper: normalize group kode (ADMDES -> ADM)
  const normalizeGroupKode = (kode) => {
    if (!kode) return kode;
    const upper = String(kode).trim().toUpperCase();
    if (upper === 'ADMDES') return 'ADM';
    return upper;
  };

  // Helper: get canonical group name from kode
  const getGroupNamaFromKode = (kode) => {
    switch (normalizeGroupKode(kode)) {
      case 'SU': return 'Super Admin';
      case 'ADM':
      case 'KADES': return 'Admin Desa';
      case 'SEKDES': return 'Sekretaris Desa';
      case 'STAF': return 'Staf';
      case 'WARGA': return 'Warga';
      case 'GUEST': return 'Guest';
      default: return '';
    }
  };

  // Helper: get hierarki from group kode
  const getHierarkiFromKode = (kode) => {
    const upper = normalizeGroupKode(kode);
    switch (upper) {
      case 'SU': return 'super_admin';
      case 'ADM':
      case 'KADES': return 'admin_desa';
      case 'SEKDES':
      case 'STAF': return 'operator';
      case 'WARGA':
      case 'GUEST':
      default: return 'warga';
    }
  };

  // Helper: check if group is admin (Super Admin) - handle string "true"/"false" from CSV
  const isAdminGroup = (g) => String(g.is_admin).toLowerCase() === 'true' || g.kode === 'SU';

  // Check if current user is super_admin
  const isCurrentUserSuperAdmin = user?.role_level === ROLE_LEVELS.SUPER_ADMIN || user?.email === 'superadmin@simdesta.id';

  // Pre-process groups with role labels for display
  const groupsWithLabels = useMemo(() => {
    return groups.map(g => ({
      ...g,
      roleLevel: getRoleLevel(g.kode),
      roleLabel: getRoleLevel(g.kode) >= ROLE_LEVELS.SUPER_ADMIN ? ROLE_LABELS.SUPER_ADMIN :
                getRoleLevel(g.kode) >= ROLE_LEVELS.ADMIN_DESA ? ROLE_LABELS.ADMIN_DESA :
                getRoleLevel(g.kode) >= ROLE_LEVELS.OPERATOR ? ROLE_LABELS.OPERATOR :
                ROLE_LABELS.WARGA
    }));
  }, [groups]);

  // Build group options for dropdown: normalize kode AND nama, then build label from normalized data
  const groupOptions = useMemo(() => {
    return groups.map(g => {
      const rawKode = String(g.kode || g.id || '').trim();
      const groupKey = normalizeGroupKode(rawKode);
      let groupNama = g.nama || groupKey;
      // Force-normalize nama if it contains ADMDES
      if (String(groupNama).toUpperCase().includes('ADMDES')) {
        groupNama = getGroupNamaFromKode(groupKey) || groupNama.replace(/\(ADMDES\)/gi, '').trim() || 'Admin Desa';
      }
      return {
        value: groupKey,
        label: `${groupNama} (${groupKey})`,
        hierarki: getHierarkiFromKode(groupKey),
        nama: groupNama,
        kode: groupKey,
      };
    });
  }, [groups]);

  const load = useCallback(async () => {
    try {
      const [akunRes, groupRes, meRes] = await Promise.allSettled([
        base44.functions.invoke('kelolaAkunAkses', { action: 'list' }).then((res) => res.data),
        base44.entities.UserGroup.list({ sort: 'urutan', limit: 100 }),
        base44.auth.me(),
      ]);

      const akunData = akunRes.status === 'fulfilled' ? (akunRes.value || {}) : {};
      let akunItems = Array.isArray(akunData?.items) ? akunData.items : [];
      const groupItems = groupRes.status === 'fulfilled' ? (Array.isArray(groupRes.value) ? groupRes.value : []) : [];
      const currentUser = meRes.status === 'fulfilled' ? meRes.value : null;

      // akunItems already comes from localStorage (persisted) via the updated invokeKelolaAkunAkses
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
    const grupKode = code === 'none' ? '' : normalizeGroupKode(code);
    setUpdatingId(row.id);
    try {
      // Find the selected group to get grup_nama and hierarki
      const selectedGroup = groups.find(g => normalizeGroupKode(g.kode) === grupKode);
      const grupNama = selectedGroup?.nama || getGroupNamaFromKode(grupKode) || grupKode;
      const hierarki = selectedGroup?.hierarki || getHierarkiFromKode(grupKode);

      // Use the same action and payload format as modal Edit (action: 'save' with full fields)
      // This matches AccountFormDialog.handleSave which calls kelolaAkunAkses with action: 'save'
      await base44.functions.invoke('kelolaAkunAkses', {
        action: 'save',
        id: row.id,
        email: row.email,
        nama: row.nama,
        username: row.username,
        jabatan: row.jabatan || '',
        status: row.status || 'Aktif',
        grup_kode: grupKode,
        grup_nama: grupNama,
        hierarki: hierarki,
      });

      // Update local state immediately (no full reload needed since adapter returns updated row)
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, grup_kode: grupKode, grup_nama: grupNama, hierarki: hierarki }
            : r
        )
      );
    } catch (e) {
      window.alert(e?.response?.data?.message || 'Gagal memperbarui grup pengguna.');
      // Revert on error by reloading
      await load();
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
  const inactiveCount = rows.filter((r) => (r.status || 'Aktif') !== 'Aktif').length;
  // Super Admin count: only accounts with grup_kode === 'SU' or role === 'super_admin'
  const superAdminCount = rows.filter((r) => r.grup_kode === 'SU' || r.role === 'super_admin').length;

  // Grup Super Admin hanya ditampilkan untuk Super Admin.
  const selectableGroups = isSuperAdmin ? groups : groups.filter((g) => !isAdminGroup(g));

  // Super Admin system account (always at top for super_admin users)
  const superAdminAccount = {
    id: 'super-admin-system',
    nama: 'Pemilik Aplikasi',
    email: 'superadmin@simdesta.id',
    username: 'superadmin',
    grup_kode: 'SU',
    jabatan: 'Pemilik Aplikasi',
    status: 'Aktif',
    _isSystemAccount: true,
  };

  // Display rows: super admin account at top if current user is super_admin
  const displayRows = isCurrentUserSuperAdmin ? [superAdminAccount, ...rows] : rows;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(isCurrentUserSuperAdmin ? [
          { label: 'Total Akun', value: rows.length + 1, icon: UsersRound }, // +1 for system account
          { label: 'Akun Aktif', value: activeCount + 1, icon: UserCheck }, // +1 for system account
          { label: 'Super Admin', value: superAdminCount, icon: ShieldCheck },
          { label: 'Akun Nonaktif', value: inactiveCount, icon: ShieldAlert },
        ] : [
          { label: 'Total Akun', value: rows.length, icon: UsersRound },
          { label: 'Akun Aktif', value: activeCount, icon: UserCheck },
          { label: 'Akun Nonaktif', value: inactiveCount, icon: ShieldAlert },
        ]).map((stat) => (
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
              {displayRows.map((row) => {
                const isMe = me && row.akun_login && row.akun_login.id === me.id;
                const isSystemAccount = row._isSystemAccount === true;
                
                // Normalize account's grup_kode for matching (ADMDES -> ADM)
                const accountGroupKey = normalizeGroupKode(row.grup_kode || row.user_group_id || '');
                const rowGroup = groups.find(g => normalizeGroupKode(g.kode) === accountGroupKey);
                const matchedHierarki = rowGroup?.hierarki || getHierarkiFromKode(accountGroupKey);
                
                // Map hierarki to role level for display
                const hierarkiToRoleLevel = (h) => {
                  switch (h) {
                    case 'super_admin': return 3;
                    case 'admin_desa': return 2;
                    case 'operator': return 1;
                    case 'warga': return 0;
                    default: return 0;
                  }
                };
                const roleLevel = isSystemAccount ? 3 : hierarkiToRoleLevel(matchedHierarki);
                const isSuper = roleLevel >= 3;
                const role = roleLevel >= 2 ? 'admin' : 'user';
                const status = row.status || 'Aktif';
                const roleLabel = roleLevel >= 3 ? 'Super Admin' :
                                  roleLevel >= 2 ? 'Admin Desa' :
                                  roleLevel >= 1 ? 'Operator' : 'Warga';

                // For system account, override with fixed values
                const displayRoleLabel = isSystemAccount ? 'Super Admin (Sistem)' : roleLabel;
                const displayRole = isSystemAccount ? 'admin' : role;
                const displayGrupNama = isSystemAccount ? 'Super Admin (SU)' : (rowGroup?.nama || row.grup_kode || 'Tanpa Grup');

                return (
                  <tr key={row.id} className={`border-t border-border hover:bg-muted/20 ${isSystemAccount ? 'bg-amber-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                          {(row.nama || row.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {row.nama || 'Belum diatur'}
                            {isMe ? ' · Anda' : ''}
                            {isSystemAccount && <span className="ml-2 text-xs text-amber-600 font-medium">(Sistem)</span>}
                          </p>
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
                      {isSystemAccount ? (
                        <span className="text-sm text-muted-foreground">{displayGrupNama}</span>
                      ) : (
                        <Select
                          value={accountGroupKey || 'none'}
                          onValueChange={(v) => handleGroupChange(row, v)}
                          disabled={updatingId === row.id}
                        >
                          <SelectTrigger className="w-48">
                            {updatingId === row.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <SelectValue placeholder="Pilih grup" />}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Tanpa grup</SelectItem>
                            {groupOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isSystemAccount ? (
                        <>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_STYLES[displayRole] || ROLE_STYLES.user}`}>
                            {displayRoleLabel}
                          </span>
                          <Badge variant="outline" className="ml-2 px-2 py-0.5 text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                            <Shield className="w-3 h-3 inline mr-1" /> Akun Sistem Terproteksi
                          </Badge>
                        </>
                      ) : (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          matchedHierarki === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                          matchedHierarki === 'admin_desa' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                          matchedHierarki === 'operator' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                          matchedHierarki === 'warga' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>
                          {matchedHierarki === 'super_admin' ? 'Super Admin' :
                           matchedHierarki === 'admin_desa' ? 'Admin Desa' :
                           matchedHierarki === 'operator' ? 'Operator' :
                           matchedHierarki === 'warga' ? 'Warga' : 'Belum Diatur'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status === 'Aktif' ? 'default' : 'secondary'}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {!isSystemAccount && (
                          <>
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
                          </>
                        )}
                        {isSystemAccount && (
                          <Button variant="ghost" size="icon" disabled title="Akun sistem tidak dapat dikelola">
                            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !isCurrentUserSuperAdmin && (
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