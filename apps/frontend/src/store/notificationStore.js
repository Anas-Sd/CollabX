import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (message, type = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      }));
    }, 5000);
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  }))
}));
