import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

// Mock user untuk development di localhost — role admin, akses penuh ke semua menu SIMDESTA.
const MOCK_USER = {
  id: 'mock-admin-local',
  email: 'admin@localhost',
  full_name: 'Admin Lokal (Mock)',
  role: 'admin',
  is_mock: true,
};

const IS_LOCALHOST = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Check for custom auth token in localStorage
      const customToken = localStorage.getItem('simdesta_auth_token');
      const customUser = localStorage.getItem('simdesta_auth_user');

      if (customToken && customUser) {
        try {
          const parsedUser = JSON.parse(customUser);
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

  const login = async (emailOrUsername, password) => {
    setAuthError(null);
    try {
      const akunList = await base44.entities.AkunAkses.list({ sort: 'nama', limit: 500 });
      const akunRows = Array.isArray(akunList) ? akunList : (akunList?.items || []);

      const input = emailOrUsername.trim().toLowerCase();
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
      const providedPassword = password.trim();
      
      let isValid = false;
      if (hasPassword) {
        isValid = providedPassword === matched.password;
      } else {
        isValid = providedPassword === DEFAULT_PASSWORD;
      }

      if (!isValid) {
        throw new Error(hasPassword ? 'Kata sandi salah.' : `Kata sandi salah. Default: ${DEFAULT_PASSWORD}`);
      }

      const userObj = {
        id: matched.id,
        email: matched.email,
        full_name: matched.nama,
        role: matched.role,
        grup_kode: matched.grup_kode,
        jabatan: matched.jabatan,
      };

      const token = 'simdesta-token-' + matched.id + '-' + Date.now();
      localStorage.setItem('simdesta_auth_token', token);
      localStorage.setItem('simdesta_auth_user', JSON.stringify(userObj));
      base44.auth.setToken(token);

      setUser(userObj);
      setIsAuthenticated(true);
      
      return { success: true, user: userObj };
    } catch (err) {
      throw err;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('simdesta_auth_token');
    localStorage.removeItem('simdesta_auth_user');

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