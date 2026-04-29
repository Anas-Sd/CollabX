'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, LogOut, Code, Crown, AlertTriangle, Trash2, Users } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import CreateRoomModal from '../../components/room/CreateRoomModal';
import api from '../../lib/api';
import { useNotificationStore } from '../../store/notificationStore';

function DashboardContent() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinRole, setJoinRole] = useState('VIEWER');
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [recentRooms, setRecentRooms] = useState([]);

  const router = useRouter();
  const { user, logout, restoreSession, isAuthenticated } = useUserStore();
  const searchParams = useSearchParams();

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
    if (!joinCode) return;
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

  return (
    <div className="min-h-screen bg-background">
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
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-sm font-medium text-white">{user.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border uppercase">
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
      <main className="max-w-6xl mx-auto p-8 pt-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">Overview</h1>
          <p className="text-muted-foreground text-lg">Manage your collaborative workspaces and active sessions globally.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Create Workspace Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
            <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary mb-6">
              <Plus size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Launch Workspace</h2>
            <p className="text-sm text-muted-foreground mb-8 flex-grow">Instantly launch a robust real-time shared IDE container.</p>
            <button
              onClick={() => {
                router.refresh();
                setIsCreateModalOpen(true);
              }}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Initialize Session &rarr;
            </button>
          </div>

          {/* Join Session Card */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-2">Connect to Session</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your secure 8-character access key.</p>

            <form onSubmit={handleJoin} className="flex-grow flex flex-col">
              <input
                type="text"
                value={joinCode}
                onClick={() => router.refresh()}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="A1B2C3D4"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary mb-4 font-mono text-center tracking-widest uppercase"
                maxLength={8}
                required
              />

              <div className="flex bg-background border border-border rounded-xl p-1 mb-4">
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
              </div>

              <button
                type="submit"
                disabled={!joinCode || loadingJoin}
                className="mt-auto w-full py-3 bg-background border border-border text-white rounded-xl font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {loadingJoin ? 'Connecting...' : 'Access Room'}
              </button>
            </form>
          </div>

          {/* Subscription Card */}
          <div className="bg-card border border-[#F5A623]/30 rounded-2xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-background border border-[#F5A623]/50 flex items-center justify-center text-[#F5A623]">
                  <Crown size={24} />
                </div>
                <span className="px-3 py-1 rounded-full bg-background border border-border text-xs font-bold text-muted-foreground uppercase">
                  Free
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Subscription</h2>
              <p className="text-sm text-muted-foreground mb-8 flex-grow">Your collaborative engine is restricted. Elevate to unlock real-time elasticity and session retention.</p>
              <button className="w-full py-3 bg-gradient-to-r from-[#F5A623] to-[#FFC107] text-black rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[#F5A623]/20">
                UPGRADE TO PRO
              </button>
            </div>
          </div>
        </div>

        {/* Historical Sessions */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-primary">∿</span> Historical Sessions
          </h3>
          <span className="px-3 py-1 rounded-full bg-card border border-border text-xs font-bold text-muted-foreground">
            {recentRooms.length} RECORDS
          </span>
        </div>

        {recentRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentRooms.map((room) => {
              const myMember = room.members?.find(m => m.id === user.id);
              const status = myMember?.status || 'UNKNOWN';

              let badgeText = 'UNKNOWN';
              let badgeClasses = 'bg-background border-border text-muted-foreground';

              if (!room.isActive) {
                badgeText = 'ENDED';
              } else if (status === 'KICKED') {
                badgeText = 'KICKED';
              } else if (status === 'REJECTED') {
                badgeText = 'REJECTED';
              } else if (status === 'LEFT') {
                badgeText = 'LEFT';
              } else if (status === 'PENDING') {
                badgeText = 'WAITING';
              } else {
                badgeText = 'LIVE';
              }

              // The user explicitly requested the color to be strictly based on room.isActive
              if (room.isActive) {
                badgeClasses = 'bg-success/10 text-success border-success/20 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
              } else {
                badgeClasses = 'bg-danger/10 text-danger border-danger/20 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
              }

              return (
                <div key={room.id} className={`group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-[#111118]/80 p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:bg-[#151520] hover:shadow-2xl hover:shadow-primary/10 overflow-hidden ${room.isActive ? 'cursor-pointer' : ''}`} onClick={() => room.isActive && router.push(`/room/${room.id}`)}>
                  {/* Abstract Background Elements */}
                  <div className="pointer-events-none absolute -inset-px rounded-2xl border border-white/5 opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-overlay"></div>
                  <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/20 blur-[80px] opacity-0 transition-opacity duration-700 group-hover:opacity-60"></div>
                  <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-[80px] opacity-0 transition-opacity duration-700 group-hover:opacity-40"></div>

                  {/* Header Section */}
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3.5">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 shadow-inner backdrop-blur-md transition-colors duration-300 group-hover:border-primary/30 group-hover:bg-primary/10`}>
                          <Code className={`h-5 w-5 ${room.isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary/70'}`} />
                        </div>
                        <div className="flex flex-col mt-0.5">
                          <h4 className={`text-[15px] font-bold tracking-tight text-white/90 group-hover:text-white transition-colors leading-tight ${room.isActive ? 'max-w-[120px] truncate' : 'break-words pr-2 max-w-[150px]'}`}>
                            {room.name || 'Untitled Workspace'}
                          </h4>
                          <span className="mt-1 text-[10px] font-medium text-muted-foreground/70 font-mono tracking-widest uppercase">
                            ID: {room.id}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase backdrop-blur-md transition-all duration-300 ${badgeClasses}`}>
                          {room.isActive ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                          )}
                          {badgeText}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="relative z-10 mt-8 flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-1.5 border border-white/5 backdrop-blur-md shadow-inner transition-colors group-hover:bg-black/50">
                        <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
                        <span className="tracking-widest font-mono text-[10px]">{room.members?.length || 1} / {room.maxMembers || 5}</span>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteHistoryClick(e, room.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground/50 transition-all duration-300 hover:border-danger/30 hover:bg-danger/10 hover:text-danger cursor-pointer shadow-sm group-hover:text-muted-foreground"
                        title="Delete from history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {!room.isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/room/${room.id}`); }}
                        className="mt-1 w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-white/80 transition-all duration-300 hover:border-primary/50 hover:bg-primary/20 hover:text-primary hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] cursor-pointer backdrop-blur-md group-hover:border-white/10 group-hover:text-white"
                      >
                        Enter History
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            No historical sessions found.
          </div>
        )}
      </main>

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Alert Modal */}
      {alertModalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
              className="w-full py-2.5 bg-background border border-border text-white rounded-xl text-sm font-bold hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
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
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
