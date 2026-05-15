'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  User, Mail, Camera, Activity, Code2, CheckCircle2, 
  Zap, Clock, PlayCircle, Users, LayoutDashboard,
  Server, ArrowLeft, Trash2, Globe, Settings, Cpu, Terminal,
  Edit2, Check, X, Eye, EyeOff
} from 'lucide-react';
import api from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useNotificationStore } from '../../store/notificationStore';
import { AnimatePresence } from 'framer-motion';
import { Suspense } from 'react';
import FeedbackButton from '../../components/ui/FeedbackButton';

function CountUp({ to, duration = 2, decimals = 0 }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime;
    let animationFrame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percent = Math.min(progress / (duration * 1000), 1);
      const easePercent = percent === 1 ? 1 : 1 - Math.pow(2, -10 * percent);
      setCount(easePercent * to);
      if (percent < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(to);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [to, duration]);
  
  return <span>{decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}</span>;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get('returnUrl') || '/dashboard';
  const returnText = returnUrl.includes('/room/') ? 'Back to Room' : 'Dashboard';
  const { user, setUser, restoreSession } = useUserStore();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  const fileInputRef = useRef(null);

  const isPro = user?.subscriptionType === 'PRO';
  const themeText = isPro ? 'text-[#F5A524]' : 'text-primary';
  const themeBlurHero = isPro ? 'bg-[#F5A524]/20' : 'bg-primary/20';
  const themeBlurAvatar = isPro ? 'bg-[#F5A524]/20 group-hover:bg-[#F5A524]/30' : 'bg-primary/20 group-hover:bg-primary/30';
  const themeSelection = isPro ? 'selection:bg-[#F5A524]/30' : 'selection:bg-primary/30';
  const themeBorderFocus = isPro ? 'focus:border-[#F5A524]' : 'focus:border-primary';
  const themeBorderFocusBorder = isPro ? 'border-[#F5A524]/50' : 'border-primary/50';
  const themeBgButton = isPro ? 'bg-[#F5A524] hover:bg-[#F5A524]/80 text-black' : 'bg-primary hover:bg-primary/80 text-black';
  const themeIconPrimary = isPro ? 'text-[#F5A524]' : 'text-primary';
  const themeDropShadowRing = isPro ? 'drop-shadow-[0_0_15px_rgba(245,165,36,0.3)]' : 'drop-shadow-[0_0_15px_rgba(0,212,170,0.3)]';
  const themeGradientBgFrom = isPro ? 'from-[#F5A524]/5' : 'from-primary/5';
  const themeGradientRingFrom = isPro ? '#F5A524' : '#00D4AA';
  const themeGradientRingTo = isPro ? '#FFC107' : '#3B82F6';
  const themeLanguageBar = isPro ? 'bg-gradient-to-r from-[#F5A524]/50 to-[#F5A524]' : 'bg-gradient-to-r from-primary/50 to-primary';

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!user) return;
    fetchProfileData();
  }, [user]);

  const fetchProfileData = async () => {
    try {
      const res = await api.get('/profile');
      setProfileData(res.data);
      setEditedName(res.data.name);
    } catch (error) {
      console.error('Failed to load profile', error);
      useNotificationStore.getState().addNotification('Failed to load profile data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      useNotificationStore.getState().addNotification('Image must be under 2MB', 'warning');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        const res = await api.put('/profile', { profilePicture: base64String });
        setProfileData(res.data);
        setUser({ ...user, profilePicture: res.data.profilePicture });
        useNotificationStore.getState().addNotification('Profile picture updated!', 'success');
      } catch (error) {
        console.error('Failed to update picture', error);
        useNotificationStore.getState().addNotification('Failed to update profile picture', 'error');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = async (e) => {
    e.stopPropagation();
    try {
      const res = await api.put('/profile', { profilePicture: '' });
      setProfileData(res.data);
      setUser({ ...user, profilePicture: null });
      useNotificationStore.getState().addNotification('Profile picture removed', 'success');
    } catch (error) {
      console.error('Failed to remove picture', error);
      useNotificationStore.getState().addNotification('Failed to remove profile picture', 'error');
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === profileData.name) {
      setIsEditingName(false);
      setEditedName(profileData.name);
      return;
    }
    setSavingName(true);
    try {
      const res = await api.put('/profile', { name: editedName });
      setProfileData(res.data);
      setUser({ ...user, name: res.data.name });
      setIsEditingName(false);
      useNotificationStore.getState().addNotification('Profile name updated!', 'success');
    } catch (error) {
      console.error('Failed to update name', error);
      useNotificationStore.getState().addNotification('Failed to update name', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword && !newPassword && !confirmPassword) {
      useNotificationStore.getState().addNotification('Please enter all required password fields', 'warning');
      return;
    }
    if (!currentPassword) {
      useNotificationStore.getState().addNotification('Please enter your current password', 'warning');
      return;
    }
    if (!newPassword) {
      useNotificationStore.getState().addNotification('Please enter a new password', 'warning');
      return;
    }
    if (!confirmPassword) {
      useNotificationStore.getState().addNotification('Please confirm your new password', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      useNotificationStore.getState().addNotification('New password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      useNotificationStore.getState().addNotification('New passwords do not match', 'warning');
      return;
    }
    try {
      await api.post('/profile/password', { currentPassword, newPassword });
      useNotificationStore.getState().addNotification('Password changed successfully', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword({ current: false, new: false, confirm: false });
    } catch (error) {
      useNotificationStore.getState().addNotification(error.response?.data || 'Failed to change password', 'error');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await api.post('/payments/cancel');
      setUser({ ...user, subscriptionType: 'FREE' });
      useNotificationStore.getState().addNotification('Subscription cancelled', 'success');
      setShowCancelModal(false);
    } catch (error) {
      useNotificationStore.getState().addNotification('Failed to cancel subscription', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      useNotificationStore.getState().addNotification("Please type DELETE to confirm", "warning");
      return;
    }
    
    setIsDeleting(true);
    try {
      await api.delete('/profile');
      localStorage.removeItem('token');
      setUser(null);
      router.push('/');
    } catch (error) {
      setIsDeleting(false);
      useNotificationStore.getState().addNotification('Failed to delete account', 'error');
    }
  };

  if (loading || isDeleting) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center flex-col">
        <div className="flex justify-center relative">
          <style>{`
            @keyframes drawX {
              0% { stroke-dashoffset: 100; opacity: 0; }
              10% { opacity: 1; }
              40% { stroke-dashoffset: 0; filter: drop-shadow(0 0 10px rgba(245,165,36,0.8)); }
              60% { stroke-dashoffset: 0; filter: drop-shadow(0 0 10px rgba(245,165,36,0.8)); }
              90% { opacity: 1; }
              100% { stroke-dashoffset: -100; opacity: 0; }
            }
          `}</style>
          
          <div className="absolute w-32 h-32 bg-[#F5A524]/10 blur-[40px] rounded-full animate-pulse top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(245,165,36,0.3)]">
              <defs>
                <linearGradient id="xGradientProfile" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5A524" />
                  <stop offset="50%" stopColor="#FFC107" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              
              <path 
                d="M 25 25 L 75 75" 
                fill="none" 
                stroke="url(#xGradientProfile)" 
                strokeWidth="10" 
                strokeLinecap="round" 
                style={{ strokeDasharray: 100, animation: 'drawX 2.5s ease-in-out infinite' }}
              />
              <path 
                d="M 75 25 L 25 75" 
                fill="none" 
                stroke="url(#xGradientProfile)" 
                strokeWidth="10" 
                strokeLinecap="round" 
                style={{ strokeDasharray: 100, animation: 'drawX 2.5s ease-in-out infinite 0.4s' }}
              />
            </svg>
          </div>
        </div>
        {isDeleting && <p className="text-[#F5A524] mt-6 font-bold tracking-widest uppercase text-sm animate-pulse">Deleting Account...</p>}
      </div>
    );
  }

  if (!profileData) return null;

  // Calculate language percentages
  const totalLangUsages = Object.values(profileData.languageUsage).reduce((a, b) => a + b, 0);
  
  // Always show default languages as 0 if they don't exist
  const DEFAULT_LANGUAGES = ['java', 'python', 'cpp', 'c', 'javascript', 'sql'];
  const baseLanguageMap = DEFAULT_LANGUAGES.reduce((acc, lang) => {
    acc[lang] = 0;
    return acc;
  }, {});
  
  const mergedLanguageUsage = { ...baseLanguageMap, ...profileData.languageUsage };

  const languageStats = Object.entries(mergedLanguageUsage)
    .map(([lang, count]) => ({
      name: lang,
      count,
      percentage: totalLangUsages > 0 ? ((count / totalLangUsages) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.count - a.count);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const cardHover = {
    rest: { scale: 1 },
    hover: { scale: 1.02, y: -4, transition: { type: "spring", stiffness: 400, damping: 25 } }
  };

  return (
    <div className={`min-h-screen bg-black text-white font-sans ${themeSelection} pb-24`}>
      
      {/* ======================= HERO BANNER ======================= */}
      <div className="h-[35vh] lg:h-[40vh] w-full relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-black z-0" />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute top-[-20%] right-[-10%] w-[50%] h-[150%] blur-[120px] rounded-full z-0 pointer-events-none ${themeBlurHero}`}
        />
        
        {/* Blueprint Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px] z-0" />
        
        {/* Fade to Black at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />

        {/* Return Button */}
        <Link 
          href={returnUrl}
          className="absolute top-8 left-8 flex items-center gap-3 text-white/50 hover:text-white transition-colors group z-50 cursor-pointer bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-widest text-[10px] uppercase">{returnText}</span>
        </Link>
      </div>

      {/* ======================= MAIN CONTENT ZONE ======================= */}
      <div className="max-w-[1400px] mx-auto px-6 relative z-20 -mt-24 lg:-mt-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ================= LEFT COLUMN (Identity & Ops) ================= */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Identity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="bg-[#0A0A0F]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,1)] relative overflow-hidden group"
            >
              {/* Subtle hover glow */}
              <div className={`absolute -top-20 -left-20 w-48 h-48 blur-[60px] rounded-full group-hover:scale-150 transition-all duration-700 pointer-events-none ${themeBlurAvatar}`} />
              
              <div className="relative z-10">
                {/* Avatar */}
                <div className="relative cursor-pointer group/container shrink-0 mb-8 w-fit" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-2xl border-2 border-white/10 overflow-hidden bg-[#12121A] relative z-10 shadow-2xl transition-transform duration-500 group-hover/container:scale-105">
                    {profileData.profilePicture ? (
                      <>
                        <img src={profileData.profilePicture} alt="Profile" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                        <div className="tooltip absolute inset-0 w-full h-full">
                          <div 
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/container:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-2xl"
                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(e); }}
                          >
                            <Trash2 size={28} className="text-danger hover:text-danger/80 transition-colors cursor-pointer" />
                          </div>
                          <div className="tooltip-content z-50 mb-2">
                            <div className="tooltip-box">Remove Profile Picture</div>
                            <div className="tooltip-arrow"></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <User size={48} className="text-white/20" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/container:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-2xl">
                          <Camera size={24} className="text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  {!profileData.profilePicture && (
                    <div className={`absolute -bottom-3 -right-3 z-20 w-10 h-10 rounded-xl border-4 border-[#0A0A0F] flex items-center justify-center shadow-lg group-hover/container:scale-110 transition-transform cursor-pointer ${themeBgButton}`}>
                      <Camera size={16} />
                    </div>
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-3xl">
                      <div className={`w-8 h-8 border-3 border-t-transparent rounded-full animate-spin ${themeBorderFocusBorder.replace('border-', 'border-').replace('/50', '')}`}></div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>

                <div className="flex mb-2 h-12">
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editedName} 
                        onChange={(e) => setEditedName(e.target.value)} 
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setIsEditingName(false); setEditedName(profileData.name); } }}
                        className={`bg-[#1A1A24] border ${themeBorderFocusBorder} text-white text-2xl md:text-3xl font-black tracking-tight rounded-xl px-4 py-1 w-48 md:w-64 text-center focus:outline-none ${themeBorderFocus} transition-colors`}
                      />
                      <button onClick={handleSaveName} disabled={savingName} className={`p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${themeBgButton}`}>
                        {savingName ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Check size={20} />}
                      </button>
                      <button onClick={() => {setIsEditingName(false); setEditedName(profileData.name);}} className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors cursor-pointer">
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 group/edit">
                      <h1 className="text-3xl md:text-4xl uppercase font-black tracking-tight text-white">{profileData.name}</h1>
                      <button onClick={() => setIsEditingName(true)} className="text-white/0 group-hover/edit:text-white/50 hover:!text-white transition-colors cursor-pointer">
                        <Edit2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-white/40">
                    <Mail size={16} />
                    <span className="font-bold text-sm tracking-wide">{profileData.email}</span>
                  </div>
                  {user?.subscriptionType === 'PRO' ? (
                    <div className="w-fit px-3 py-1.5 bg-[#F5A524]/10 border border-[#F5A524]/30 text-[#F5A524] rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,165,36,0.1)]">
                      <Zap size={12} /> CollabX PRO
                    </div>
                  ) : (
                    <div className="w-fit px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_20px_rgba(108,99,255,0.1)]">
                      <Zap size={12} /> CollabX Free
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Network Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-[#0A0A0F]/90 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl relative"
            >
              <h2 className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-6 flex items-center gap-2">
                <Globe size={14} className="text-purple-500"/> Network Reach
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-[#12121A] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Rooms Created / Hosted</span>
                  <span className="text-xl font-black text-white"><CountUp to={profileData.roomsCreated} /></span>
                </div>
                <div className="flex justify-between items-center bg-[#12121A] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Rooms Joined</span>
                  <span className="text-xl font-black text-white"><CountUp to={profileData.roomsJoined} /></span>
                </div>
                {/* <div className="flex justify-between items-center bg-[#12121A] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-[11px] font-bold tracking-widest text-white/50 uppercase">Sessions Hosted</span>
                  <span className="text-xl font-black text-white"><CountUp to={profileData.sessionsHosted} /></span>
                </div> */}
              </div>
            </motion.div>

            {/* Settings Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#0A0A0F]/90 backdrop-blur-xl rounded-[2rem] p-6 border border-white/5 shadow-2xl"
            >
              <h2 className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-6 flex items-center gap-2">
                <Settings size={14} className="text-gray-400"/> System Operations
              </h2>
              <div className="flex flex-col gap-2">
                <FeedbackButton 
                  context="Profile Page" 
                  showLabel={true}
                  className="w-full !justify-start px-5 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[11px] font-bold tracking-widest uppercase transition-colors" 
                />
                <button onClick={() => setShowPasswordModal(true)} className="w-full text-left px-5 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[11px] font-bold tracking-widest uppercase transition-colors cursor-pointer">
                  Change Password
                </button>
                {user?.subscriptionType === 'PRO' && (
                  <button onClick={() => setShowCancelModal(true)} className="w-full text-left px-5 py-4 bg-white/5 hover:bg-white/10 rounded-xl text-white text-[11px] font-bold tracking-widest uppercase transition-colors cursor-pointer">
                    Cancel Subscription
                  </button>
                )}
                <button onClick={() => setShowDeleteModal(true)} className="w-full text-left px-5 py-4 bg-danger/10 hover:bg-danger/20 rounded-xl text-danger text-[11px] font-bold tracking-widest uppercase transition-colors cursor-pointer">
                  Delete Account
                </button>
              </div>
            </motion.div>

          </div>

          {/* ================= RIGHT COLUMN (Data & Stats) ================= */}
          <div className="lg:col-span-8 space-y-8 mt-12 lg:mt-0">
            
            {/* Top Row: SVG Ring & Engine Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Success Rate Ring (Col Span 5) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
                className="md:col-span-5 bg-[#0A0A0F]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden min-h-[320px]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${themeGradientBgFrom} to-transparent z-0`} />
                <h2 className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase absolute top-8 left-8 flex items-center gap-2">
                  <Activity size={14} className={`${themeIconPrimary}`}/> Global Ranking
                </h2>
                
                <div className="relative w-48 h-48 mt-8 z-10">
                  <svg viewBox="0 0 100 100" className={`w-full h-full -rotate-90 ${themeDropShadowRing}`}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A24" strokeWidth="4" />
                    <motion.circle 
                      cx="50" cy="50" r="42" fill="none" stroke="url(#ring-grad)" strokeWidth="6" strokeLinecap="round" 
                      initial={{ strokeDasharray: "0 264" }} 
                      animate={{ strokeDasharray: `${(profileData.successRate/100) * 264} 264` }} 
                      transition={{ duration: 2.5, ease: "easeOut", delay: 0.5 }} 
                    />
                    <defs>
                      <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={themeGradientRingFrom} />
                        <stop offset="100%" stopColor={themeGradientRingTo} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
                      <CountUp to={profileData.successRate} decimals={1}/>%
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Execution Engine (Col Span 7) */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                className="md:col-span-7 bg-[#0A0A0F]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
              >
                {/* Internal Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] z-0" />
                
                <h2 className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-8 relative z-10 flex items-center gap-2">
                  <Cpu size={14} className="text-blue-500"/> Execution Engine
                </h2>
                
                <div className="grid grid-cols-2 gap-4 relative z-10 h-[calc(100%-4rem)]">
                  <div className="bg-[#12121A]/80 backdrop-blur-sm p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group flex flex-col justify-between">
                    <PlayCircle className="text-blue-500 mb-2 group-hover:scale-110 transition-transform origin-left" size={24}/>
                    <div>
                      <div className="text-3xl font-black text-white"><CountUp to={profileData.totalRuns} /></div>
                      <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Submissions</div>
                    </div>
                  </div>
                  <div className="bg-[#12121A]/80 backdrop-blur-sm p-5 rounded-2xl border border-white/5 hover:border-green-500/30 transition-colors group flex flex-col justify-between">
                    <CheckCircle2 className="text-green-500 mb-2 group-hover:scale-110 transition-transform origin-left" size={24}/>
                    <div>
                      <div className="text-3xl font-black text-white"><CountUp to={profileData.passedTestCases} /></div>
                      <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Tests Passed</div>
                    </div>
                  </div>
                  <div className="bg-[#12121A]/80 backdrop-blur-sm p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors group flex flex-col justify-between">
                    <Activity className="text-purple-500 mb-2 group-hover:scale-110 transition-transform origin-left" size={24}/>
                    <div>
                      <div className="text-3xl font-black text-white"><CountUp to={profileData.successRate} decimals={1}/><span className="text-sm text-white/30 font-bold ml-1">%</span></div>
                      <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Success Rate</div>
                    </div>
                  </div>
                  <div className="bg-[#12121A]/80 backdrop-blur-sm p-5 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors group flex flex-col justify-between">
                    <Zap className="text-cyan-500 mb-2 group-hover:scale-110 transition-transform origin-left" size={24}/>
                    <div>
                      <div className="text-3xl font-black text-white"><CountUp to={profileData.fastestRun} /><span className="text-sm text-white/30 font-bold ml-1">ms</span></div>
                      <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Fastest Run</div>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* Bottom Row: Language Matrix */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-[#0A0A0F]/90 backdrop-blur-3xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
              <h2 className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase mb-8 flex items-center gap-2 relative z-10">
                <Terminal size={14} className={`${isPro ? 'text-[#F5A524]' : 'text-primary'}`}/> Language Matrix
              </h2>
              
              {languageStats.length === 0 ? (
                <div className="text-white/40 font-medium text-sm relative z-10">No execution data available.</div>
              ) : (
                <div className="space-y-6 relative z-10">
                  {languageStats.map((lang, idx) => (
                    <div key={lang.name} className="group/lang">
                      <div className="flex justify-between items-end mb-3">
                        <span className="font-bold text-white capitalize tracking-wide text-lg">{lang.name}</span>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-white/30 mr-3 tracking-[0.2em] uppercase">{lang.count} RUNS</span>
                          <span className={`font-black ${isPro ? 'text-white' : 'text-primary'} text-lg`}>{lang.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#1A1A24] h-3 rounded-full overflow-hidden relative border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${lang.percentage}%` }} transition={{ duration: 1.5, delay: 0.1 * idx + 0.5, ease: "easeOut" }}
                          className={`${themeLanguageBar} h-full rounded-full relative`}
                        >
                          {/* Inner glowing dot that moves with the bar */}
                          <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/40 blur-[2px] rounded-full" />
                        </motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#12121A] border border-border rounded-2xl shadow-2xl p-6"
            >
              <h2 className="text-xl font-bold mb-4">Change Password</h2>
              <form onSubmit={handleChangePassword} noValidate className="space-y-4">
                <div className="relative">
                  <label className="block text-sm text-muted-foreground mb-1">Current Password</label>
                  <input type={showPassword.current ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#1A1A24] border border-border rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })} className="absolute right-3 top-8 text-muted-foreground hover:text-white transition-colors cursor-pointer">
                    {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm text-muted-foreground mb-1">New Password</label>
                  <input type={showPassword.new ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                    className="w-full bg-[#1A1A24] border border-border rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })} className="absolute right-3 top-8 text-muted-foreground hover:text-white transition-colors cursor-pointer">
                    {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <label className="block text-sm text-muted-foreground mb-1">Confirm New Password</label>
                  <input type={showPassword.confirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    className="w-full bg-[#1A1A24] border border-border rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} className="absolute right-3 top-8 text-muted-foreground hover:text-white transition-colors cursor-pointer">
                    {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 rounded-lg font-bold text-muted-foreground hover:text-white transition-colors cursor-pointer">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg font-bold bg-primary text-black hover:bg-primary/90 transition-colors cursor-pointer hover:text-white">Save Password</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDeleteModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#12121A] border border-border rounded-2xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black text-danger mb-4">Delete Account?</h2>
              <p className="text-muted-foreground mb-6 font-medium">
                This action is <span className="font-bold text-white">permanent</span> and cannot be undone. All your workspaces, files, and profile data will be erased instantly.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-white mb-2">Type "DELETE" to confirm</label>
                <input 
                  type="text" 
                  value={deleteConfirmationText} 
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-[#1A1A24] border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-danger transition-colors font-mono" 
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => { setShowDeleteModal(false); setDeleteConfirmationText(''); }} className="px-5 py-2 rounded-xl font-bold text-muted-foreground hover:text-white transition-colors cursor-pointer">Cancel</button>
                <button 
                  type="button" 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmationText !== 'DELETE'}
                  className="px-5 py-2 rounded-xl font-bold bg-danger text-white hover:bg-danger/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowCancelModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#12121A] border border-border rounded-2xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black text-white mb-4">Cancel PRO Subscription?</h2>
              <p className="text-muted-foreground mb-6 font-medium">
                Are you sure you want to cancel? You will be downgraded to the FREE tier immediately and lose access to unlimited executions and advanced features.
              </p>
              
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setShowCancelModal(false)} className="px-5 py-2 rounded-xl font-bold text-muted-foreground hover:text-white transition-colors cursor-pointer">Nevermind</button>
                <button 
                  type="button" 
                  onClick={handleCancelSubscription}
                  className="px-5 py-2 rounded-xl font-bold bg-white text-black hover:bg-white/80 transition-colors cursor-pointer"
                >
                  Yes, Cancel Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}

