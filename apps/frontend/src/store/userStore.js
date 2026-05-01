import { create } from 'zustand';
import { useNotificationStore } from './notificationStore';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

const getInitialState = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const loginTimestamp = localStorage.getItem('loginTimestamp');
    
    if (token && userStr && loginTimestamp) {
      const now = Date.now();
      const sessionAge = now - parseInt(loginTimestamp, 10);
      
      if (sessionAge > SESSION_DURATION_MS) {
        // Session expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
        
        setTimeout(() => {
          useNotificationStore.getState().addNotification('Your session has expired. Please log in again.', 'warning');
        }, 500);

        return { user: null, isAuthenticated: false };
      }

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
      localStorage.setItem('loginTimestamp', Date.now().toString());
      sessionStorage.setItem('justLoggedIn', 'true');
    }
    set({ user: userData, isAuthenticated: true });
  },

  setUser: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
    set({ user: userData });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTimestamp');
      sessionStorage.setItem('justLoggedOut', 'true');
    }
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: () => {
    set(getInitialState());
  }
}));
