import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  }

  async function changePassword(oldPassword, newPassword) {
    const res = await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    setUser(res.data);
    return res.data;
  }

  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated, isAdmin,
      login, logout, changePassword, loadUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
