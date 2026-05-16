import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (message, type = 'info', duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString();
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }]
    }));
    // duration=0 means persistent — never auto-dismiss (user must close manually)
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }));
      }, duration);
    }
  },
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  }))
}));
