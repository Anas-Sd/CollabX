import React, { useState, useEffect, useRef } from 'react';
import { Crown, Check, X, Zap, Loader2, Clock, Users, Timer, Sparkles, Database, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useNotificationStore } from '../../store/notificationStore';

export default function ProUpgradeModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const { user, setUser } = useUserStore();
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        useNotificationStore.getState().addNotification('Failed to load Razorpay SDK', 'error');
        setLoading(false);
        return;
      }

      // Create Order
      const orderResponse = await api.post('/payments/create-order', {
        amount: 49900, // ₹499 in paise
        currency: 'INR'
      });

      const orderData = typeof orderResponse.data === 'string' 
        ? JSON.parse(orderResponse.data) 
        : orderResponse.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CollabX Pro',
        description: 'Upgrade to CollabX Pro Subscription',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // Verify Payment
            const verifyRes = await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              setPaymentStatus({ type: 'success', message: 'You have unlocked the ultimate collaborative coding experience. Enjoy zero limits and full historical retention.' });
              setUser({ ...user, subscriptionType: 'PRO' });
            } else {
              setPaymentStatus({ type: 'error', message: 'Payment verification failed. Please contact support.' });
            }
          } catch (err) {
            console.error('Verification Error:', err);
            setPaymentStatus({ type: 'error', message: 'An error occurred while verifying your payment.' });
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#8B5CF6' // Primary purple
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response) {
        console.warn('Payment Failed:', response.error);
        setPaymentStatus({ type: 'error', message: response?.error?.description || 'Your payment could not be processed.' });
      });

    } catch (err) {
      console.error('Order Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Could not initiate payment sequence.';
      setPaymentStatus({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring", stiffness: 300, damping: 25,
        staggerChildren: 0.1, delayChildren: 0.2
      }
    },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleOutsideClick}
          />
          
          <motion.div 
            ref={modalRef} 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#F5A623]/30 bg-[#0A0A0F] shadow-[0_0_50px_rgba(245,166,35,0.15)] flex flex-col md:flex-row min-h-[400px]"
          >
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[#F5A623]/20 blur-[100px] pointer-events-none z-0"></div>
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[#FFC107]/10 blur-[100px] pointer-events-none z-0"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute cursor-pointer hover:bg-yellow-500/90 top-4 right-4 z-50 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <AnimatePresence mode="wait">
          {paymentStatus ? (
            <motion.div
              key="payment-status"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full flex flex-col items-center justify-center p-12 text-center"
            >
              {paymentStatus.type === 'success' ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-success/10 text-success flex items-center justify-center mb-6 border border-success/30 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-success to-emerald-400 mb-4">
                    Payment Successful!
                  </h2>
                  <p className="text-muted-foreground text-lg mb-10 max-w-md">
                    {paymentStatus.message}
                  </p>
                  <button
                    onClick={() => {
                      setPaymentStatus(null);
                      onClose();
                    }}
                    className="w-full max-w-[250px] cursor-pointer py-4 rounded-xl text-sm font-bold bg-success text-black hover:bg-success/90 transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                  >
                    Start Building
                  </button>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-6 border border-danger/30 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
                    <XCircle size={48} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-danger to-red-400 mb-4">
                    Payment Failed
                  </h2>
                  <p className="text-muted-foreground text-lg mb-10 max-w-md">
                    {paymentStatus.message}
                  </p>
                  <button
                    onClick={() => setPaymentStatus(null)}
                    className="w-full max-w-[250px] cursor-pointer py-4 rounded-xl text-sm font-bold bg-background border border-border text-white hover:bg-muted transition-all"
                  >
                    Try Again
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="upgrade-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col md:flex-row w-full h-full relative z-10"
            >

        {/* Left Side: Features */}
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center flex-1 border-b md:border-b-0 md:border-r border-white/10 bg-gradient-to-br from-black/60 to-transparent">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5A623]/20 to-[#F5A623]/5 border border-[#F5A623]/30 shadow-[0_0_30px_rgba(245,166,35,0.3)]">
            <Crown className="h-8 w-8 text-[#F5A623]" />
          </div>

          <h2 className="mb-2 text-4xl font-black tracking-tight text-white">
            CollabX <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#FFC107]">PRO</span>
          </h2>
          <p className="mb-8 text-muted-foreground text-lg">
            Unlock the ultimate collaborative coding experience with advanced features and zero limits.
          </p>

          <motion.div className="w-full space-y-5">
            {[
              { name: "Custom Session Durations", icon: Clock },
              { name: "Expanded Participant Limits", icon: Users },
              { name: "Real-time Time Extensions", icon: Timer },
              { name: "Expanded Historic Retention", icon: Database },
              { name: "Premium Glowing Effects", icon: Sparkles }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
              <motion.div variants={itemVariants} key={i} className="flex items-center gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                  <Icon size={14} strokeWidth={3} />
                </div>
                <span className="text-base font-medium text-white/90">{feature.name}</span>
              </motion.div>
              )
            })}
          </motion.div>
        </div>

        {/* Right Side: Payment */}
        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center items-center w-full md:w-[350px] bg-black/40">
          <div className="w-full text-center mb-8">
            <p className="text-sm font-bold text-[#F5A623] mb-2 tracking-widest uppercase">30-Day Pass</p>
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-5xl font-black text-white">₹499</span>
              <span className="text-lg text-muted-foreground mb-1">/mo</span>
            </div>
            <p className="text-sm text-muted-foreground">Access for 30 days </p>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="group cursor-pointer relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFC107] px-4 py-4 text-base font-bold text-black transition-all hover:opacity-90 hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Zap className="h-5 w-5" />
                <span>PROCEED TO PAYMENT</span>
              </>
            )}
            {/* Shine effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer pointer-events-none" />
          </button>
          
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground/60 text-center">
            <p>Secured by Razorpay • Instant Activation</p>
            <p>You can cancel anytime.</p>
          </div>
        </div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
