import { useEffect, useState } from 'react';
import { hasPermission } from '@/lib/adminModules';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_LEVELS, SUPER_ADMIN_CREDENTIALS } from '@/lib/AuthContext';

/**
 * Menggunakan data pengguna dari AuthContext (sudah diload via base44.entities.AkunAkses.list()
 * yang memprioritaskan localStorage) untuk pengecekan hak akses per modul.
 * Hanya Super Admin yang bypass filter. SEMUA grup lain (ADM, KADES, SEKDES, STAF, WARGA)
 * WAJIB mengikuti matriks group.permissions (sudah dibatasi simdesta_enabled_modules).
 */
export default function useAccessPermissions() {
  const { logout: authLogout, user: authUser } = useAuth();
  const [state, setState] = useState({
    loading: true,
    restricted: false,
    terdaftar: true,
    alasan: '',
    permissions: null,
    group: null,
    user: null,
  });

  // Check if current user is super_admin using role_level
  const isSuperAdmin = authUser?.role_level === ROLE_LEVELS.SUPER_ADMIN || authUser?.email === SUPER_ADMIN_CREDENTIALS.email;

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!authUser) {
        if (active) setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      // Super admin gets full access (restricted = false)
      if (isSuperAdmin) {
        if (!active) return;
        setState({
          loading: false,
          restricted: false,
          terdaftar: true,
          alasan: '',
          permissions: null,
          group: { nama: 'Super Admin' },
          user: authUser,
        });
        return;
      }

      // For ALL non-super-admin groups (ADM, KADES, SEKDES, STAF, WARGA):
      // Must follow group.permissions strictly (restricted = true)
      // permissions already filtered by enabled_modules in AuthContext.login/checkAppState
      if (!active) return;
      setState({
        loading: false,
        restricted: true,
        terdaftar: true,
        alasan: '',
        permissions: authUser.permissions || null,
        group: authUser.grup_nama ? { nama: authUser.grup_nama } : null,
        user: authUser,
      });
    };
    run();
    return () => { active = false; };
  }, [isSuperAdmin, authUser]);

  const canAccess = (moduleKey) => {
    if (!moduleKey) return true;
    if (!state.restricted) return true; // Only Super Admin has restricted = false
    return hasPermission(state.permissions, moduleKey, 'view');
  };

  return { ...state, canAccess, logout: authLogout };
}