import { create } from 'zustand';

const getInitialState = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return { user, isAuthenticated: true };
      } catch (e) {
        return { user: null, isAuthenticated: false };
      }
    }
  }
  return { user: null, isAuthenticated: false };
};

export const useUserStore = create((set) => ({
  ...getInitialState(),

  login: (userData, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    set({ user: userData, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: () => {
    set(getInitialState());
  }
}));
