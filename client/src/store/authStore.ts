import { create } from 'zustand';
import apiRequest, { saveToken, clearToken } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (name?: string, email?: string, password?: string, currentPassword?: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveToken(res.token);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      saveToken(res.token);
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout request failed, clearing local state anyway');
    } finally {
      clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ user: User }>('/auth/me');
      set({ user: res.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      // User is not authenticated, clean up
      clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (name, email, password, currentPassword) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiRequest<{ user: User }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, email, password, currentPassword }),
      });
      set({ user: res.user, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Profile update failed', isLoading: false });
      throw err;
    }
  },
}));
