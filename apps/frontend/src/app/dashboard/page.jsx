'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, LogOut, Code, Crown, AlertTriangle } from 'lucide-react';
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

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    setLoadingJoin(true);
    try {
      await api.post(`/rooms/${joinCode}/join`, { role: joinRole });
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
            {recentRooms.map((room) => (
              <div key={room.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push(`/room/${room.id}`)}>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-white">{room.name || 'Untitled'}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">
                    ENDED
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded border border-border inline-block">
                  {room.id}
                </div>
                <div className="mt-4 flex items-center text-muted-foreground text-sm gap-2">
                  <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center">?</span>
                  {room.maxMembers || 5} MAX
                </div>
              </div>
            ))}
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
