import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authApi } from '../api/authApi';
import { setAccessToken } from '../api/axiosInstance';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session

  // ── Restore session on mount (try /auth/refresh with cookie) ──
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await authApi.refresh();
        const token = data.data.accessToken;
        setAccessToken(token);
        const me = await authApi.getMe();
        setUser(me.data.data.user);
      } catch {
        // No valid session — user must log in
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Listen for forced logout from axios interceptor ───────────
  useEffect(() => {
    const handleForceLogout = () => {
      setUser(null);
      setAccessToken(null);
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);

  // ── Login ─────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // ── Register ─────────────────────────────────────────────────
  const register = useCallback(async (payload) => {
    const { data } = await authApi.register(payload);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // ── Google Login ──────────────────────────────────────────────
  const googleLogin = useCallback(async (idToken) => {
    const { data } = await authApi.googleLogin({ token: idToken });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    setUser(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
