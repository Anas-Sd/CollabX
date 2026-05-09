'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useUserStore } from '../../../store/userStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { Eye, EyeOff, Mail, QrCode, ArrowLeft, Loader2, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

function AuthContent() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  
  // --- Shared State ---
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const restoreSession = useUserStore((state) => state.restoreSession);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  
  useEffect(() => { restoreSession(); }, [restoreSession]);
  useEffect(() => { if (isAuthenticated) router.push('/'); }, [isAuthenticated, router]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setShowPassword(false);
    if (newMode === 'register') {
      window.history.pushState(null, '', '/register');
    } else {
      window.history.pushState(null, '', '/login');
    }
  };

  // ==========================================
  //               LOGIN LOGIC
  // ==========================================
  const [loginStep, setLoginStep] = useState('LOGIN'); 
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loginExpectedOtp, setLoginExpectedOtp] = useState('');
  const [loginUserInputCode, setLoginUserInputCode] = useState('');
  const loginOtpRefs = useRef([]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail && !loginPassword) {
      useNotificationStore.getState().addNotification('Please enter both email and password', 'warning');
      return;
    }
    if (!loginEmail) {
      useNotificationStore.getState().addNotification('Please enter your email', 'warning');
      return;
    }
    if (!loginPassword) {
      useNotificationStore.getState().addNotification('Please enter your password', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      useNotificationStore.getState().addNotification('Please enter a valid email address', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      useNotificationStore.getState().addNotification('Logged in successfully', 'success');
      login(res.data.user, res.data.token);
      router.push('/');
    } catch (err) {
      useNotificationStore.getState().addNotification(err.response?.data?.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { token: tokenResponse.access_token });
      useNotificationStore.getState().addNotification('Logged in with Google successfully', 'success');
      login(res.data.user, res.data.token);
      router.push('/');
    } catch (err) {
      useNotificationStore.getState().addNotification(err.response?.data?.message || 'Google Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    useNotificationStore.getState().addNotification('Google Login failed.', 'error');
  };

  const googleLoginAction = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });


  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      useNotificationStore.getState().addNotification('Please enter your email', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      useNotificationStore.getState().addNotification('Please enter a valid email', 'warning');
      return;
    }
    setLoading(true);
    try {
      try {
        await api.get(`/auth/check-email?email=${encodeURIComponent(forgotEmail)}`);
        useNotificationStore.getState().addNotification('No account found with this email.', 'warning');
        setLoading(false);
        return;
      } catch (checkErr) {
        if (checkErr.response?.status === 400) {
          const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
          setLoginExpectedOtp(generatedOtp);
          useNotificationStore.getState().addNotification('OTP sent to your email', 'success');
          setLoginStep('FORGOT_OTP');
          setLoginUserInputCode('');
          fetch('/api/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail, otp: generatedOtp })
          }).catch(err => console.error("OTP send failed", err));
        } else {
          useNotificationStore.getState().addNotification('Failed to verify email. Try again later.', 'error');
        }
      }
    } catch (err) {
      useNotificationStore.getState().addNotification('An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    let newOtpArray = loginUserInputCode.split('');
    while(newOtpArray.length < 6) newOtpArray.push('');
    newOtpArray[index] = value.slice(-1);
    const newCode = newOtpArray.join('');
    setLoginUserInputCode(newCode);
    
    if (value && index < 5) loginOtpRefs.current[index + 1]?.focus();
    
    if (newCode.length === 6 && newCode.indexOf('') === -1) {
      if (newCode === loginExpectedOtp) {
        useNotificationStore.getState().addNotification('OTP verified', 'success');
        setLoginStep('FORGOT_RESET');
      } else {
        useNotificationStore.getState().addNotification('Invalid OTP code. Please try again.', 'error');
      }
    }
  };

  const handleLoginOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !loginUserInputCode[index] && index > 0) {
      loginOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword && !confirmNewPassword) {
      useNotificationStore.getState().addNotification('Please enter both password fields', 'warning');
      return;
    }
    if (!newPassword) {
      useNotificationStore.getState().addNotification('Please enter a new password', 'warning');
      return;
    }
    if (!confirmNewPassword) {
      useNotificationStore.getState().addNotification('Please confirm your new password', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      useNotificationStore.getState().addNotification('Password must be at least 6 characters', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      useNotificationStore.getState().addNotification('Passwords do not match', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: forgotEmail, newPassword });
      useNotificationStore.getState().addNotification('Password reset successfully. You can now login.', 'success');
      setLoginStep('LOGIN');
      setLoginEmail(forgotEmail);
      setLoginPassword('');
      setForgotEmail('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      useNotificationStore.getState().addNotification(err.response?.data?.message || 'Failed to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  //             REGISTER LOGIC
  // ==========================================
  const [regStep, setRegStep] = useState(1); 
  const [regMethod, setRegMethod] = useState(''); 
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regExpectedCode, setRegExpectedCode] = useState('');
  const [regUserInputCode, setRegUserInputCode] = useState('');
  const [regQrUrl, setRegQrUrl] = useState('');
  const regOtpRefs = useRef([]);

  const handleRegOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    let newOtpArray = regUserInputCode.split('');
    while(newOtpArray.length < 6) newOtpArray.push('');
    newOtpArray[index] = value.slice(-1);
    setRegUserInputCode(newOtpArray.join(''));
    if (value && index < 5) regOtpRefs.current[index + 1]?.focus();
  };

  const handleRegOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !regUserInputCode[index] && index > 0) {
      regOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleRegInitialSubmit = async (e) => {
    e.preventDefault();
    if (!regName && !regEmail && !regPassword) {
      useNotificationStore.getState().addNotification('Please enter all required fields', 'warning');
      return;
    }
    if (!regName) {
      useNotificationStore.getState().addNotification('Please enter your name', 'warning');
      return;
    }
    if (!regEmail) {
      useNotificationStore.getState().addNotification('Please enter your email', 'warning');
      return;
    }
    if (!regPassword) {
      useNotificationStore.getState().addNotification('Please enter your password', 'warning');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail)) {
      useNotificationStore.getState().addNotification('Please enter a valid email address', 'warning');
      return;
    }
    if (regPassword.length < 6) {
      useNotificationStore.getState().addNotification('Password must be at least 6 characters', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.get(`/auth/check-email?email=${encodeURIComponent(regEmail)}`);
      setRegStep(2);
    } catch (err) {
      useNotificationStore.getState().addNotification(err.response?.data?.message || 'This email is already registered.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const selectRegMethod = async (selectedMethod) => {
    setLoading(true);
    setRegMethod(selectedMethod);
    const code = generateRandomCode();
    setRegExpectedCode(code);
    try {
      if (selectedMethod === 'OTP') {
        setRegStep(3);
        fetch('/api/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regEmail, otp: code })
        }).catch(err => console.error('Failed to send OTP', err));
      } else if (selectedMethod === 'QR') {
        const res = await fetch('/api/generate-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: code })
        });
        if (!res.ok) throw new Error('Failed to generate QR Code');
        const data = await res.json();
        setRegQrUrl(data.qrUrl);
        setRegStep(3);
      }
    } catch (err) {
      useNotificationStore.getState().addNotification('An error occurred while setting up verification', 'error');
      setRegMethod('');
    } finally {
      setLoading(false);
    }
  };

  const handleRegVerificationSubmit = async (e) => {
    e.preventDefault();
    if (regUserInputCode !== regExpectedCode) {
      useNotificationStore.getState().addNotification('Invalid verification code. Please try again.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name: regName, email: regEmail, password: regPassword });
      login(res.data.user, res.data.token);
      useNotificationStore.getState().addNotification('Account verified & created successfully', 'success');
      router.push('/');
    } catch (err) {
      useNotificationStore.getState().addNotification(err.response?.data?.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  //               RENDER
  // ==========================================
  
  // Determine if the container should expand for QR
  const isExpandedQR = mode === 'register' && regStep === 3 && regMethod === 'QR';

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative p-4 overflow-hidden">
      
      {/* Return to Dashboard Button */}
      <Link href="/" className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest z-50">
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>

      <motion.div 
        layout
        transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
        className={`w-full ${isExpandedQR ? 'max-w-6xl' : 'max-w-5xl'} bg-[#0A0A0F] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col ${mode === 'register' ? 'md:flex-row-reverse' : 'md:flex-row'} overflow-hidden relative z-10 transition-colors duration-500`}
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-none z-0"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none z-0"></div>
        
        {/* VISUAL HALF (Animated Slide) */}
        <AnimatePresence>
          {!isExpandedQR && (
            <motion.div 
              key="visual-half"
              layout
              initial={{ opacity: 1, width: '50%' }}
              exit={{ opacity: 0, width: 0, padding: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
              className="hidden md:flex flex-col justify-between flex-1 p-12 relative overflow-hidden z-10"
            >
          
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div 
                key="login-visual"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <style>{`
                  @keyframes drawX {
                    0% { stroke-dashoffset: 100; opacity: 0; }
                    10% { opacity: 1; }
                    40% { stroke-dashoffset: 0; filter: drop-shadow(0 0 15px rgba(245,165,36,0.8)); }
                    60% { stroke-dashoffset: 0; filter: drop-shadow(0 0 15px rgba(245,165,36,0.8)); }
                    90% { opacity: 1; }
                    100% { stroke-dashoffset: -100; opacity: 0; }
                  }
                `}</style>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#F5A524]/10 blur-[80px] rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(245,165,36,0.5)]">
                    <defs>
                      <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F5A524" />
                        <stop offset="50%" stopColor="#FFC107" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                    <path d="M 25 25 L 75 75" fill="none" stroke="url(#xGradient)" strokeWidth="10" strokeLinecap="round" style={{ strokeDasharray: 100, animation: 'drawX 3s ease-in-out infinite' }} />
                    <path d="M 75 25 L 25 75" fill="none" stroke="url(#xGradient)" strokeWidth="10" strokeLinecap="round" style={{ strokeDasharray: 100, animation: 'drawX 3s ease-in-out infinite 0.5s' }} />
                  </svg>
                </div>
                <div className="absolute top-12 left-12 z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-[#F5A524]" />
                    <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Workspace</span>
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-4">CollabX</h1>
                </div>
                <div className="absolute bottom-12 left-12 z-10">
                  <p className="text-white/70 text-sm leading-relaxed max-w-[300px]">"The most seamless collaborative coding experience we've ever used. It feels like magic."</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F5A524]/20 flex items-center justify-center text-[#F5A524] font-bold text-xs">SD</div>
                    <div>
                      <p className="text-white text-xs font-bold">SD ANAS</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">Lead Developer</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="register-visual"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <style>{`
                  @keyframes floatBracket {
                    0% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 15px rgba(108,99,255,0.6)); }
                    50% { transform: translateY(-15px) scale(1.05); filter: drop-shadow(0 0 25px rgba(108,99,255,0.9)); }
                    100% { transform: translateY(0px) scale(1); filter: drop-shadow(0 0 15px rgba(108,99,255,0.6)); }
                  }
                `}</style>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#6C63FF]/10 blur-[80px] rounded-full animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full" style={{ animation: 'floatBracket 4s ease-in-out infinite' }}>
                    <defs>
                      <linearGradient id="codeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6C63FF" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </linearGradient>
                    </defs>
                    <path d="M 40 20 L 20 50 L 40 80 M 60 20 L 80 50 L 60 80" fill="none" stroke="url(#codeGradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="absolute top-12 right-12 z-10 text-right">
                  <div className="flex items-center justify-end gap-2 mb-2">
                    <span className="text-white/60 text-xs uppercase tracking-widest font-bold">Community</span>
                    <Sparkles className="w-4 h-4 text-[#6C63FF]" />
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight mb-4">Join Us</h1>
                </div>
                <div className="absolute bottom-12 right-12 z-10 flex flex-col items-end text-right">
                  <p className="text-white/70 text-sm leading-relaxed max-w-[300px]">"Unleash your team's potential with real-time editing and intelligent tools."</p>
                  <div className="mt-4 flex items-center gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-[#6C63FF]/20 flex items-center justify-center text-[#6C63FF] font-bold text-xs">CX</div>
                    <div>
                      <p className="text-white text-xs font-bold">CollabX</p>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider">Next-Gen IDE</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM HALF (Animated Slide) */}
        <motion.div layout transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }} className="flex-[1.2] p-8 md:p-16 flex flex-col justify-center relative z-20 min-h-[550px]">
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div 
                key="form-login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <AnimatePresence mode="wait">
                  {loginStep === 'LOGIN' && (
                    <motion.div key="login_step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest">Access your account</p>
                    </div>
                    <form onSubmit={handleLoginSubmit} className="space-y-6" noValidate>
                      <div className="w-full mb-4">
                        <button
                          type="button"
                          onClick={() => googleLoginAction()}
                          disabled={loading}
                          className="w-full py-4 bg-black/90 cursor-pointer hover:brightness-150 border-2 border-white text-white font-bold rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Continue with Google
                        </button>
                      </div>
                      <div className="relative flex items-center justify-center my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-[#0A0A0F] px-2 text-white/40 uppercase tracking-widest">or sign in with email</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-2 uppercase tracking-widest">Email</label>
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 text-sm"
                          placeholder="name@company.com"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest">Password</label>
                          <button 
                            type="button" 
                            onClick={() => { setLoginStep('FORGOT_EMAIL'); }}
                            className="text-white/40 hover:text-white transition-colors text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all pr-12 placeholder:text-white/20 text-sm"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1 cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 mt-2 bg-white/90 cursor-pointer hover:bg-white text-black font-bold rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="animate-spin w-4 h-4 text-black" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </form>
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <p className="text-xs text-white/40">
                        New user?{' '}
                        <button onClick={() => switchMode('register')} className="text-white hover:text-[#F5A524] transition-colors font-semibold cursor-pointer">
                          Collab with us now
                        </button>
                      </p>
                    </div>
                    </motion.div>
                  )}

                  {loginStep === 'FORGOT_EMAIL' && (
                    <motion.div key="forgot_email_step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <button 
                      onClick={() => setLoginStep('LOGIN')}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-10 w-max cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest leading-relaxed">Enter your email address to receive an OTP.</p>
                    </div>
                    <form onSubmit={handleForgotEmailSubmit} className="space-y-6" noValidate>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-2 uppercase tracking-widest">Account Email</label>
                        <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 text-sm" placeholder="name@company.com" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-white/90 hover:bg-white cursor-pointer text-black font-bold rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin w-4 h-4 text-black" /> : 'Send OTP'}
                      </button>
                    </form>
                    </motion.div>
                  )}

                  {loginStep === 'FORGOT_OTP' && (
                    <motion.div key="forgot_otp_step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <button 
                      onClick={() => { setLoginStep('FORGOT_EMAIL'); setLoginUserInputCode(''); }}
                      className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-10 w-max cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest leading-relaxed">Enter the 6-digit code sent to <span className="text-white">{forgotEmail}</span></p>
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-6">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <input key={idx} ref={(el) => (loginOtpRefs.current[idx] = el)} type="text" maxLength={1} value={loginUserInputCode[idx] || ''} onChange={(e) => handleLoginOtpChange(idx, e.target.value)} onKeyDown={(e) => handleLoginOtpKeyDown(idx, e)} className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold font-mono bg-black border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/50 transition-all shadow-inner" />
                      ))}
                    </div>
                    </motion.div>
                  )}

                  {loginStep === 'FORGOT_RESET' && (
                    <motion.div key="forgot_reset_step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold text-white mb-2">New Password</h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest leading-relaxed">Enter and confirm your new secure password.</p>
                    </div>
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-6" noValidate>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-2 uppercase tracking-widest">New Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all pr-12 placeholder:text-white/20 text-sm" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1 cursor-pointer">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-2 uppercase tracking-widest">Confirm Password</label>
                        <input type={showPassword ? "text" : "password"} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 text-sm" placeholder="••••••••" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin w-4 h-4 text-black" /> : 'Confirm Reset'}
                      </button>
                    </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {mode === 'register' && (
              <motion.div 
                key="form-register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <AnimatePresence mode="wait">
                  {regStep === 1 && (
                    <motion.div key="reg_1_step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest">Join CollabX today</p>
                    </div>
                    <form onSubmit={handleRegInitialSubmit} className="space-y-6" noValidate>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-2 uppercase tracking-widest">Name</label>
                        <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 text-sm" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-2 uppercase tracking-widest">Email</label>
                        <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-white/20 text-sm" placeholder="name@company.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 mb-2 uppercase tracking-widest">Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all pr-12 placeholder:text-white/20 text-sm" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-1 cursor-pointer">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 mt-2 bg-white/90 cursor-pointer hover:bg-white text-black font-bold rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin w-4 h-4 text-black" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </form>
                    <div className="mt-8 pt-6 border-t border-white/5">
                      <p className="text-xs text-white/40">
                        Already have an account?{' '}
                        <button onClick={() => switchMode('login')} className="text-white hover:text-[#6C63FF] transition-colors font-semibold cursor-pointer">
                          Sign in
                        </button>
                      </p>
                    </div>
                    </motion.div>
                  )}

                  {regStep === 2 && (
                    <motion.div key="reg_2_step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <button onClick={() => setRegStep(1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-10 w-max cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div className="mb-10">
                      <h2 className="text-2xl font-bold text-white mb-2">Verify Account</h2>
                      <p className="text-white/40 text-xs uppercase tracking-widest leading-relaxed">Choose a verification method</p>
                    </div>
                    <div className="space-y-4">
                      <button onClick={() => selectRegMethod('OTP')} disabled={loading} className="w-full group relative overflow-hidden p-6 bg-black border border-white/10 hover:border-white/30 rounded-2xl flex items-center gap-5 transition-all duration-300 text-left disabled:opacity-50 cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Mail className="text-white/70 w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-white text-sm font-bold mb-1 tracking-wide">Verify via Email OTP</h3>
                          <p className="text-white/40 text-xs leading-relaxed">We'll send a 6-digit code to your inbox.</p>
                        </div>
                      </button>
                      <button onClick={() => selectRegMethod('QR')} disabled={loading} className="w-full group relative overflow-hidden p-6 bg-black border border-[#F5A524]/20 hover:border-[#F5A524]/50 rounded-2xl flex items-center gap-5 transition-all duration-300 text-left disabled:opacity-50 cursor-pointer">
                        <div className="absolute top-0 right-0 bg-[#F5A524]/10 text-[#F5A524] text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-l border-b border-[#F5A524]/20">BETA</div>
                        <div className="w-12 h-12 rounded-full bg-[#F5A524]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <QrCode className="text-[#F5A524] w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-white text-sm font-bold mb-1 tracking-wide">Verify via QR Code</h3>
                          <p className="text-white/40 text-xs leading-relaxed">Scan a dynamic QR code.</p>
                        </div>
                      </button>
                    </div>
                    </motion.div>
                  )}

                  {regStep === 3 && (
                    <motion.div key="reg_3_step" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <button onClick={() => { setRegStep(2); setRegUserInputCode(''); }} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-10 w-max cursor-pointer">
                      <ArrowLeft className="w-4 h-4" /> Change Method
                    </button>
                    <form onSubmit={handleRegVerificationSubmit} className="space-y-6" noValidate>
                      {regMethod === 'QR' ? (
                        <div className="flex flex-col md:flex-row items-stretch justify-between py-4">
                          <div className="flex flex-col items-center justify-center flex-1 md:pr-6">
                            <div className="p-2 bg-white rounded-xl mb-4 shadow-lg">
                              {regQrUrl && <img src={regQrUrl} alt="QR Code" className="w-44 h-44" />}
                            </div>
                            <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-1.5 text-center">Scan QR</h3>
                            <p className="text-white/40 text-xs text-center px-2 leading-relaxed">Scan to reveal your 6-digit number.</p>
                          </div>
                          <div className="relative flex flex-row md:flex-col items-center justify-center shrink-0 my-6 md:my-0">
                            <div className="w-full h-[1px] md:w-[1px] md:h-full bg-white/10"></div>
                          </div>
                          <div className="flex flex-col justify-center flex-1 md:pl-6">
                            <div className="mb-6">
                              <h2 className="text-3xl ml-20 font-bold text-white mb-2 text-center md:text-left">Enter Code</h2>
                            </div>
                            <div className="flex items-center justify-center gap-2 mb-6">
                              {Array.from({ length: 6 }).map((_, idx) => (
                                <input key={idx} ref={(el) => (regOtpRefs.current[idx] = el)} type="text" maxLength={1} value={regUserInputCode[idx] || ''} onChange={(e) => handleRegOtpChange(idx, e.target.value)} onKeyDown={(e) => handleRegOtpKeyDown(idx, e)} className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold font-mono bg-black border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/50 transition-all shadow-inner" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
                            <p className="text-white/40 text-xs uppercase tracking-widest leading-relaxed">Enter the 6-digit code sent to <span className="text-white">{regEmail}</span></p>
                          </div>
                          <div className="flex items-center justify-center gap-2 mb-6">
                            {Array.from({ length: 6 }).map((_, idx) => (
                              <input key={idx} ref={(el) => (regOtpRefs.current[idx] = el)} type="text" maxLength={1} value={regUserInputCode[idx] || ''} onChange={(e) => handleRegOtpChange(idx, e.target.value)} onKeyDown={(e) => handleRegOtpKeyDown(idx, e)} className="w-10 h-12 md:w-12 md:h-14 text-center text-xl font-bold font-mono bg-black border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/50 transition-all shadow-inner" />
                            ))}
                          </div>
                        </>
                      )}
                      <button type="submit" disabled={loading || regUserInputCode.length !== 6} className="w-full py-4 mt-2 bg-white/80 disabled:cursor-not-allowed cursor-pointer hover:bg-white text-black font-bold rounded-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin w-4 h-4 text-black" /> : 'Complete Registration'}
                      </button>
                    </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "pending_client_id";
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Suspense fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="animate-spin w-8 h-8 text-white/50" />
        </div>
      }>
        <AuthContent />
      </Suspense>
    </GoogleOAuthProvider>
  );
}
