'use client';
import { useNotificationStore } from '../../store/notificationStore';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-bottom-5 fade-in duration-300 min-w-[300px] ${toast.type === 'success' ? 'bg-success/10 border-success/30 text-success' :
            toast.type === 'error' ? 'bg-danger/10 border-danger/30 text-danger' :
              toast.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                'bg-card border-border text-white'
            }`}
        >
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Info size={18} />}
          {toast.type === 'warning' && <AlertCircle size={18} />}

          <span className="flex-1 text-sm font-medium">{toast.message}</span>

          <button
            onClick={() => removeNotification(toast.id)}
            className="p-1 hover:bg-black/10 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
