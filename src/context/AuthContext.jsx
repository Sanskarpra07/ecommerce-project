import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('solestyle_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('solestyle_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('solestyle_user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth.php', {
        action: 'login',
        email,
        password,
      });

      if (res.data && res.data.id) {
        const userData = {
          id: res.data.id,
          full_name: res.data.full_name,
          role: res.data.role || 'customer',
          email: email,
        };
        setUser(userData);
        return { success: true, user: userData, message: res.data.message || 'Login successful' };
      } else {
        return { success: false, message: res.data?.message || 'Login failed' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      return { success: false, message: msg };
    }
  };

  const register = async (fullName, email, password, role = 'customer') => {
    try {
      const res = await api.post('/auth.php', {
        action: 'register',
        full_name: fullName,
        email,
        password,
        role,
      });

      if (res.data && res.data.id) {
        return { success: true, message: 'Registration successful! You can now log in.' };
      } else {
        return { success: false, message: res.data?.message || 'Registration failed' };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check inputs.';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('solestyle_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
