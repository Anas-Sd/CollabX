import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2, Send } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useNotificationStore } from '../../store/notificationStore';

export default function FeedbackModal({ isOpen, onClose, context = 'General' }) {
  const user = useUserStore((state) => state.user);
  const addNotification = useNotificationStore((state) => state.addNotification);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState(user?.name || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      addNotification('Please select a star rating.', 'warning');
      return;
    }
    if (!message.trim()) {
      addNotification('Please provide some feedback message.', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/send-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          rating,
          message: message.trim(),
          userEmail: user?.email || '',
          context
        })
      });
      
      if (!response.ok) throw new Error('Failed to send feedback');
      
      addNotification('Thank you for your feedback!', 'success');
      setRating(0);
      setMessage('');
      onClose();
    } catch (err) {
      addNotification('Failed to send feedback. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-[#0A0A0F] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-xl font-bold text-white tracking-tight">Your Feedback Is Most Valued</h3>
              <button 
                onClick={onClose}
                className="text-white/50 cursor-pointer hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm text-white/60 font-medium">How would you rate your experience?</span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star 
                        size={32} 
                        className={`transition-colors ${(hoverRating || rating) >= star ? 'fill-[#F5A623] text-[#F5A623]' : 'text-white/20'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-medium">Name (Optional)</label>
                  <input 
                    type="text" 
                    // value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="You can be Anonymous if you want!!"
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-2 font-medium">Your Feedback</label>
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think or report an issue..."
                    rows={4}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F5A623]/50 transition-colors resize-none"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white cursor-pointer text-black font-bold text-sm tracking-widest uppercase rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Send Feedback</>}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
