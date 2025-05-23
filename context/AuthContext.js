import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true to check session
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (response.status !== 401) { // Don't set error for normal "not logged in"
          const errData = await response.json();
          setError(errData.error || 'Failed to fetch user');
        }
      }
    } catch (e) {
      console.error("AuthContext fetchUser error:", e);
      setUser(null);
      setError('An unexpected error occurred while fetching user data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        router.push('/'); // Redirect to home or dashboard
        return { success: true, user: data.user };
      } else {
        setError(data.error || 'Login failed');
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (e) {
      console.error("AuthContext login error:", e);
      setError('An unexpected error occurred during login.');
      return { success: false, error: 'An unexpected error occurred during login.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, confirmPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirmPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        // If email confirmation is required, data.session might be null.
        // The API returns a message in this case.
        if (data.session) {
          setUser(data.user);
          router.push('/');
        }
        // The page component will display data.message if present
        return { success: true, user: data.user, message: data.message };
      } else {
        setError(data.error || 'Registration failed');
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (e) {
      console.error("AuthContext register error:", e);
      setError('An unexpected error occurred during registration.');
      return { success: false, error: 'An unexpected error occurred during registration.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        setUser(null);
        router.push('/auth/login'); // Redirect to login page
        return { success: true };
      } else {
        const data = await response.json();
        setError(data.error || 'Logout failed');
        return { success: false, error: data.error || 'Logout failed' };
      }
    } catch (e) {
      console.error("AuthContext logout error:", e);
      setError('An unexpected error occurred during logout.');
      return { success: false, error: 'An unexpected error occurred during logout.' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    fetchUser // expose fetchUser if manual refresh is needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};