import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { hasPermission } from '@/lib/adminModules';

/**
 * Membaca akun terdaftar, grup pengguna, dan matriks hak akses akun yang sedang login
 * dari fungsi server (getMyAccess), lalu menyediakan pengecekan per modul.
 */
export default function useAccessPermissions() {
  const [state, setState] = useState({
    loading: true,
    restricted: false,
    terdaftar: true,
    alasan: '',
    permissions: null,
    group: null,
    user: null,
  });

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await base44.functions.invoke('getMyAccess', {});
        const data = res?.data || {};
        if (!active) return;
        setState({
          loading: false,
          restricted: Boolean(data.restricted),
          terdaftar: data.terdaftar !== false,
          alasan: data.alasan || '',
          permissions: data.permissions || null,
          group: data.group || null,
          user: data.user || null,
        });
      } catch (e) {
        // Bila gagal dimuat, menu ditampilkan penuh agar akses tidak terkunci.
        if (active) setState((prev) => ({ ...prev, loading: false }));
      }
    };
    run();
    return () => { active = false; };
  }, []);

  const canAccess = (moduleKey) => {
    if (!moduleKey) return true;
    if (!state.restricted) return true;
    return hasPermission(state.permissions, moduleKey, 'view');
  };

  return { ...state, canAccess };
}