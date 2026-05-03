'use client';
import { useNotificationStore } from '../../store/notificationStore';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((toast) => {
          let Icon = Info;
          let colorClass = 'text-white border-border';
          
          if (toast.type === 'success') {
            Icon = CheckCircle2;
            colorClass = 'text-[#00D4AA] border-[#00D4AA]/30';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'text-[#FF4A4A] border-[#FF4A4A]/30';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            colorClass = 'text-[#F5A623] border-[#F5A623]/30';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(4px)', transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-xl bg-black border min-w-[320px] max-w-[400px] ${colorClass}`}
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-xs font-semibold text-white leading-relaxed drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{toast.message}</span>
              </div>

              <button
                onClick={() => removeNotification(toast.id)}
                className="p-1 shrink-0 text-muted-foreground hover:text-white rounded-md transition-colors hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
