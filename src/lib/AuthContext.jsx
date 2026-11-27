import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

// 4-Tier Role Hierarchy constants (kept for backward compatibility with other components)
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_DESA: 'admin_desa',
  OPERATOR: 'operator',
  WARGA: 'warga',
};

export const ROLE_LEVELS = {
  SUPER_ADMIN: 3,
  ADMIN_DESA: 2,
  OPERATOR: 1,
  WARGA: 0,
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin (Pemilik Aplikasi)',
  ADMIN_DESA: 'Admin Desa (Administrator Tingkat Desa)',
  OPERATOR: 'Operator / Perangkat Desa (Kasi, Kaur, Staff)',
  WARGA: 'Pengguna Umum / Warga',
};

export const SUPER_ADMIN_CREDENTIALS = {
  email: 'superadmin@simdesta.id',
  password: 'superadmin123',
  name: 'Pemilik Aplikasi',
};

// Mock user untuk development di localhost — role admin, akses penuh ke semua menu SIMDESTA.
const MOCK_USER = {
  id: 'mock-admin-local',
  email: 'admin@localhost',
  full_name: 'Admin Lokal (Mock)',
  role_level: ROLE_LEVELS.ADMIN_DESA,
  is_mock: true,
};

const IS_LOCALHOST = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Load CSV export data for AkunAkses to pre-populate accounts
async function loadAkunAksesExport() {
  try {
    const response = await fetch('/data/AkunAkses_export.csv');
    if (!response.ok) return [];
    const text = await response.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
      rows.push(obj);
    }
    return rows;
  } catch (e) {
    console.warn('Could not load AkunAkses_export.csv:', e);
    return [];
  }
}

export const AuthContext = createContext();

export const useRoleAccess = (requiredRole) => {
  const { user } = useAuth();
  if (!user) return false;
  const userLevel = user.role_level || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  return userLevel >= requiredLevel;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [csvAccounts, setCsvAccounts] = useState([]);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Load from base44.entities (prioritizes localStorage, falls back to CSV)
      // This ensures we use the SAME data source as UserAccounts.jsx and login()
      const akunList = await base44.entities.AkunAkses.list({ sort: 'nama', limit: 500 });
      const akunRows = Array.isArray(akunList) ? akunList : (akunList?.items || []);
      setCsvAccounts(akunRows);

      // Check for custom auth token in localStorage
      const customToken = localStorage.getItem('simdesta_auth_token');
      const customUser = localStorage.getItem('simdesta_auth_user');

      if (customToken && customUser) {
        try {
          const parsedUser = JSON.parse(customUser);
          // Ensure super_admin role is preserved on refresh
          if (parsedUser.role_level === ROLE_LEVELS.SUPER_ADMIN || parsedUser.email === SUPER_ADMIN_CREDENTIALS.email) {
            parsedUser.role_level = ROLE_LEVELS.SUPER_ADMIN;
            parsedUser.role_label = ROLE_LABELS.SUPER_ADMIN;
            parsedUser.full_name = 'Pemilik Aplikasi';
            parsedUser.grup_nama = 'Super Admin';
            parsedUser.grup_kode = 'SU';
            parsedUser.jabatan = 'Pemilik Aplikasi';
            parsedUser.isSuperAdmin = true;
            parsedUser.is_admin = true;
            parsedUser.permissions = {};
            parsedUser.all_permissions = {};
          } else {
            // For non-super-admin users, re-apply module filtering on refresh
            // to ensure they always see the latest enabled_modules
            let enabledModules = [];
            try {
              const stored = localStorage.getItem('simdesta_enabled_modules');
              enabledModules = stored ? JSON.parse(stored) : [];
            } catch {
              enabledModules = [];
            }
            const allPerms = parsedUser.all_permissions || parsedUser.permissions || {};
            const filtered = {};
            for (const [modKey, perms] of Object.entries(allPerms)) {
              if (enabledModules.length === 0 || enabledModules.includes(modKey)) {
                filtered[modKey] = perms;
              }
            }
            parsedUser.permissions = filtered;
            
            // Also ensure grup_nama is populated from UserGroup if missing
            if (!parsedUser.grup_nama && parsedUser.grup_kode) {
              try {
                const groupList = await base44.entities.UserGroup.list({ limit: 500 });
                const groups = Array.isArray(groupList) ? groupList : (groupList?.items || []);
                const userGroup = groups.find(g => g.kode === parsedUser.grup_kode);
                if (userGroup) {
                  parsedUser.grup_nama = userGroup.nama || parsedUser.grup_kode;
                }
              } catch (e) {
                console.warn('Could not fetch UserGroup for grup_nama:', e);
              }
            }
          }
          setUser(parsedUser);
          setIsAuthenticated(true);
          base44.auth.setToken(customToken);
        } catch (e) {
          localStorage.removeItem('simdesta_auth_token');
          localStorage.removeItem('simdesta_auth_user');
        }
      }

      try {
        const publicSettings = await base44.app.getPublicSettings();
        setAppPublicSettings(publicSettings);
      } catch (appError) {
        console.warn('Failed to load public settings:', appError);
      }

      if (!customToken) {
        // ── Mode mock untuk localhost: langsung set admin, lewati panggilan API. ──
        if (IS_LOCALHOST && !appParams.token) {
          setUser(MOCK_USER);
          setIsAuthenticated(true);
        } else if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsAuthenticated(false);
        }
      }
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    if (IS_LOCALHOST && !appParams.token) {
      setUser(MOCK_USER);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }

    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);

      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  // Helper: derive role_level from group kode since CSV doesn't have role_level column
  const getRoleLevel = (kode) => {
    switch (kode) {
      case 'SU': return ROLE_LEVELS.SUPER_ADMIN;
      case 'ADM': return ROLE_LEVELS.ADMIN_DESA;
      case 'SEKDES':
      case 'KADES': return ROLE_LEVELS.ADMIN_DESA;
      case 'STAF': return ROLE_LEVELS.OPERATOR;
      case 'WARGA':
      case 'GUEST':
      default: return ROLE_LEVELS.WARGA;
    }
  };

  // Helper: check if group is admin (Super Admin) - handle string "true"/"false" from CSV
  const isAdminGroup = (g) => String(g.is_admin).toLowerCase() === 'true' || g.kode === 'SU';

  const login = async (emailOrUsername, password) => {
    setAuthError(null);
    try {
      const input = emailOrUsername.trim().toLowerCase();
      const providedPassword = password.trim();

      // Check for super admin first
      if ((input === SUPER_ADMIN_CREDENTIALS.email || input === 'superadmin') && 
          providedPassword === SUPER_ADMIN_CREDENTIALS.password) {
        const userObj = {
          id: 'super-admin-owner',
          email: SUPER_ADMIN_CREDENTIALS.email,
          full_name: 'Pemilik Aplikasi',
          role_level: ROLE_LEVELS.SUPER_ADMIN,
          role_label: ROLE_LABELS.SUPER_ADMIN,
          status: 'aktif',
          isSuperAdmin: true,
          grup_nama: 'Super Admin',
          grup_kode: 'SU',
          jabatan: 'Pemilik Aplikasi',
          permissions: {},
          all_permissions: {},
        };

        const token = 'simdesta-token-super-admin-' + Date.now();
        localStorage.setItem('simdesta_auth_token', token);
        localStorage.setItem('simdesta_auth_user', JSON.stringify(userObj));
        base44.auth.setToken(token);

        setUser(userObj);
        setIsAuthenticated(true);

        return { success: true, user: userObj, role: 'SUPER_ADMIN', isSuper: true };
      }

      const akunList = await base44.entities.AkunAkses.list({ sort: 'nama', limit: 500 });
      const akunRows = Array.isArray(akunList) ? akunList : (akunList?.items || []);

      const matched = akunRows.find((a) => 
        (a.email || '').toLowerCase() === input || 
        (a.username || '').toLowerCase() === input
      );

      if (!matched) {
        throw new Error('Email atau username tidak terdaftar di sistem.');
      }

      if ((matched.status || 'Aktif') !== 'Aktif') {
        throw new Error('Akun ini dinonaktifkan. Hubungi administrator.');
      }

      const hasPassword = matched.password && matched.password.length > 0;
      const DEFAULT_PASSWORD = 'tagogapu123';
      
      let isValid = false;
      if (hasPassword) {
        isValid = providedPassword === matched.password;
      } else {
        isValid = providedPassword === DEFAULT_PASSWORD;
      }

      if (!isValid) {
        throw new Error(hasPassword ? 'Kata sandi salah.' : `Kata sandi salah. Default: ${DEFAULT_PASSWORD}`);
      }

      // Map akun to role based on grup_kode -> UserGroup.role_level
      let role_level = ROLE_LEVELS.OPERATOR;
      let role_label = ROLE_LABELS.OPERATOR;
      let isSuper = false;
      let grup_nama = matched.grup_kode || 'Tanpa Grup';
      let permissions = {};
      let is_admin = false;
      let grup_kode = matched.grup_kode;

      // Try to fetch UserGroup to get role_level and permissions
      if (matched.grup_kode) {
        try {
          const groupList = await base44.entities.UserGroup.list({ limit: 500 });
          const groups = Array.isArray(groupList) ? groupList : (groupList?.items || []);
          const userGroup = groups.find(g => g.kode === matched.grup_kode);
          if (userGroup) {
            // Derive role_level from group kode since CSV lacks role_level column
            role_level = getRoleLevel(userGroup.kode);
            role_label = ROLE_LABELS[Object.keys(ROLE_LEVELS).find(k => ROLE_LEVELS[k] === role_level) || 'OPERATOR'];
            grup_nama = userGroup.nama || matched.grup_kode;
            is_admin = role_level >= ROLE_LEVELS.ADMIN_DESA;
            
            // Parse permissions from group
            try {
              permissions = JSON.parse(userGroup.permissions || '{}');
            } catch {
              permissions = {};
            }

            // Check if super admin
            if (role_level === ROLE_LEVELS.SUPER_ADMIN) {
              isSuper = true;
            }
          }
        } catch (e) {
          console.warn('Could not fetch UserGroup for role_level:', e);
        }
      } else {
        // Fallback: If grup_kode indicates admin privileges
        if (matched.grup_kode && matched.grup_kode.includes('admin')) {
          role_level = ROLE_LEVELS.ADMIN_DESA;
          role_label = ROLE_LABELS.ADMIN_DESA;
          is_admin = true;
        }
      }

      // Apply Super Admin module filtering
      let enabledModules = [];
      try {
        const stored = localStorage.getItem('simdesta_enabled_modules');
        enabledModules = stored ? JSON.parse(stored) : [];
      } catch {
        enabledModules = [];
      }
      const filteredPermissions = {};
      for (const [modKey, perms] of Object.entries(permissions)) {
        if (enabledModules.length === 0 || enabledModules.includes(modKey)) {
          filteredPermissions[modKey] = perms;
        }
      }

      const userObj = {
        id: matched.id,
        email: matched.email,
        full_name: matched.nama || matched.email,
        role_level: role_level,
        role_label: role_label,
        grup_kode: grup_kode,
        grup_nama: grup_nama,
        jabatan: matched.jabatan,
        isSuperAdmin: isSuper,
        is_admin: is_admin,
        permissions: filteredPermissions,
        all_permissions: permissions,
      };

      const token = 'simdesta-token-' + matched.id + '-' + Date.now();
      localStorage.setItem('simdesta_auth_token', token);
      localStorage.setItem('simdesta_auth_user', JSON.stringify(userObj));
      base44.auth.setToken(token);

      setUser(userObj);
      setIsAuthenticated(true);
      
      return { success: true, user: userObj, role: userObj.role_level, isSuper };
    } catch (err) {
      throw err;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('simdesta_auth_token');
    localStorage.removeItem('simdesta_auth_user');
    sessionStorage.clear();

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      csvAccounts,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      login
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};