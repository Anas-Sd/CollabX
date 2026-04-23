import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, ChevronRight, Zap } from 'lucide-react';
import api from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useNotificationStore } from '../../store/notificationStore';

export default function CreateRoomModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState(60);
  const [limit, setLimit] = useState(2);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUserStore();

  if (!isOpen) return null;

  const isPro = user?.subscriptionType === 'PRO';

  const handleSelectDuration = (val, requiresPro) => {
    if (requiresPro && !isPro) {
      useNotificationStore.getState().addNotification('PRO subscription required for this duration.', 'warning');
      return;
    }
    setDuration(val);
  };

  const handleSelectLimit = (val, requiresPro) => {
    if (requiresPro && !isPro) {
      useNotificationStore.getState().addNotification('PRO subscription required for this participant limit.', 'warning');
      return;
    }
    setLimit(val);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      useNotificationStore.getState().addNotification('You need to enter a Workspace name.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        maxMembers: limit
      };

      if (duration === 'CUSTOM') {
        if (customDuration < 5 || customDuration > 240) {
          useNotificationStore.getState().addNotification('Custom duration must be between 5 and 240 minutes.', 'warning');
          setLoading(false);
          return;
        }
        payload.durationMinutes = parseInt(customDuration, 10);
      } else {
        payload.durationMinutes = duration;
      }

      const res = await api.post('/rooms', payload);
      const roomId = res.data.id || res.data.roomId;

      if (roomId) {
        useNotificationStore.getState().addNotification('Workspace initialized successfully!', 'success');
        router.push(`/room/${roomId}`);
      }
    } catch (err) {
      console.error('Failed to create room', err);
      useNotificationStore.getState().addNotification('Failed to create workspace. Server might be unreachable.', 'error');
      setLoading(false); // Only set to false on error, let it remain true during successful navigation
    }
  };

  const proBadge = (
    <span className="absolute -top-2.5 -right-3 rotate-[12deg] bg-gradient-to-r from-yellow-400 to-amber-600 text-black text-[8px] font-black px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(250,204,21,0.4)] z-10 border border-yellow-200/50">
      PRO
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Animated Backdrop Blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-opacity animate-in fade-in duration-500"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg transform rounded-3xl bg-[#0a0a0f]/90 border border-white/10 shadow-[0_0_60px_-15px_rgba(99,102,241,0.3)] overflow-hidden animate-in zoom-in-95 fade-in duration-300">

        {/* Animated Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-70"></div>
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-white/50 blur-[2px]"></div>

        {/* Ambient background glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute right-6 top-6 p-2 rounded-full bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <Zap size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Launch Workspace</h2>
              <p className="text-sm text-muted-foreground font-medium">Configure your real-time session</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-7">
            {/* Workspace Name */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Workspace Name <span className="text-danger">*</span>
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Production Hotfix & Review"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:border-primary/50 focus:bg-black/60 focus:outline-none transition-all shadow-inner group-hover:border-white/20"
                />
              </div>
            </div>

            {/* Session Duration */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Session Duration
              </label>
              <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shadow-inner relative">
                {[
                  { label: '30M', value: 30, pro: false },
                  { label: '1H', value: 60, pro: false },
                  { label: '2H', value: 120, pro: false },
                  { label: 'Custom', value: 'CUSTOM', pro: true }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelectDuration(opt.value, opt.pro)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all relative z-10 ${duration === opt.value
                      ? 'bg-gradient-to-b from-white/10 to-transparent text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-white/10'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    {opt.label}
                    {opt.pro && proBadge}
                  </button>
                ))}
              </div>
              {duration === 'CUSTOM' && (
                <div className="pt-2 animate-in slide-in-from-top-2">
                  <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl shadow-inner px-4">
                    <span className="text-xs text-muted-foreground mr-3">Minutes:</span>
                    <input
                      type="text"
                      value={customDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val && !/^\d*$/.test(val)) {
                          useNotificationStore.getState().addNotification('Only numbers are allowed for custom duration.', 'warning');
                          return;
                        }
                        setCustomDuration(val);
                      }}
                      className="flex-1 bg-transparent py-3 text-sm text-white focus:outline-none placeholder:text-white/20"
                      placeholder="e.g. 90"
                    />
                    <span className="text-xs text-primary font-bold ml-3">(5 - 240)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Participant Limit */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                Participant Limit
              </label>
              <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shadow-inner relative">
                {[
                  { label: '2', value: 2, pro: false },
                  { label: '5', value: 5, pro: false },
                  { label: '10', value: 10, pro: true },
                  { label: '20', value: 20, pro: true }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handleSelectLimit(opt.value, opt.pro)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all relative z-10 ${limit === opt.value
                      ? 'bg-gradient-to-b from-white/10 to-transparent text-white shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-white/10'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                  >
                    {opt.label}
                    {opt.pro && proBadge}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] active:scale-[0.98] border border-primary/50 relative overflow-hidden group"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Sparkles size={16} className="animate-spin" /> Initializing...
                  </span>
                ) : (
                  <>
                    Initialize Space
                    <ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
