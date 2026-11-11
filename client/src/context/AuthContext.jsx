import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('fixflow_token') || sessionStorage.getItem('fixflow_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(response => setUser(response.data.user))
      .catch(() => {
        localStorage.removeItem('fixflow_token');
        sessionStorage.removeItem('fixflow_token');
      })
      .finally(() => setLoading(false));
  }, []);
  const login = async (identifier, password, rememberMe = false, expectedRole = null) => {
    const { data } = await api.post('/auth/login', { identifier, password, expectedRole });
    localStorage.removeItem('fixflow_token');
    sessionStorage.removeItem('fixflow_token');
    (rememberMe ? localStorage : sessionStorage).setItem('fixflow_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async payload => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.removeItem('fixflow_token');
    sessionStorage.setItem('fixflow_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem('fixflow_token');
    sessionStorage.removeItem('fixflow_token');
    setUser(null);
  };
  const updateProfile = async payload => {
    const { data } = await api.patch('/auth/profile', payload);
    setUser(data.user);
    return data.user;
  };
  return <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
