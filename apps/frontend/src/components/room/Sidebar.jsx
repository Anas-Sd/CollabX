'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/userStore';
import { useRoomStore } from '../../store/roomStore';
import { Users, MessageSquare, UserPlus, Shield, MicOff, Mic, MoreVertical, LogOut } from 'lucide-react';
import api from '../../lib/api';

export default function Sidebar({ roomId, wsHook, activeTab, setActiveTab, voiceControls }) {
  const router = useRouter();
  const { user } = useUserStore();
  const { participants, removeParticipant, updateParticipantRole, chatMessages, unreadChatCount, resetUnreadChat } = useRoomStore();
  const [openMenuId, setOpenMenuId] = useState(null);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'CHAT' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  // Silent refresh of participants/waitlist when changing tabs to ensure data is always fresh
  useEffect(() => {
    if (wsHook && wsHook.fetchRoomMembers) {
      wsHook.fetchRoomMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const [transferHostModalOpen, setTransferHostModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    hideCancel: false,
    onConfirm: () => { }
  });

  const openConfirm = (title, message, confirmText, onConfirm, hideCancel = false) => {
    setConfirmModalConfig({ isOpen: true, title, message, confirmText, hideCancel, onConfirm });
  };
  const currentUserParticipant = participants.find(p => p.id === user?.id);
  const isHost = currentUserParticipant?.role === 'HOST';

  const activeParticipants = participants.filter(p => !['PENDING', 'KICKED', 'LEFT', 'REJECTED'].includes(p.status));
  const pendingParticipants = participants.filter(p => p.status === 'PENDING');
  const otherParticipants = activeParticipants.filter(p => p.id !== user?.id);

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await api.put(`/rooms/${roomId}/members/${targetUserId}/role`, { role: newRole });
      updateParticipantRole(targetUserId, newRole);
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleKick = async (targetUserId) => {
    try {
      await api.post(`/rooms/${roomId}/members/${targetUserId}/kick`);
      removeParticipant(targetUserId);
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to kick user', err);
    }
  };

  const handleWaitlist = async (targetUserId, accept) => {
    try {
      await api.post(`/rooms/${roomId}/waitlist/${targetUserId}/${accept ? 'accept' : 'reject'}`);
      if (!accept) {
        removeParticipant(targetUserId);
      } else {
        // Optimistically update to APPROVED so it reflects immediately for the Host
        const updatedParticipants = useRoomStore.getState().participants.map(p =>
          p.id === targetUserId ? { ...p, status: 'APPROVED' } : p
        );
        useRoomStore.getState().setParticipants(updatedParticipants);
      }
    } catch (err) {
      console.error('Failed to process waitlist', err);
    }
  };

  const handleTransferHost = async (newHostId) => {
    try {
      await api.post(`/rooms/${roomId}/transfer-host`, { newHostId });
      setTransferHostModalOpen(false);
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to transfer host', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'CHAT') {
      resetUnreadChat();
    }
  }, [activeTab, resetUnreadChat, unreadChatCount]);

  return (
    <>
      {/* Transfer Host Modal */}
      {transferHostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-white mb-4">Transfer Host Authority</h2>
            <p className="text-sm text-muted-foreground mb-6">Select a participant to transfer your host privileges to. You will become an Editor.</p>
            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {otherParticipants.length === 0 ? (
                <p className="text-sm text-danger italic">No other participants available to transfer to.</p>
              ) : (
                otherParticipants.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleTransferHost(p.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-white font-bold text-sm">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{p.role}</span>
                      </div>
                    </div>
                    <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full font-bold border border-primary/20">Select</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTransferHostModalOpen(false)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon Navigation Slim Bar Island */}
      <div className="w-16 h-full flex flex-col items-center py-4 bg-card rounded-2xl border border-border shadow-sm gap-6 relative shrink-0">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`p-3 rounded-xl transition-colors cursor-pointer ${activeTab === 'USERS' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white hover:bg-background relative'}`}
        >
          <Users size={20} />
        </button>
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`p-3 rounded-xl transition-colors relative cursor-pointer ${activeTab === 'CHAT' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white hover:bg-background'}`}
        >
          <MessageSquare size={20} />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-danger text-[9px] font-bold text-white rounded-full border-2 border-card">
              {unreadChatCount > 9 ? '9+' : unreadChatCount}
            </span>
          )}
        </button>
        {isHost && (
          <button
            onClick={() => setActiveTab('WAITLIST')}
            className={`p-3 rounded-xl transition-colors relative cursor-pointer ${activeTab === 'WAITLIST' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-white hover:bg-background'}`}
          >
            <UserPlus size={20} />
            {pendingParticipants.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-danger text-[9px] font-bold text-white rounded-full border-2 border-card">
                {pendingParticipants.length > 9 ? '9+' : pendingParticipants.length}
              </span>
            )}
          </button>
        )}
        {isHost && (
          <button className="p-3 rounded-xl text-muted-foreground hover:text-white hover:bg-background transition-colors cursor-pointer">
            <Shield size={20} />
          </button>
        )}
      </div>

      {/* Main Sidebar Content Island */}
      <div className="w-64 h-full bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden shrink-0">
        {activeTab === 'USERS' && (
          <>
            <div className="p-4 flex gap-2">
              {isHost ? (
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => {
                      openConfirm(
                        "End Workspace",
                        "Are you sure you want to end this workspace? This will forcefully disconnect all users and delete the session.",
                        "End Workspace",
                        () => api.post(`/rooms/${roomId}/end`).then(() => router.push('/dashboard'))
                      );
                    }}
                    className="w-full py-2 bg-danger/10 text-danger border border-danger/20 rounded-lg text-sm font-bold hover:bg-danger/20 transition-colors"
                  >
                    End Room
                  </button>
                  <button
                    onClick={() => openConfirm(
                      "Host Transfer Required",
                      "You are the host. Please transfer host privileges to another member before leaving.",
                      "Got it",
                      () => setConfirmModalConfig(prev => ({ ...prev, isOpen: false })),
                      true
                    )}
                    className="w-full py-2 bg-background border border-border text-white rounded-lg text-sm font-bold hover:bg-muted transition-colors"
                  >
                    Leave Room
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => openConfirm(
                    "Leave Workspace",
                    "Are you sure you want to leave this workspace? You will need an access code to rejoin.",
                    "Leave Workspace",
                    () => api.delete(`/rooms/${roomId}/leave`).then(() => router.push('/dashboard'))
                  )}
                  className="w-full py-2 bg-background border border-border text-white rounded-lg text-sm font-bold hover:bg-muted transition-colors"
                >
                  Leave Room
                </button>
              )}
            </div>

            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-widest uppercase">Participants</span>
              <span className="w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[10px] text-muted-foreground">
                {activeParticipants.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeParticipants.map((p) => {
                const isMe = p.id === user?.id;
                const showMenu = openMenuId === p.id;

                return (
                  <div key={p.id} className="flex items-center justify-between group relative">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm relative">
                        {p.name.charAt(0).toUpperCase()}
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card rounded-full"></div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {p.name} {isMe && <span className="text-muted-foreground font-normal">(You)</span>}
                        </span>
                        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">{p.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isMe ? (
                        <button
                          onClick={voiceControls?.toggleMic}
                          className="p-1 hover:bg-background rounded transition-colors cursor-pointer"
                        >
                          {voiceControls?.isMicMuted ? (
                            <MicOff size={16} className="text-danger" />
                          ) : (
                            <Mic size={16} className="text-muted-foreground hover:text-white transition-colors" />
                          )}
                        </button>
                      ) : (
                        p.isMuted && <MicOff size={14} className="text-danger/70" />
                      )}

                      {!isMe && isHost && (
                        <button
                          onClick={() => setOpenMenuId(showMenu ? null : p.id)}
                          className="p-1 text-muted-foreground hover:text-white rounded hover:bg-background"
                        >
                          <MoreVertical size={16} />
                        </button>
                      )}
                    </div>

                    {/* Popover Menu for Host */}
                    {showMenu && (
                      <div className="absolute right-0 top-10 w-48 bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="px-3 py-2 border-b border-border text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                          Manage Options
                        </div>
                        <button
                          onClick={() => handleRoleChange(p.id, p.role === 'EDITOR' ? 'VIEWER' : 'EDITOR')}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          Set Role to {p.role === 'EDITOR' ? 'Viewer' : 'Editor'}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              if (p.isMuted) {
                                await api.post(`/rooms/${roomId}/voice/${p.id}/unmute`);
                              } else {
                                await api.post(`/rooms/${roomId}/voice/${p.id}/mute`);
                              }
                              setOpenMenuId(null);
                            } catch (err) {
                              console.error('Failed to toggle mute', err);
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {p.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                        </button>
                        <button
                          onClick={() => {
                            if (p.role === 'EDITOR') {
                              setTransferHostModalOpen(true);
                              setOpenMenuId(null);
                            } else {
                              alert('User must be an EDITOR to become HOST');
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-primary/10 transition-colors"
                        >
                          Transfer Host Authority
                        </button>
                        <button
                          onClick={() => handleKick(p.id)}
                          className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                        >
                          Kick from Workspace
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'WAITLIST' && (
          <div className="flex flex-col h-full">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-widest uppercase">Waiting Room</span>
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                {pendingParticipants.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {pendingParticipants.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground italic mt-4">
                  No pending requests.
                </div>
              ) : (
                pendingParticipants.map(p => (
                  <div key={p.id} className="flex flex-col gap-3 p-3 rounded-xl border border-border bg-background/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Requested to join</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleWaitlist(p.id, true)}
                        className="flex-1 py-1.5 text-xs font-bold bg-success/10 text-success rounded-lg border border-success/20 hover:bg-success/20 transition-colors"
                      >
                        Admit
                      </button>
                      <button
                        onClick={() => handleWaitlist(p.id, false)}
                        className="flex-1 py-1.5 text-xs font-bold bg-danger/10 text-danger rounded-lg border border-danger/20 hover:bg-danger/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'CHAT' && (
          <div className="flex flex-col h-full">
            <div className="px-4 py-4 border-b border-border">
              <span className="text-xs font-bold text-white tracking-widest uppercase">Room Chat</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, idx) => {
                const isMe = msg.userId === user?.id || (!msg.userId && msg.userName === user?.name);
                return (
                  <div key={idx} className={`flex flex-col items-start`}>
                    <span className="text-[10px] text-muted-foreground mb-1 px-1">
                      {isMe ? 'You' : msg.userName}
                    </span>
                    <div className={`px-3 py-2 rounded-xl text-sm max-w-[95%] break-words ${isMe ? 'bg-primary/20 border border-primary/30 text-white rounded-tl-sm' : 'bg-background border border-border text-white rounded-tl-sm'}`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-border">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary cursor-text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    wsHook.sendChatMessage(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
      {/* Generic Confirmation Modal */}
      {confirmModalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6 relative">
            <h2 className="text-xl font-bold text-white mb-2">{confirmModalConfig.title}</h2>
            <p className="text-sm text-muted-foreground mb-6">{confirmModalConfig.message}</p>
            <div className="flex justify-end gap-3">
              {!confirmModalConfig.hideCancel && (
                <button
                  onClick={() => setConfirmModalConfig({ ...confirmModalConfig, isOpen: false })}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-white hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  confirmModalConfig.onConfirm();
                  if (!confirmModalConfig.hideCancel) {
                    setConfirmModalConfig({ ...confirmModalConfig, isOpen: false });
                  }
                }}
                className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-sm transition-colors ${confirmModalConfig.hideCancel ? 'bg-primary hover:bg-primary/90' : 'bg-danger hover:bg-danger/90 shadow-[0_0_15px_rgba(255,76,76,0.3)]'
                  }`}
              >
                {confirmModalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
