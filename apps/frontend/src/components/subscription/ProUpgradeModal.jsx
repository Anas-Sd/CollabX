import React, { useState, useEffect, useRef } from 'react';
import { Crown, Check, X, Zap, Loader2, Clock, Users, Timer, Sparkles, Database } from 'lucide-react';
import api from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useNotificationStore } from '../../store/notificationStore';

export default function ProUpgradeModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
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

  if (!isOpen) return null;

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
              useNotificationStore.getState().addNotification('Successfully upgraded to PRO!', 'success');
              // Update local user state
              setUser({ ...user, subscriptionType: 'PRO' });
              onClose();
            } else {
              useNotificationStore.getState().addNotification('Payment verification failed', 'error');
            }
          } catch (err) {
            console.error('Verification Error:', err);
            useNotificationStore.getState().addNotification('Error verifying payment', 'error');
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
        console.error('Payment Failed:', response.error);
        useNotificationStore.getState().addNotification(response.error.description || 'Payment Failed', 'error');
      });

    } catch (err) {
      console.error('Order Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Could not initiate payment';
      useNotificationStore.getState().addNotification(`Error: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden" onClick={handleOutsideClick}>
      <div ref={modalRef} className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#F5A623]/30 bg-[#0A0A0F] shadow-[0_0_50px_rgba(245,166,35,0.15)] flex flex-col md:flex-row">
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[#F5A623]/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[#FFC107]/10 blur-[100px] pointer-events-none"></div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute cursor-pointer hover:bg-yellow-500/90 top-4 right-4 z-20 rounded-full p-2 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

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

          <div className="w-full space-y-5">
            {[
              { name: "Custom Session Durations", icon: Clock },
              { name: "Expanded Participant Limits", icon: Users },
              { name: "Real-time Time Extensions", icon: Timer },
              { name: "Expanded Historic Retention", icon: Database },
              { name: "Premium Glowing Effects", icon: Sparkles }
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-black">
                  <Icon size={14} strokeWidth={3} />
                </div>
                <span className="text-base font-medium text-white/90">{feature.name}</span>
              </div>
              )
            })}
          </div>
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

      </div>
    </div>
  );
}
