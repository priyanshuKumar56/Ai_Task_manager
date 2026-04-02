import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: ({ user, accessToken, refreshToken }) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      },

      clearAuth: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          get().setAuth(data.data);
          return { success: true };
        } catch (err) {
          return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', { username, email, password });
          get().setAuth(data.data);
          return { success: true };
        } catch (err) {
          return { success: false, message: err.response?.data?.message || 'Registration failed' };
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        get().clearAuth();
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const { data } = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefresh } = data.data;
          set({ accessToken, refreshToken: newRefresh });
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          return true;
        } catch {
          get().clearAuth();
          return false;
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
