import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import api from '../../lib/api';

export default function CreateRoomModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/rooms', { name: name || 'Untitled Workspace' });
      const roomId = res.data.id || res.data.roomId; // Adjust based on actual backend response
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    } catch (err) {
      console.error('Failed to create room', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-primary">✨</span> Launch Workspace
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. System Design Interview"
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Initialize Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
