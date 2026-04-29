'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, LogOut, Code, Crown, AlertTriangle, Trash2, ArrowRight, Sparkles, Clock, Calendar, Users, LucideActivity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useUserStore } from '../../store/userStore';
import CreateRoomModal from '../../components/room/CreateRoomModal';
import api from '../../lib/api';
import { useNotificationStore } from '../../store/notificationStore';
import ProUpgradeModal from '../../components/subscription/ProUpgradeModal';

function DashboardContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinRole, setJoinRole] = useState('VIEWER');
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  const router = useRouter();
  const { user, logout, restoreSession, isAuthenticated } = useUserStore();
  const searchParams = useSearchParams();
  const isPro = user?.subscriptionType === 'PRO';
  let daysRemaining = null;
  if (isPro && user?.subscriptionExpiresAt) {
    const diffTime = new Date(user.subscriptionExpiresAt) - new Date();
    daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const [isMounted, setIsMounted] = useState(false);
  const [alertModalConfig, setAlertModalConfig] = useState({ isOpen: false, title: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, roomId: null });

  useEffect(() => {
    setIsMounted(true);
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isMounted) {
      const savedAlert = localStorage.getItem('dashboardAlert');
      if (savedAlert) {
        setAlertModalConfig({ ...JSON.parse(savedAlert), isOpen: true });
      } else {
        const alertParam = searchParams.get('alert');
        if (alertParam === 'kicked') {
          setAlertModalConfig({
            isOpen: true,
            title: 'You were kicked',
            message: 'The host has removed you from the workspace.'
          });
          router.replace('/dashboard');
        } else if (alertParam === 'rejected') {
          setAlertModalConfig({
            isOpen: true,
            title: 'Join Request Rejected',
            message: 'Your request to join the workspace was rejected by the host.'
          });
          router.replace('/dashboard');
        }
      }
    }
  }, [isMounted, searchParams, router]);

  useEffect(() => {
    if (isMounted && !isAuthenticated) {
      router.push('/login');
    } else if (isMounted && isAuthenticated) {
      fetchRecentRooms();
    }
  }, [isAuthenticated, isMounted, router]);

  const fetchRecentRooms = async () => {
    try {
      const res = await api.get('/rooms/my');
      setRecentRooms(res.data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  const handleDeleteHistoryClick = (e, roomId) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, roomId });
  };

  const executeDeleteHistory = async () => {
    if (!deleteConfirm.roomId) return;
    try {
      await api.delete(`/rooms/${deleteConfirm.roomId}/history`);
      fetchRecentRooms();
      useNotificationStore.getState().addNotification('Session removed from history', 'success');
    } catch (err) {
      console.error('Failed to delete history', err);
      useNotificationStore.getState().addNotification('Failed to remove session', 'error');
    } finally {
      setDeleteConfirm({ isOpen: false, roomId: null });
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode) {
      useNotificationStore.getState().addNotification('Enter a Room Code to Join.', 'warning');
      return;
    }
    setLoadingJoin(true);
    try {
      const res = await api.post(`/rooms/${joinCode}/join`, { role: joinRole });
      if (res.data && res.data.isActive === false) {
        useNotificationStore.getState().addNotification('This room has ended. You are viewing the history.', 'warning');
      }
      router.push(`/room/${joinCode}`);
    } catch (err) {
      if (!err.response || err.response.status >= 500) {
        console.error('Failed to join room', err);
      }
      let errorMsg = "An error occurred while joining the room.";
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || err.response.data.error || "Cannot join room. It might be full.");
      }
      useNotificationStore.getState().addNotification(errorMsg, 'error');
    } finally {
      setLoadingJoin(false);
    }
  };

  // Prevent rendering mismatch during hydration by returning null until mounted, matching the server.
  if (!isMounted || !user) return null;

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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-background"
    >
      {/* Top Bar */}
      <header className="h-16 border-b border-border px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <Code size={18} />
          </div>
          CollabX
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-card border border-border rounded-full py-1.5 px-3">
            <div className={`w-2 h-2 rounded-full ${isPro ? 'bg-[#F5A524] shadow-[0_0_10px_rgba(245,165,36,0.8)]' : 'bg-success'}`}></div>
            <span className={`text-sm font-medium ${isPro ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#F5A524] to-[#FFC107] drop-shadow-[0_0_5px_rgba(245,165,36,0.5)]' : 'text-white'}`}>{user.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full uppercase border ${isPro ? 'bg-[#F5A524]/10 text-[#F5A524] border-[#F5A524]/30' : 'bg-muted text-muted-foreground border-border'}`}>
              {user.subscriptionType || 'FREE'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-white transition-colors rounded-lg hover:bg-card border border-transparent hover:border-border"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10 flex flex-col gap-10 relative z-10">
        {/* Header Section */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">Overview</h2>
          <p className="text-[#8B8B9E] font-medium text-sm">Manage your collaborative workspaces and active sessions globally.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative" style={{ perspective: '1200px' }}>


          {/* Create Workspace */}
          <div className="group relative bg-[#0F0F16] rounded-3xl border border-white/5 p-1 overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-[0_20px_40px_rgba(108,99,255,0.15)] flex flex-col hover:!transform-none origin-right" style={{ transform: 'rotateY(10deg)', transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"></div>
            <div className="relative bg-[#0A0A0F] rounded-[22px] p-7 h-full flex flex-col z-10 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-[#151520] flex items-center justify-center mb-5 border border-white/10 text-primary group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300 shadow-inner">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Launch Workspace</h3>
              <p className="text-sm text-[#8B8B9E] mb-6 flex-1 font-medium leading-relaxed">Instantly launch a robust real-time shared IDE container.</p>
              <button
                onClick={() => {
                  router.refresh();
                  setIsCreateModalOpen(true);
                }}
                className="w-full cursor-pointer flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-primary to-[#5a52d5] text-white rounded-xl font-bold text-sm tracking-wide hover:opacity-100 opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(108,99,255,0.7)]"
              >
                Initialize Session <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Create Workspace
          <div className="group relative bg-[#0F0F16] rounded-3xl border border-white/5 p-1 overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-[0_20px_40px_rgba(108,99,255,0.15)] flex flex-col hover:!transform-none origin-right" style={{ transform: 'rotateY(10deg)', transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none"></div>
            <div className="relative bg-[#0A0A0F] rounded-[22px] p-7 h-full flex flex-col z-10 border border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-[#151520] flex items-center justify-center mb-5 border border-white/10 text-primary group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-300 shadow-inner">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Launch Workspace</h3>
              <p className="text-sm text-[#8B8B9E] mb-6 flex-1 font-medium leading-relaxed">Instantly launch a robust real-time shared IDE container.</p>
              <button
                onClick={() => setIsCreateModalOpen(!isCreateModalOpen)}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-primary to-[#5a52d5] text-white rounded-xl font-bold text-sm tracking-wide hover:opacity-100 opacity-90 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(108,99,255,0.7)]"
              >
                Initialize Session <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div> */}

          {/* Join Session Card */}
          <div className="group bg-[#0F0F16] rounded-3xl border border-white/5 p-7 shadow-xl hover:shadow-[0_20px_40px_rgba(108,99,255,0.1)] transition-all duration-500 hover:border-primary/30 relative overflow-hidden flex flex-col hover:!transform-none" style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] pointer-events-none rounded-full transition-opacity group-hover:opacity-100 opacity-0"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 blur-[50px] pointer-events-none rounded-full transition-opacity group-hover:opacity-100 opacity-0"></div>
            <h2 className="text-xl font-bold text-white mb-2">Connect to Session</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your secure 8-character access key.</p>

            <form onSubmit={handleJoin} className="space-y-4  flex-1 flex flex-col justify-end relative z-10">
              <input
                type="text"
                value={joinCode}
                onClick={() => router.refresh()}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="A 1 B 2 C 3 D 4"
                className="w-full px-4 py-3.5 bg-[#050508] border border-[#2A2A35] rounded-xl text-white placeholder-[#8B8B9E]/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary uppercase tracking-[0.2em] font-mono text-sm transition-all shadow-inner group-hover:border-[#3A3A45]"
                maxLength={8}
              />

              {/* <div className="flex bg-background border border-border rounded-xl p-1 mb-4">
                <button
                  type="button"
                  onClick={() => setJoinRole('VIEWER')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${joinRole === 'VIEWER' ? 'bg-card text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                >
                  VIEWER
                </button>
                <button
                  type="button"
                  onClick={() => setJoinRole('EDITOR')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${joinRole === 'EDITOR' ? 'bg-card text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                >
                  EDITOR
                </button>
              </div> */}

              <div className="flex bg-[#050508] gap-2 border border-[#2A2A35] group-hover:border-[#3A3A45] rounded-xl p-1 shadow-inner transition-colors">
                {['VIEWER', 'EDITOR'].map(role => (
                  <div
                    key={role}
                    onClick={() => setJoinRole(role)}
                    className={`flex-1 text-center py-2.5 rounded-lg scale-[1.02] text-[11px] font-extrabold cursor-pointer transition-all uppercase tracking-widest ${joinRole === role ? 'bg-primary/20 border border-primary/40 text-white shadow-[0_0_15px_rgba(108,99,255,0.3)] scale-[1.02]' : 'text-[#8B8B9E] hover:text-white hover:bg-white/5'}`}
                  >
                    {role}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={!joinCode || loadingJoin}
                className="w-full flex items-center cursor-pointer justify-center gap-2 py-3.5 px-4 text-white bg-white/5 border border-white/10 rounded-xl font-bold tracking-wide hover:bg-white/10 hover:border-white/30 focus:ring-2 focus:ring-white/20 transition-all  group/btn hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {loadingJoin ? 'Connecting...' : 'Access Room'}
              </button>
            </form>
          </div>


          {/* Subscription Card */}
          {isPro ? (
            <div className="bg-card border border-[#F5A524]/50 rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all duration-500 group origin-left hover:!transform-none" style={{ transform: 'rotateY(-10deg)', transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/20 via-[#F5A623]/5 to-transparent z-0"></div>
              
              <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                <Sparkles className="w-24 h-24 text-[#F5A524]" />
              </div>
              <Crown className="absolute -bottom-10 -right-5 w-48 h-48 text-[#F5A524] opacity-10 -rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-700" />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5A524]/10 border border-[#F5A524]/30 flex items-center justify-center mb-5 text-[#F5A524] shadow-[0_0_20px_rgba(245,165,36,0.2)]">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#F5A524]/20 border border-[#F5A524]/40 text-xs font-bold text-[#F5A524] uppercase shadow-[0_0_10px_rgba(245,165,36,0.3)]">
                    Active
                  </span>
                </div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#FFC107] mb-2 drop-shadow-sm">PRO Active</h2>
                <p className="text-sm text-white/80 mb-8 flex-grow">You have unlocked the ultimate collaborative coding experience. Enjoy zero limits and full historical retention.</p>
                <div className="mt-auto flex items-center justify-center gap-2 py-3.5 bg-white/5 border border-[#F5A524]/30 rounded-xl font-bold tracking-widest text-[11px] uppercase text-[#F5A524] shadow-[0_0_15px_rgba(245,165,36,0.15)]">
                  <Sparkles size={14} /> {daysRemaining !== null ? `${daysRemaining} Days Remaining` : 'Subscription Active'}
                </div>
              </div>
            </div>
          ) : (
            <div className={`bg-card border border-[#F5A524]/30 hover:border-[#F5A524] hover:shadow-[0_0_50px_rgba(245,165,36,0.15)] rounded-2xl p-6 flex flex-col relative overflow-hidden transition-all duration-500 group hover:!transform-none origin-left`} style={{ transform: 'rotateY(-10deg)', transformStyle: 'preserve-3d' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/10 to-transparent z-0"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <>
                    <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                      <Sparkles className="w-24 h-24 text-[#F5A524]" />
                    </div>
                    <Crown className="absolute -bottom-10 -right-5 w-48 h-48 text-[#F5A524] opacity-5 -rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-700" />
                  </>

                  <div className="w-12 h-12 rounded-2xl bg-[#151520] border border-white/10 flex items-center justify-center mb-5 text-[#F5A524] shadow-[0_0_20px_rgba(245,165,36,0.1)] group-hover:bg-[#F5A524]/10 transition-all z-10 relative">
                    <Crown className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-background border border-border text-xs font-bold text-muted-foreground uppercase">
                    Free
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Subscription</h2>
                <p className="text-sm text-muted-foreground mb-8 flex-grow">Your collaborative engine is restricted. Elevate to unlock real-time elasticity and session retention.</p>
                <button
                  onClick={() => setIsProModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 cursor-pointer py-3.5 bg-gradient-to-r from-[#F5A524] to-[#F5D547] text-[#0A0A0F] rounded-xl font-extrabold tracking-widest text-[11px] uppercase shadow-[0_0_15px_rgba(245,165,36,0.3)] hover:shadow-[0_0_25px_rgba(245,165,36,0.6)] transition-all z-10 relative">
                  UPGRADE TO PRO
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Historical Sessions */}
        <div className="flex items-center justify-between mt-20 mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-3xl flex gap-3"> <span className='text-primary mt-2'><LucideActivity /></span>  Historical Sessions</span>
          </h3>
          <span className="px-3 py-1 rounded-full bg-card border border-border text-xs font-bold text-muted-foreground">
            {recentRooms.length} RECORDS
          </span>
        </div>

        {recentRooms.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {recentRooms.map((room) => {
              const myMember = room.members?.find(m => m.id === user.id);
              const status = myMember?.status || 'UNKNOWN';

              let badgeText = 'UNKNOWN';
              let badgeClasses = 'bg-background border-border text-muted-foreground';

              if (!room.isActive) {
                badgeText = 'ENDED';
                badgeClasses = 'bg-danger/10 text-danger border-danger/20';
              } else if (status === 'KICKED') {
                badgeText = 'KICKED';
                badgeClasses = 'bg-danger/10 text-danger border-danger/20';
              } else if (status === 'REJECTED') {
                badgeText = 'REJECTED';
                badgeClasses = 'bg-danger/10 text-danger border-danger/20';
              } else if (status === 'LEFT') {
                badgeText = 'LEFT';
                badgeClasses = 'bg-muted border-border text-muted-foreground';
              } else if (status === 'PENDING') {
                badgeText = 'WAITING';
                badgeClasses = 'bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20';
              } else {
                badgeText = 'LIVE';
                badgeClasses = 'bg-success/10 text-success border-success/20';
              }

              return (
                <motion.div 
                  variants={itemVariants}
                  key={room.id} 
                  className={`group bg-gradient-to-b from-[#1C1C24] to-[#0A0A0F] border border-[#2A2A35] rounded-[24px] p-1.5 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_15px_40px_-10px_rgba(108,99,255,0.25)] relative overflow-hidden flex flex-col hover:-translate-y-2 ${room.isActive ? 'cursor-pointer' : ''}`} 
                  onClick={() => room.isActive && router.push(`/room/${room.id}`)}
                >
                  <div className="relative h-full w-full bg-[#0F0F16] rounded-[18px] p-6 flex flex-col overflow-hidden z-10">

                    {/* Ambient Glow */}
                    <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[70px] opacity-20 pointer-events-none transition-all duration-700 group-hover:opacity-40 group-hover:scale-150 ${room.isActive ? 'bg-success' : 'bg-primary'}`}></div>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex flex-col gap-1 w-[80%]">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest shadow-sm ${room.isActive
                              ? 'bg-success/10 border-success/30 text-success shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                              : 'bg-danger/10 border-danger/30 text-danger shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${room.isActive ? 'bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`} />
                            {room.isActive ? 'LIVE' : 'ENDED'}
                          </div>
                          {badgeText !== (room.isActive ? 'LIVE' : 'ENDED') && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border tracking-widest uppercase ${badgeClasses}`}>
                              {badgeText}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-white text-xl tracking-tight truncate drop-shadow-sm group-hover:text-primary/90 transition-colors">
                          {room.name || 'Untitled Workspace'}
                        </h4>
                        <div className="text-[11px] font-mono text-[#8B8B9E] bg-[#1A1A24] w-fit px-2.5 py-1 rounded-md border border-[#2A2A35] mt-2 shadow-inner">
                          {room.id}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteHistoryClick(e, room.id)}
                        className="text-[#8B8B9E] hover:text-danger hover:bg-danger/10 p-2 rounded-xl transition-all cursor-pointer z-20 border border-transparent hover:border-danger/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                        // title="Delete from history"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Middle Metadata */}
                    <div className="grid grid-cols-2 gap-4 mb-6 flex-1 relative z-10 bg-[#15151E] rounded-xl p-4 border border-[#2A2A35] shadow-inner">

                      {/* Left: Limit */}
                      <div className="flex flex-col justify-center">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#8B8B9E] mb-1.5 flex items-center gap-1.5">
                          <Users size={10} /> Participant Limit
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-white">{room.maxMembers || 5}</span>
                          <span className="text-[10px] text-[#8B8B9E] font-medium">MAX</span>
                        </div>
                      </div>

                      {/* Right: Timestamps */}
                      <div className="flex flex-col gap-2 justify-center border-l border-[#2A2A35] pl-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] uppercase tracking-widest text-[#8B8B9E] font-bold mb-0.5 flex items-center gap-1">
                            <Calendar size={8} /> Created
                          </span>
                          <span className="text-[11px] font-mono text-white/90">
                            {room.createdAt ? format(new Date(room.createdAt), 'MMM d, h:mm a') : 'N/A'}
                          </span>
                        </div>
                        {!room.isActive && (
                          <div className="flex flex-col">
                            <span className="text-[8px] uppercase tracking-widest text-[#8B8B9E] font-bold mb-0.5 flex items-center gap-1">
                              <Clock size={8} /> Ended
                            </span>
                            <span className="text-[11px] font-mono text-white/90">
                              {room.expiresAt ? format(new Date(room.expiresAt), 'MMM d, h:mm a') : 'N/A'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Action */}
                    {!room.isActive && (
                      <div className="mt-auto relative z-10">
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/room/${room.id}`); }}
                          className="w-full group/btn relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-[#5a52d5] p-[1px] transition-all hover:shadow-[0_0_20px_rgba(108,99,255,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                          <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-[#111118] px-4 py-3 transition-all duration-300 group-hover/btn:bg-transparent">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90 group-hover/btn:text-white">
                              Enter History
                            </span>
                            <ArrowRight size={14} className="text-white/50 group-hover/btn:text-white group-hover/btn:translate-x-1.5 transition-all duration-300" />
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            No historical sessions found.
          </div>
        )}
      </main>

        {/* Modals */}
        <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

        {/* Alert Modal */}
        {alertModalConfig.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6 relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{alertModalConfig.title}</h2>
              <p className="text-sm text-muted-foreground mb-6">{alertModalConfig.message}</p>
              <button
                onClick={() => {
                  setAlertModalConfig({ isOpen: false, title: '', message: '' });
                  localStorage.removeItem('dashboardAlert');
                }}
                className="w-full py-2.5 bg-background border border-border text-white rounded-xl text-sm font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card w-full max-w-sm rounded-2xl border border-danger/30 shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)] p-6 relative flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete Session?</h2>
              <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete this session from your history? The data in this will be permanently deleted.</p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, roomId: null })}
                  className="flex-1 py-2.5 bg-background border border-border text-white rounded-xl text-sm font-bold hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteHistory}
                  className="flex-1 py-2.5 bg-danger border border-danger text-white rounded-xl text-sm font-bold hover:bg-danger/80 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <ProUpgradeModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
      </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
