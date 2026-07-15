import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface UserData {
  id: number;
  email: string;
  name: string;
  role: 'CITIZEN' | 'OFFICER';
  departmentId?: number | null;
  departmentName?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  login: (token: string, user: UserData) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const storedToken = localStorage.getItem('token');
  const [token, setToken] = useState<string | null>(storedToken);
  const [user, setUser] = useState<UserData | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );
  const [loading, setLoading] = useState(false);

  // Set header immediately on mount from localStorage (covers page refresh)
  if (storedToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  }

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const login = (newToken: string, newUser: UserData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
