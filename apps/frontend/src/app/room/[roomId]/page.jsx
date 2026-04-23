'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Copy, Check, TerminalSquare, ChevronDown, Clock, Sparkles } from 'lucide-react';
import { useRoomStore } from '../../../store/roomStore';
import { useUserStore } from '../../../store/userStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { useVoice } from '../../../hooks/useVoice';
import CodeEditor from '../../../components/editor/CodeEditor';
import OutputPanel from '../../../components/editor/OutputPanel';
import Sidebar from '../../../components/room/Sidebar';
import api from '../../../lib/api';
import { useNotificationStore } from '../../../store/notificationStore';

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
  const { roomName, expiresAt, setRoomInfo, language, setLanguage, testCases, participants, setParticipants, sessionEndedReason, roleChangeAlert, hostTransferAlert, isExecuting, showOutputPanel, setShowOutputPanel } = useRoomStore();
  const [copied, setCopied] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('USERS');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [roomAlert, setRoomAlert] = useState(null);

  const wsHook = useWebSocket(roomId);
  const voiceControls = useVoice(roomId, user);

  const [isMounted, setIsMounted] = useState(false);
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
      router.push('/login');
      return;
    }

    if (!isMounted || !isAuthenticated) return;

    const fetchRoomData = async () => {
      try {
        const res = await api.post(`/rooms/${roomId}/join`, { role: 'VIEWER' });
        setRoomInfo(res.data.id || roomId, res.data.name, res.data.expiresAt);
        if (res.data.members) {
          setParticipants(res.data.members);
        }
        if (res.data.languageCache) {
          useRoomStore.getState().setLanguageCache(res.data.languageCache);
        }
        
        // Find initial code to display (either current code, cached code for current lang, or default)
        const initialLang = res.data.language || 'java';
        let initialCode = res.data.currentCode;
        if (!initialCode) {
           initialCode = (res.data.languageCache && res.data.languageCache[initialLang]) 
                ? res.data.languageCache[initialLang] 
                : DEFAULT_CODE_TEMPLATES[initialLang];
        }
        
        useRoomStore.getState().setCode(initialCode);
        if (res.data.testCases) {
          useRoomStore.getState().setTestCases(res.data.testCases);
        }
        if (res.data.chats) {
          useRoomStore.getState().setChatMessages(res.data.chats);
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
      }
    };

    fetchRoomData();
  }, [roomId, isAuthenticated, isMounted, router, setParticipants, setRoomInfo]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanguageChange = (newLang) => {
    const state = useRoomStore.getState();
    const cachedCode = state.languageCache[newLang];
    const newCode = cachedCode || DEFAULT_CODE_TEMPLATES[newLang] || '';
    
    setLanguage(newLang);
    state.setCode(newCode); // Will automatically save into state.languageCache via our roomStore update
    wsHook.sendCodeChange(newCode, newLang);
    setShowLangMenu(false);
  };

  const currentUserParticipant = useRoomStore.getState().participants.find(p => p.id === user?.id);
  const isPending = currentUserParticipant?.status === 'PENDING';
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
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const expiration = new Date(expiresAt);
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
  }, [expiresAt, router]);

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

  if (!isMounted || !user) return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading...</div>;

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
        <h1 className="text-3xl font-bold mb-4">Waiting for Approval</h1>
        <p className="text-muted-foreground text-lg text-center max-w-md">
          You have requested to join workspace <strong>{roomId}</strong>.<br />
          Please wait for the host to let you in.
        </p>
      </div>
    );
  }

  const languages = ['java', 'python', 'cpp', 'c', 'javascript', 'sql'];

  return (
    <div className="h-screen w-screen flex flex-col p-4 gap-4 overflow-hidden bg-[#0A0A0F]">

      {/* Header Island (Full Width) */}
      <div className="h-16 rounded-2xl border border-border flex items-center justify-between px-6 bg-card shrink-0 shadow-sm backdrop-blur-md bg-card/90 relative z-20">
        <div className="flex items-center gap-6">
          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold text-white leading-tight">{roomName || 'Untitled Workspace'}</span>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
              <span className="bg-background px-1.5 rounded border border-border">{roomId}</span>
              <button onClick={handleCopyLink} className="hover:text-white transition-colors">
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
            <button
              onClick={handleExtend}
              disabled={extending || !isPro}
              title={!isPro ? "PRO Subscription Required" : ""}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isPro
                ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/30 hover:scale-105 active:scale-95 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]'
                : 'bg-background/50 border border-border/50 text-muted-foreground cursor-not-allowed'
                } ${extending && isPro ? 'opacity-50' : ''}`}
            >
              <Sparkles size={12} className={extending ? "animate-spin" : ""} />
              {extending ? 'Extending...' : '+30 Min'}
            </button>
          )}

          {/* Premium Custom Dropdown */}
          <div className="relative">
            <button
              onClick={() => isHost && setShowLangMenu(!showLangMenu)}
              disabled={!isHost}
              className={`flex items-center justify-between min-w-[140px] px-4 py-2.5 rounded-xl border transition-all text-xs font-bold uppercase
                ${isHost ? 'bg-background border-border text-white hover:border-primary/50 cursor-pointer shadow-sm' : 'bg-background/50 border-border/50 text-white/50 cursor-not-allowed'}
              `}
              title={!isHost ? "Only the Host can change the language" : ""}
            >
              <span>{language === 'cpp' ? 'C++' : language}</span>
              {isHost && <ChevronDown size={14} className={`text-muted-foreground transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />}
            </button>

            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)}></div>
                <div className="absolute right-0 top-12 w-[140px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-3 py-2 border-b border-border/50 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                    Select Language
                  </div>
                  {languages.map(lang => (
                    <button
                      key={lang}
                      onClick={() => handleLanguageChange(lang)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase transition-colors
                        ${language === lang ? 'bg-primary/20 text-primary border-l-2 border-primary' : 'text-white hover:bg-primary/10 hover:text-primary border-l-2 border-transparent'}
                      `}
                    >
                      {lang === 'cpp' ? 'C++' : lang}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={async () => {
              if (isExecuting) return;
              const executorName = currentUserParticipant?.name || user?.name || "Someone";
              useRoomStore.getState().setIsExecuting(true, executorName);
              useRoomStore.getState().setActiveOutputTab('OUTPUT');
              useRoomStore.getState().setShowOutputPanel(true);
              useRoomStore.getState().setOutput(null);
              wsHook.sendExecutionStatus('RUNNING', null, executorName);
              const state = useRoomStore.getState();
              try {
                // Stage 1: Compilation / Dry-run Check
                const dryRunInput = state.testCases && state.testCases.length > 0 ? state.testCases[0].input : "";
                const execRes = await api.post('/execute', { roomId, code: state.code, language: state.language, stdin: dryRunInput });
                
                // If the code strictly fails to compile, abort and show the global compilation error
                if (execRes.data.compilationError) {
                  useRoomStore.getState().setOutput(execRes.data);
                  useRoomStore.getState().setIsExecuting(false);
                  wsHook.sendExecutionResult(execRes.data);
                  return;
                }

                // Stage 2: If compilation succeeds, run all test cases (ignoring any dry-run runtime errors)
                if (state.testCases && state.testCases.length > 0) {
                   const submitRes = await api.post('/submit', { roomId, code: state.code, language: state.language, testCases: state.testCases });
                   const finalResult = { type: 'SUBMIT', data: submitRes.data };
                   useRoomStore.getState().setOutput(finalResult);
                   useRoomStore.getState().setIsExecuting(false);
                   wsHook.sendExecutionResult(finalResult);
                } else {
                   // If there are no test cases, the dry-run execution result is our final output
                   useRoomStore.getState().setOutput(execRes.data);
                   useRoomStore.getState().setIsExecuting(false);
                   wsHook.sendExecutionResult(execRes.data);
                }
              } catch (err) {
                const errorResult = { error: err.response?.data?.message || err.message };
                useRoomStore.getState().setOutput(errorResult);
                useRoomStore.getState().setIsExecuting(false);
                wsHook.sendExecutionResult(errorResult);
              }
            }}
            disabled={currentUserParticipant?.role === 'VIEWER' || testCases.length === 0 || isExecuting}
            title={currentUserParticipant?.role === 'VIEWER' ? "Viewers cannot submit code" : ""}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${currentUserParticipant?.role === 'VIEWER' || testCases.length === 0 || isExecuting ? 'bg-success/5 border border-success/10 text-success/50 cursor-not-allowed' : 'bg-success/10 border border-success/30 text-success hover:bg-success hover:text-black hover:shadow-success/20'}`}
          >
            {isExecuting ? (
              <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span> Executing...</>
            ) : (
              <><Check size={16} /> Execute Code (Tests: {testCases.length})</>
            )}
          </button>

          <div className="h-8 w-px bg-border mx-1"></div>

          <button
            onClick={() => setShowOutputPanel(!showOutputPanel)}
            title="Toggle Output Panel"
            className={`p-2.5 rounded-xl border transition-all ${showOutputPanel ? 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_15px_rgba(var(--color-primary),0.2)]' : 'bg-background border-border text-muted-foreground hover:text-white hover:border-muted-foreground/30'}`}
          >
            <TerminalSquare size={18} />
          </button>
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
              className="w-full py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
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
              className="w-full py-3 rounded-xl text-sm font-bold bg-[#F5A623] text-black hover:bg-[#F5A623]/90 transition-colors"
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
              }}
              className="w-full py-3 rounded-xl text-sm font-bold bg-success text-black hover:bg-success/90 transition-colors"
            >
              Okay, got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
