'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Copy, Check, TerminalSquare, ChevronDown } from 'lucide-react';
import { useRoomStore } from '../../../store/roomStore';
import { useUserStore } from '../../../store/userStore';
import { useWebSocket } from '../../../hooks/useWebSocket';
import CodeEditor from '../../../components/editor/CodeEditor';
import OutputPanel from '../../../components/editor/OutputPanel';
import Sidebar from '../../../components/room/Sidebar';
import api from '../../../lib/api';

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, restoreSession } = useUserStore();
  const { roomName, setRoomInfo, language, setLanguage, testCases, setParticipants } = useRoomStore();
  const [copied, setCopied] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('USERS');
  const [showOutputPanel, setShowOutputPanel] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const wsHook = useWebSocket(roomId);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    restoreSession();
  }, [restoreSession]);

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
        setRoomInfo(res.data.id || roomId, res.data.name);
        if (res.data.members) {
          setParticipants(res.data.members);
        }
        if (res.data.currentCode) {
          useRoomStore.getState().setCode(res.data.currentCode);
        }
        if (res.data.testCases) {
          useRoomStore.getState().setTestCases(res.data.testCases);
        }
        if (res.data.chats) {
          useRoomStore.getState().setChatMessages(res.data.chats);
        }
      } catch (err) {
        console.error("Failed to join/fetch room data", err);
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
    setLanguage(newLang);
    wsHook.sendCodeChange(useRoomStore.getState().code, newLang);
    setShowLangMenu(false);
  };

  const currentUserParticipant = useRoomStore.getState().participants.find(p => p.id === user?.id);
  const isPending = currentUserParticipant?.status === 'PENDING';
  const isHost = currentUserParticipant?.role === 'HOST';

  const [outputPanelHeight, setOutputPanelHeight] = useState(35);
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

          <div className="flex items-center gap-2 text-danger border border-danger/30 bg-danger/10 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold">
            Ends: 00:29:02
          </div>
        </div>

        <div className="flex items-center gap-4">

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
              wsHook.sendExecutionStatus('RUNNING');
              const state = useRoomStore.getState();
              try {
                const execRes = await api.post('/execute', { roomId, code: state.code, language: state.language, testCases: [] });
                if (execRes.data.error) {
                  wsHook.sendExecutionResult(execRes.data);
                  return;
                }
                const submitRes = await api.post('/submit', { roomId, code: state.code, language: state.language, testCases: state.testCases });
                wsHook.sendExecutionResult({ type: 'SUBMIT', data: submitRes.data });
              } catch (err) {
                wsHook.sendExecutionResult({ error: err.response?.data?.message || err.message });
              }
            }}
            disabled={currentUserParticipant?.role === 'VIEWER' || testCases.length === 0}
            title={currentUserParticipant?.role === 'VIEWER' ? "Viewers cannot submit code" : ""}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${currentUserParticipant?.role === 'VIEWER' || testCases.length === 0 ? 'bg-success/5 border border-success/10 text-success/50 cursor-not-allowed' : 'bg-success/10 border border-success/30 text-success hover:bg-success hover:text-black hover:shadow-success/20'}`}
          >
            <Check size={16} /> Execute Code (Tests: {testCases.length})
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
    </div>
  );
}
