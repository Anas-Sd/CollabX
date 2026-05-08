'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Copy, Check, TerminalSquare, ChevronDown, Clock, Sparkles, Zap, User } from 'lucide-react';
import { useRoomStore } from '../../../store/roomStore';
import { useUserStore } from '../../../store/userStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useVoice } from '../../../hooks/useVoice';
import CodeEditor from '../../../components/editor/CodeEditor';
import OutputPanel from '../../../components/editor/OutputPanel';
import Sidebar from '../../../components/room/Sidebar';
import api from '../../../lib/api';
import { useNotificationStore } from '../../../store/notificationStore';
import ProUpgradeModal from '../../../components/subscription/ProUpgradeModal';
import Whiteboard from '../../../components/room/Whiteboard';

const DEFAULT_CODE_TEMPLATES = {
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  python: `print("Hello, World!")`,
  cpp: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
  javascript: `console.log("Hello, World!");`,
  sql: `-- Write your SQL query here
SELECT 'Hello, World!' AS message;`
};
export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, restoreSession } = useUserStore();
  const { roomName, expiresAt, isActive, setRoomInfo, language, setLanguage, testCases, participants, setParticipants, sessionEndedReason, roleChangeAlert, hostTransferAlert, isExecuting, showOutputPanel, setShowOutputPanel, selectedCode, isWhiteboardOpen } = useRoomStore();
  const [copied, setCopied] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('USERS');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [roomAlert, setRoomAlert] = useState(null);
  const langMenuRef = useRef(null);

  const preprocessSql = (sqlCode) => {
    if (!sqlCode) return "";
    // Add semicolons before lines starting with SQL keywords if missing
    let processed = sqlCode.replace(/([^;\s])(\s*)\n(\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|WITH|TRUNCATE|REPLACE)\b)/gi, '$1;$2\n$3');
    // Also ensure the very last statement has a semicolon
    if (processed.trim() && !processed.trim().endsWith(';')) {
      processed += ';';
    }
    return processed;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLangMenu]);

  const wsHook = useWebSocket(roomId);
  const voiceControls = useVoice(roomId, user, isActive);

  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const joinedRef = useRef(false);
  const hasWarnedRef = useRef(false);

  const [timeLeft, setTimeLeft] = useState(null);
  const [extending, setExtending] = useState(false);

  const isPro = user?.subscriptionType === 'PRO';

  useEffect(() => {
    setIsMounted(true);
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (isMounted) {
      const savedAlert = localStorage.getItem('roomAlert');
      if (savedAlert) {
        setRoomAlert(JSON.parse(savedAlert));
      }
    }
  }, [isMounted]);

  useEffect(() => {
    // Reset room state so old data from a previous session doesn't persist
    useRoomStore.getState().resetRoom();

    if (isMounted && !isAuthenticated) {
      router.push('/');
      return;
    }

    if (!isMounted || !isAuthenticated) return;

    const fetchRoomData = async () => {
      try {
        const res = await api.post(`/rooms/${roomId}/join`, { role: 'VIEWER' });
        setRoomInfo(res.data.id || roomId, res.data.name, res.data.expiresAt, res.data.isActive);
        if (res.data.members) {
          setParticipants(res.data.members);
        }
        if (res.data.languageCache) {
          useRoomStore.getState().setLanguageCache(res.data.languageCache);
        }

        // Find initial code to display (either current code, cached code for current lang, or default)
        const initialLang = res.data.currentLanguage || 'java';
        let initialCode = res.data.currentCode;
        if (!initialCode) {
          initialCode = (res.data.languageCache && res.data.languageCache[initialLang])
            ? res.data.languageCache[initialLang]
            : DEFAULT_CODE_TEMPLATES[initialLang];
        }

        useRoomStore.getState().setLanguage(initialLang);
        useRoomStore.getState().setCode(initialCode);
        if (res.data.testCases) {
          useRoomStore.getState().setTestCases(res.data.testCases);
        }
        if (res.data.chats) {
          useRoomStore.getState().setChatMessages(res.data.chats);
        }
        if (res.data.logs) {
          useRoomStore.getState().setLogs(res.data.logs);
        }
        if (res.data.isWhiteboardOpen !== undefined) {
          useRoomStore.getState().setIsWhiteboardOpen(res.data.isWhiteboardOpen);
        }
        if (res.data.whiteboardData !== undefined) {
          useRoomStore.getState().setWhiteboardData(res.data.whiteboardData);
        }

        const savedUnread = localStorage.getItem(`unread_${res.data.id || roomId}`);
        if (savedUnread) {
          useRoomStore.getState().setUnreadChatCount(parseInt(savedUnread, 10));
        }

        if (!joinedRef.current) {
          useNotificationStore.getState().addNotification('Successfully joined workspace!', 'success');
          joinedRef.current = true;
        }
      } catch (err) {
        if (!err.response || err.response.status >= 500) {
          console.error("Failed to join/fetch room data", err);
        }
        let errorMsg = "An error occurred while joining the workspace.";
        if (err.response?.data) {
          errorMsg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || err.response.data.error || "Cannot join workspace. It may be full.");
        }
        useNotificationStore.getState().addNotification(errorMsg, 'error');
        router.push('/dashboard');
      } finally {
        setIsLoadingRoom(false);
      }
    };

    fetchRoomData();
  }, [roomId, isAuthenticated, isMounted, router, setParticipants, setRoomInfo]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const proLanguages = ['javascript', 'sql'];

  const handleLanguageChange = (newLang) => {
    if (proLanguages.includes(newLang)) {
      if (!isPro) {
        setIsProModalOpen(true);
        return;
      }
      
      const hasFreeUsers = useRoomStore.getState().participants.some(p => p.subscriptionType !== 'PRO');
      if (hasFreeUsers) {
        setRoomAlert({
          title: "Pro Language Restriction",
          message: "You can only use SQL and JavaScript when all members in the workspace are CollabX Pro users. Please ask free users to upgrade or leave the room."
        });
        return;
      }
    }

    const state = useRoomStore.getState();
    const cachedCode = state.languageCache[newLang];
    const newCode = cachedCode || DEFAULT_CODE_TEMPLATES[newLang] || '';

    setLanguage(newLang);
    state.setCode(newCode); // Will automatically save into state.languageCache via our roomStore update
    wsHook.sendCodeChange(newCode, newLang);
    setShowLangMenu(false);
  };

  const currentUserParticipant = useRoomStore.getState().participants.find(p => p.id === user?.id);
  const isPending = isActive && currentUserParticipant?.status === 'PENDING';
  const isHost = currentUserParticipant?.role === 'HOST';

  // Force mute if backend indicates host revoked voice permission
  useEffect(() => {
    if (currentUserParticipant?.isMuted) {
      voiceControls.forceMute();
    }
  }, [currentUserParticipant?.isMuted]);

  const [outputPanelHeight, setOutputPanelHeight] = useState(45);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;
    const newHeightPercent = (newHeight / containerRect.height) * 100;
    if (newHeightPercent > 10 && newHeightPercent < 90) {
      setOutputPanelHeight(newHeightPercent);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (!expiresAt || !isActive) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiration = new Date(process.env.NEXT_PUBLIC_API_BASE_URL?.includes('railway') && !expiresAt.endsWith('Z') ? expiresAt + 'Z' : expiresAt);
      const diffInSeconds = Math.floor((expiration - now) / 1000);
      return diffInSeconds;
    };

    let interval;
    const updateTimer = () => {
      const currentRemaining = calculateTimeLeft();
      setTimeLeft(currentRemaining);

      if (currentRemaining <= 0) {
        localStorage.setItem('dashboardAlert', JSON.stringify({
          title: "Time Expired",
          message: "The Workspace Session has reached its maximum preset duration limit and is permanently closed."
        }));
        window.location.href = '/dashboard';
        if (interval) clearInterval(interval);
      } else if (currentRemaining === 300 && !hasWarnedRef.current) {
        useNotificationStore.getState().addNotification('Warning: Session will expire in 5 minutes!', 'warning');
        hasWarnedRef.current = true;
      }
    };

    updateTimer();
    interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, isActive, router]);

  const handleExtend = async () => {
    if (extending) return;
    setExtending(true);
    try {
      await api.post(`/rooms/${roomId}/extend?extraMinutes=30`);
      // WebSocket will broadcast time.extended to update expiresAt
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to extend session.';
      console.error('Extension failed:', errorMsg);
      useNotificationStore.getState().addNotification(errorMsg, 'error');
    } finally {
      setExtending(false);
    }
  };

  const handleExecuteSelected = async () => {
    const state = useRoomStore.getState();
    if (state.isExecuting || !state.selectedCode || state.selectedCode.trim() === '') return;
    const executorName = currentUserParticipant?.name || user?.name || "Someone";
    state.setIsExecuting(true, executorName);
    state.setActiveOutputTab('OUTPUT');
    state.setShowOutputPanel(true);
    state.setOutput(null);
    wsHook.sendExecutionStatus('RUNNING', null, executorName);
    if (wsHook.sendActionTrigger) wsHook.sendActionTrigger('RUN_START');

    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const execRes = await api.post('/execute', { roomId, code: state.selectedCode, language: state.language, stdin: '' });
      useRoomStore.getState().setOutput(execRes.data);
      useRoomStore.getState().setIsExecuting(false);
      wsHook.sendExecutionResult(execRes.data);
      if (wsHook.sendActionTrigger) wsHook.sendActionTrigger('SUBMIT_END');
    } catch (err) {
      const errorResult = { error: err.response?.data?.message || err.message };
      useRoomStore.getState().setOutput(errorResult);
      useRoomStore.getState().setIsExecuting(false);
      wsHook.sendExecutionResult(errorResult);
    }
  };

  const handleExecuteAll = async () => {
    const state = useRoomStore.getState();
    if (state.isExecuting) return;
    const executorName = currentUserParticipant?.name || user?.name || "Someone";
    state.setIsExecuting(true, executorName);
    state.setActiveOutputTab('OUTPUT');
    state.setShowOutputPanel(true);
    state.setOutput(null);
    wsHook.sendExecutionStatus('RUNNING', null, executorName);
    if (wsHook.sendActionTrigger) wsHook.sendActionTrigger('RUN_START');

    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const execRes = await api.post('/execute', { roomId, code: state.code, language: state.language, stdin: '' });
      useRoomStore.getState().setOutput(execRes.data);
      useRoomStore.getState().setIsExecuting(false);
      wsHook.sendExecutionResult(execRes.data);
      if (wsHook.sendActionTrigger) wsHook.sendActionTrigger('SUBMIT_END');
    } catch (err) {
      const errorResult = { error: err.response?.data?.message || err.message };
      useRoomStore.getState().setOutput(errorResult);
      useRoomStore.getState().setIsExecuting(false);
      wsHook.sendExecutionResult(errorResult);
    }
  };

  const handleRunCode = async () => {
    const state = useRoomStore.getState();
    if (state.isExecuting || currentUserParticipant?.role === 'VIEWER' || state.testCases.length === 0) return;
    const executorName = currentUserParticipant?.name || user?.name || "Someone";
    state.setIsExecuting(true, executorName);
    state.setActiveOutputTab('OUTPUT');
    state.setShowOutputPanel(true);
    state.setOutput(null);
    wsHook.sendExecutionStatus('RUNNING', null, executorName);
    if (wsHook.sendActionTrigger) wsHook.sendActionTrigger('RUN_START');

    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const dryRunInput = state.testCases && state.testCases.length > 0 ? state.testCases[0].input : "";
      const execRes = await api.post('/execute', { roomId, code: state.code, language: state.language, stdin: dryRunInput });

      if (execRes.data.compilationError) {
        useRoomStore.getState().setOutput(execRes.data);
        useRoomStore.getState().setIsExecuting(false);
        wsHook.sendExecutionResult(execRes.data);
        return;
      }

      if (state.testCases && state.testCases.length > 0) {
        const submitRes = await api.post('/submit', { roomId, code: state.code, language: state.language, testCases: state.testCases });
        const finalResult = { type: 'SUBMIT', data: submitRes.data };
        useRoomStore.getState().setOutput(finalResult);
        useRoomStore.getState().setIsExecuting(false);
        wsHook.sendExecutionResult(finalResult);
        if (wsHook.sendActionTrigger) wsHook.sendActionTrigger('SUBMIT_END');
      } else {
        useRoomStore.getState().setOutput(execRes.data);
        useRoomStore.getState().setIsExecuting(false);
        wsHook.sendExecutionResult(execRes.data);
        if (wsHook.sendActionTrigger) wsHook.sendActionTrigger('SUBMIT_END');
      }
    } catch (err) {
      const errorResult = { error: err.response?.data?.message || err.message };
      useRoomStore.getState().setOutput(errorResult);
      useRoomStore.getState().setIsExecuting(false);
      wsHook.sendExecutionResult(errorResult);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
        const state = useRoomStore.getState();
        if (state.language === 'sql') {
          e.preventDefault();
          e.stopPropagation();
          if (!state.selectedCode || state.selectedCode.trim() === '') {
            useNotificationStore.getState().addNotification('Please select SQL text to execute!', 'warning');
            return;
          }
          if (currentUserParticipant?.role === 'HOST' || currentUserParticipant?.role === 'EDITOR') {
            handleExecuteSelected();
          }
        }
      } else if (e.ctrlKey && !e.shiftKey && e.key === 'Enter') {
        const state = useRoomStore.getState();
        e.preventDefault();
        e.stopPropagation();

        if (state.language === 'sql') {
          if (currentUserParticipant?.role === 'HOST' || currentUserParticipant?.role === 'EDITOR') {
            handleExecuteAll();
          }
        } else {
          if (state.testCases.length === 0) {
            useNotificationStore.getState().addNotification('No test cases available to execute!', 'warning');
            return;
          }
          if (currentUserParticipant?.role !== 'VIEWER') {
            handleRunCode();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [currentUserParticipant?.role, roomId]);

  if (!isMounted || !user || isLoadingRoom) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex flex-col items-center justify-center relative">
        <div className="w-16 h-16 rounded-full border border-[#2A2A35] flex items-center justify-center bg-[#13131A] shadow-[0_0_40px_rgba(108,99,255,0.15)] mb-6">
           <div className="w-6 h-6 rounded border-2 border-primary border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Accessing Workspace</h2>
        <p className="text-sm text-muted-foreground">Securely connecting to the host...</p>
      </div>
    </div>
  );

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 relative overflow-hidden">
        {/* Ambient background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="bg-[#12121A] shadow-2xl rounded-2xl max-w-4xl w-full border border-white/[0.05] relative overflow-hidden z-10 backdrop-blur-xl flex flex-col md:flex-row items-center p-8 md:p-12 gap-10">
          
          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20"></div>

          {/* Left Side: Loader & Message */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="flex justify-center mb-10 relative">
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
              
              <div className="absolute w-32 h-32 bg-[#F5A524]/10 blur-[40px] rounded-full animate-pulse"></div>
              
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(245,165,36,0.3)]">
                  <defs>
                    <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F5A524" />
                      <stop offset="50%" stopColor="#FFC107" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                  
                  <path 
                    d="M 25 25 L 75 75" 
                    fill="none" 
                    stroke="url(#xGradient)" 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                    style={{ strokeDasharray: 100, animation: 'drawX 2.5s ease-in-out infinite' }}
                  />
                  <path 
                    d="M 75 25 L 25 75" 
                    fill="none" 
                    stroke="url(#xGradient)" 
                    strokeWidth="10" 
                    strokeLinecap="round" 
                    style={{ strokeDasharray: 100, animation: 'drawX 2.5s ease-in-out infinite 0.4s' }}
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl font-black text-white mb-3 tracking-tight">
              Waiting For Approval
            </h1>

            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-sm">
              Please wait for the host to verify your request and grant you access to the workspace.              </p>
          </div>

          {/* Right Side: Details & Action */}
          <div className="flex-1 flex flex-col justify-center w-full max-w-md mx-auto">
            <div className="bg-white/[0.02] rounded-2xl p-6 text-left border border-white/[0.05] mb-6 space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
                <span className="text-muted-foreground/70 text-xs font-bold uppercase tracking-wider">Workspace</span>
                <span className="font-semibold text-white truncate max-w-[150px]">{roomName}</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
                <span className="text-muted-foreground/70 text-xs font-bold uppercase tracking-wider">Room ID</span>
                <span className="font-mono text-white/80 text-sm">{roomId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground/70 text-xs font-bold uppercase tracking-wider">Requested Role</span>
                <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold tracking-widest">{currentUserParticipant?.role}</span>
              </div>
            </div>

            <button
              onClick={async () => {
                await api.delete(`/rooms/${roomId}/leave`).catch(console.error);
                router.push("/dashboard");
              }}
              className="w-full bg-transparent hover:bg-red-500/30 hover:text-white/80 border border-danger/30 text-danger transition-all duration-300 py-3.5 px-4 rounded-xl text-sm font-bold tracking-wide uppercase cursor-pointer"
            >
              Cancel Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  const languages = ['java', 'python', 'cpp', 'c', 'javascript', 'sql'];

  return (
    <div className="h-screen w-screen flex flex-col p-4 gap-4 overflow-hidden bg-[#0A0A0F]">

      {/* Header Island (Full Width) */}
      <div className="h-16 rounded-2xl border border-border flex items-center justify-between px-6 bg-card shrink-0 shadow-sm backdrop-blur-md bg-card/90 relative z-20">
        <div className="flex items-center gap-6">
          <div className="tooltip">
            <button
              onClick={() => router.push(`/profile?returnUrl=/room/${roomId}`)}
              className="p-2 cursor-pointer rounded-full w-9 text-white/50 h-9 bg-primary/20 text-muted-foreground hover:text-white transition-colors"
            >
              <User size={20} />
            </button>
            <div className="tooltip-content z-50">  
              <div className="tooltip-box">View Profile</div>
              <div className="tooltip-arrow"></div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold text-white leading-tight">{roomName || 'Untitled Workspace'}</span>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
              <span className="bg-background px-1.5 rounded border border-border">{roomId}</span>
              <button onClick={handleCopyLink} className="hover:text-white hover:cursor-pointer transition-colors">
                {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-border"></div>

          <div className="flex items-center gap-2 bg-success/10 border border-success/20 px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-[10px] font-bold text-success tracking-widest uppercase">SYNC</span>
          </div>

          {timeLeft !== null && timeLeft > 0 && (
            <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-colors ${timeLeft <= 300 ? 'text-danger border-danger/30 bg-danger/10 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-primary border-primary/30 bg-primary/10'
              }`}>
              <Clock size={12} />
              Ends: {Math.floor(timeLeft / 3600).toString().padStart(2, '0')}:{Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">

          {timeLeft !== null && timeLeft <= 900 && isHost && (
            <div className="relative group/extend">
              <button
                onClick={handleExtend}
                disabled={extending || !isPro}
                className={`flex items-center cursor-pointer gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isPro
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/30 hover:scale-105 active:scale-95 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]'
                  : 'bg-background/50 border border-border/50 text-muted-foreground cursor-not-allowed'
                  } ${extending && isPro ? 'opacity-50' : ''}`}
              >
                <Sparkles size={12} className={extending ? "animate-spin" : ""} />
                {extending ? 'Extending...' : '+30 Min'}
              </button>
              
              {!isPro && (
                <div className="absolute top-full right-0 mt-2 w-48 opacity-0 group-hover/extend:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-card border border-border text-white text-xs p-2 rounded shadow-xl text-center">
                    PRO Subscription Required to extend workspace duration.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Premium Upgrade Button */}
          {!isPro && (
            <button
              onClick={() => setIsProModalOpen(true)}
              className="group relative cursor-pointer flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-[#F5A524] to-[#F5D547] px-3 py-1.5 text-white transition-all hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
            >
              <Sparkles size={12} className="fill-white" />
              <span className="text-[10px] font-black tracking-widest uppercase relative z-10">PRO</span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer pointer-events-none" />
            </button>
          )}

          {/* Premium Custom Dropdown */}
          <div className="relative group/lang" ref={langMenuRef}>
            <button
              onClick={() => (!isActive || isHost) && setShowLangMenu(!showLangMenu)}
              disabled={isActive && !isHost}
              className={`flex items-center justify-between min-w-[140px] px-4 py-2.5 rounded-xl border transition-all text-xs font-bold uppercase
                ${(!isActive || isHost) ? 'bg-background border-border text-white hover:border-primary/50 cursor-pointer shadow-sm' : 'bg-background/50 border-border/50 text-white/50 cursor-not-allowed'}
              `}
            >
              <span>{language === 'cpp' ? 'C++' : language}</span>
              {(!isActive || isHost) && <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />}
            </button>
            {isActive && !isHost && (
              <div className="absolute top-full right-0 mt-2 w-48 opacity-0 group-hover/lang:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                <div className="bg-card border border-border text-white text-xs p-2 rounded shadow-xl text-center">
                  Only the Host can change the language
                </div>
              </div>
            )}


            {showLangMenu && (
              <>
                <div className="absolute right-0 top-12 w-[140px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-2 py-2 border-b border-border/50 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                    Select Language
                  </div>
                  {languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`relative w-full text-left hover:cursor-pointer px-4 py-2.5 text-xs font-bold uppercase transition-colors
                        ${language === lang ? 'bg-primary/20 text-primary border-l-2 border-primary' : 'text-white hover:bg-primary/10 hover:text-primary border-l-2 border-transparent'}
                      `}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="pr-8">{lang === 'cpp' ? 'C++' : lang}</span>
                        {proLanguages.includes(lang) && (
                          <div className="absolute top-1 right-1 flex items-center gap-1 bg-gradient-to-r from-[#F5A524] to-[#F5D547] px-1.5 py-0.5 rounded text-[8px] font-black text-black shadow-md transform rotate-12">
                            <span>PRO</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {language === 'sql' && isActive && (currentUserParticipant?.role === 'HOST' || currentUserParticipant?.role === 'EDITOR') ? (
            <div className="flex items-center gap-2">

  {/* Execute Selected */}
  <div className="tooltip">
    <button
      onClick={handleExecuteSelected}
      disabled={isExecuting || !selectedCode || selectedCode.trim() === ''}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
        isExecuting || !selectedCode || selectedCode.trim() === ''
          ? 'bg-success/5 border border-success/10 text-success/50 cursor-not-allowed'
          : 'bg-success/10 border border-success/30 cursor-pointer text-success hover:bg-success hover:text-black hover:shadow-success/20'
      }`}
    >
      {isExecuting ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          Executing...
        </>
      ) : (
        <>
          <Check size={16} />
          Execute Selected
        </>
      )}
    </button>

    <div className="tooltip-content">
      <div className="tooltip-box">
        {!selectedCode || selectedCode.trim() === ''
          ? "Select text to execute"
          : isExecuting
          ? "Running your query..."
          : "Execute selected query (Ctrl + Shift + Enter)"}
      </div>
      <div className="tooltip-arrow"></div>
    </div>
  </div>


  {/* Execute All */}
  <div className="tooltip">
    <button
      onClick={handleExecuteAll}
      disabled={isExecuting}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
        isExecuting
          ? 'bg-success/5 border border-success/10 text-success/50 cursor-not-allowed'
          : 'bg-success/10 cursor-pointer border border-success/30 text-success hover:bg-success hover:text-black hover:shadow-success/20'
      }`}
    >
      {isExecuting ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
          Executing...
        </>
      ) : (
        <>
          <Check size={16} />
          Execute All
        </>
      )}
    </button>

    <div className="tooltip-content">
      <div className="tooltip-box">
        {isExecuting
          ? "Execution in progress..."
          : "Execute all queries (Ctrl + Enter)"}
      </div>
      <div className="tooltip-arrow"></div>
    </div>
  </div>

</div>
          ) : (
            <div className="relative group w-fit">

              <div className="tooltip">

                <button
                  onClick={handleRunCode}
                  disabled={
                    currentUserParticipant?.role === 'VIEWER' ||
                    testCases.length === 0 ||
                    isExecuting
                  }
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${currentUserParticipant?.role === 'VIEWER' ||
                      testCases.length === 0 ||
                      isExecuting
                      ? 'bg-success/5 border border-success/10 text-success/50 cursor-not-allowed'
                      : 'bg-success/10 border border-success/30 cursor-pointer text-success hover:bg-success hover:text-black hover:shadow-success/20'
                    }`}
                >
                  {isExecuting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                      Executing...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Execute Code (Tests: {testCases.length})
                    </>
                  )}
                </button>

                {/* Tooltip */}
                <div className="tooltip-content">
                  <div className="tooltip-box">
                    {!isActive
                      ? "Room ended cannot edit"
                      : currentUserParticipant?.role === 'VIEWER'
                      ? "Viewers cannot execute code"
                      : testCases.length === 0
                        ? "Add test cases to execute"
                        : isExecuting
                          ? "Running your code..."
                          : "Execute Code (Ctrl + Enter)"}
                  </div>
                  <div className="tooltip-arrow"></div>
                </div>

              </div>
            </div>
          )}

          <div className="h-8 w-px bg-border mx-1"></div>

          <div className="tooltip">
            <button
              onClick={() => setShowOutputPanel(!showOutputPanel)}
              className={`p-2.5 rounded-xl cursor-pointer border transition-all ${showOutputPanel
                ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_15px_rgba(var(--color-primary),0.2)]'
                : 'bg-background border-border text-muted-foreground hover:text-white hover:border-muted-foreground/30'
                }`}
            >
              <TerminalSquare size={18} />
            </button>

            <div className="tooltip-content">
              <div className="tooltip-box">
                {showOutputPanel ? "Hide Output Panel" : "Show Output Panel"}
              </div>
              <div className="tooltip-arrow"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bottom Section */}
      <div className="flex-1 flex gap-4 min-h-0">

        {/* Left Sidebar (Islands) */}
        <Sidebar
          roomId={roomId}
          wsHook={wsHook}
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          voiceControls={voiceControls}
        />

        {/* Editor Area */}
        <div ref={containerRef} className="flex-1 flex flex-col gap-4 min-w-0">

          {isWhiteboardOpen ? (
            <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden relative shadow-sm">
              <Whiteboard wsHook={wsHook} />
            </div>
          ) : (
            <>
              {/* Editor Island */}
              <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden relative shadow-sm">
                <CodeEditor wsHook={wsHook} />
              </div>

              {/* Resize Handle and Output Panel */}
              {showOutputPanel && (
                <div
                  style={{ height: `${outputPanelHeight}%` }}
                  className="relative rounded-2xl border border-border bg-card shadow-sm shrink-0 flex flex-col"
                >
                  {/* Draggable Handle */}
                  <div
                    onMouseDown={handleMouseDown}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 group cursor-row-resize flex items-center justify-center z-10"
                  >
                    <div className="w-8 h-1 rounded-full bg-border group-hover:bg-primary transition-colors"></div>
                  </div>
                  <div className="flex-1 overflow-hidden rounded-2xl">
                    <OutputPanel wsHook={wsHook} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Role Change Modal */}
      {roleChangeAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-sm transform rounded-3xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-6 text-center animate-in zoom-in-95 fade-in duration-200">
            <div className="w-14 h-14 mx-auto bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><polyline points="16 11 18 13 22 9"></polyline></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Role Updated</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The Host has changed your role to <strong className="text-white uppercase tracking-wider">{roleChangeAlert.role}</strong>.
            </p>
            <button
              onClick={() => useRoomStore.getState().setRoleChangeAlert(null)}
              className="w-full py-3 cursor-pointer rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
            >
              Okay, got it
            </button>
          </div>
        </div>
      )}

      {/* Host Transfer Modal */}
      {hostTransferAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-sm transform rounded-3xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-6 text-center animate-in zoom-in-95 fade-in duration-200">
            <div className="w-14 h-14 mx-auto bg-[#F5A623]/20 text-[#F5A623] rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You are now the Host</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The previous Host has transferred their authority to you. You now have full administrative control over this workspace.
            </p>
            <button
              onClick={() => useRoomStore.getState().setHostTransferAlert(false)}
              className="w-full py-3 cursor-pointer rounded-xl text-sm font-bold bg-[#F5A623] text-black hover:bg-[#F5A623]/90 transition-colors"
            >
              Assume Control
            </button>
          </div>
        </div>
      )}

      {/* Room Alert Modal */}
      {roomAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-sm transform rounded-3xl bg-[#0a0a0f] border border-white/10 shadow-2xl p-6 text-center animate-in zoom-in-95 fade-in duration-200">
            <div className="w-14 h-14 mx-auto bg-success/20 text-success rounded-full flex items-center justify-center mb-4">
              <Check size={28} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{roomAlert.title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{roomAlert.message}</p>
            <button
              onClick={() => {
                setRoomAlert(null);
                localStorage.removeItem('roomAlert');
                if (wsHook && wsHook.triggerGlobalRefresh) {
                  wsHook.triggerGlobalRefresh();
                }
              }}
              className="w-full py-3 cursor-pointer rounded-xl text-sm font-bold bg-success/80 text-black hover:bg-success transition-colors"
            >
              Okay, got it
            </button>
          </div>
        </div>
      )}
      <ProUpgradeModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} />
    </div>
  );
}
