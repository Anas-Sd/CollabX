import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '../store/roomStore';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';
import api from '../lib/api';

export const useWebSocket = (roomId) => {
  const ws = useRef(null);
  const { user } = useUserStore();
  const roomStore = useRoomStore();
  const isActive = useRoomStore((state) => state.isActive);

  const connect = useCallback(() => {
    if (!user || !roomId || !isActive) return;
    if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) return;

    const token = localStorage.getItem('token');
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

    const socket = new WebSocket(`${wsUrl}/ws?token=${token}&roomId=${roomId}`);
    ws.current = socket;

    socket.onopen = () => {
      console.log('WS Connected');
      // Backend automatically adds to room based on roomId param
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { destination, body } = data;

        if (destination === 'code.change') {
          const state = useRoomStore.getState();
          if (body.language && body.language !== state.language) {
            state.setLanguage(body.language);
          }
          if (body.code !== undefined && body.code !== state.code) {
            state.setCode(body.code);
          }
        }
        else if (destination === 'chat') {
          useRoomStore.getState().addChatMessage(body);
          useRoomStore.getState().incrementUnreadChat();
        }
        else if (destination === 'logs') {
          useRoomStore.getState().addLog(body);
          useNotificationStore.getState().addNotification('DEBUG: Log received via WebSocket: ' + body.action, 'success');
        }
        else if (destination === 'cursor') {
          useRoomStore.getState().updateCursor(body.userId, { line: body.line, column: body.column, userName: body.userName, color: body.color });
        }
        else if (destination === 'testcases.sync') {
          useRoomStore.getState().setTestCases(body);
        }
        else if (destination === 'execution.status') {
          const state = useRoomStore.getState();
          state.setIsExecuting(body.status === 'RUNNING', body.executorName);
          if (body.status === 'RUNNING') {
            state.setActiveOutputTab('OUTPUT');
            state.setShowOutputPanel(true);
            state.setOutput(null);
            state.setExecutionProgress(null);
          }
          if (body.output) {
            state.setOutput(body.output);
          }
        }
        else if (destination === 'execution.progress') {
          useRoomStore.getState().setExecutionProgress(body);
        }
        else if (destination === 'execution.sync') {
          const state = useRoomStore.getState();
          state.setOutput(body);
          state.setIsExecuting(false);
          state.setActiveOutputTab('OUTPUT');
          state.setShowOutputPanel(true);
        }
        else if (destination === 'waitlist.status') {
          if (body === 'ACCEPTED') {
            localStorage.setItem('roomAlert', JSON.stringify({ title: 'Join Approved', message: 'The host has approved your request. Welcome to the workspace!' }));
            setTimeout(() => window.location.reload(), 1000);
          } else {
            localStorage.setItem('dashboardAlert', JSON.stringify({ title: 'Access Denied', message: 'Your request to join the workspace was rejected by the host.' }));
            setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
          }
        }
        else if (destination === 'waitlist') {
          setTimeout(fetchRoomMembers, 500);
        }
        else if (destination === 'roles') {
          setTimeout(fetchRoomMembers, 500);
          if (body?.targetUserId === user?.id) {
            useRoomStore.getState().setRoleChangeAlert({
              role: body.role
            });
          }
        }
        else if (destination === 'kick') {
          if (body === user?.id) {
            localStorage.setItem('dashboardAlert', JSON.stringify({ title: 'You were kicked', message: 'The host has removed you from the workspace.' }));
            setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
          } else {
            // Immediately remove from local store so UI updates instantly
            useRoomStore.getState().removeParticipant(body);
            useRoomStore.getState().removeCursor(body);
            setTimeout(fetchRoomMembers, 500);
          }
        }
        else if (destination === 'host_transfer') {
          setTimeout(fetchRoomMembers, 500);
          if (body === user?.id) {
            useRoomStore.getState().setHostTransferAlert(true);
          }
        }
        else if (destination === 'members.join') {
          setTimeout(fetchRoomMembers, 500);
          useNotificationStore.getState().addNotification("A new member joined the workspace.", 'info');
        }
        else if (destination === 'members.leave') {
          setTimeout(fetchRoomMembers, 500);
          useNotificationStore.getState().addNotification("A member left the workspace.", 'warning');
        }
        else if (destination === 'refresh.all') {
          setTimeout(fetchRoomMembers, 500);
        }
        else if (destination === 'voice') {
          useRoomStore.getState().updateParticipantMute(body.targetUserId, body.isMuted);
          if (body.targetUserId === user?.id) {
            useNotificationStore.getState().addNotification(
              body.isMuted ? "The host has muted your microphone." : "The host has unmuted your microphone.",
              body.isMuted ? 'warning' : 'success'
            );
          }
        }
        else if (destination === 'end' && body === 'ROOM_ENDED_BY_HOST') {
          // Guard: if user is already off the room page (i.e. the host who redirected
          // themselves), skip — otherwise a full reload wipes the popup on the dashboard.
          setTimeout(() => {
            if (!window.location.pathname.startsWith('/room/')) return;
            localStorage.setItem('dashboardAlert', JSON.stringify({
              title: "Workspace Terminated",
              message: "The Host has forcefully closed this Workspace for all members."
            }));
            window.location.href = '/dashboard';
          }, 1000);
        }
        else if (destination === 'time.extended') {
          useRoomStore.getState().setExpiresAt(body);
          useNotificationStore.getState().addNotification("Session time was extended by the host!", 'success');
        }
        else if (destination === 'whiteboard.toggle') {
          useRoomStore.getState().setIsWhiteboardOpen(body.isOpen);
        }
        else if (destination === 'whiteboard.sync') {
          useRoomStore.getState().setWhiteboardData(body.data);
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    socket.onclose = () => {
      console.log('WS Disconnected');
      if (ws.current === socket) {
        setTimeout(connect, 3000);
      }
    };

    return () => {
      socket.onclose = null; // Prevent reconnect on unmount
      socket.close();
      if (ws.current === socket) {
        ws.current = null;
      }
    };
  }, [roomId, user, isActive]);

  const fetchRoomMembers = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}?t=${new Date().getTime()}`);
      if (res.data && res.data.members) {
        useRoomStore.getState().setParticipants(res.data.members);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const sendAction = (action, payload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, payload }));
    }
  };

  const sendCodeChange = (code, language) => {
    sendAction('CODE_CHANGE', { code, language });
  };

  const sendCursorMove = (line, column, userName, color) => {
    sendAction('CURSOR_MOVE', { userId: user?.id, line, column, userName, color });
  };

  const sendChatMessage = (message) => {
    sendAction('CHAT_SEND', { message });
  };

  const sendTestCasesSync = (testCases) => {
    sendAction('TEST_CASES_SYNC', testCases);
  };

  const sendExecutionStatus = (status, output = null, executorName = null) => {
    sendAction('EXECUTION_STATUS_SYNC', { status, output, executorName });
  };

  const sendExecutionResult = (result) => {
    sendAction('EXECUTION_SYNC', result);
  };

  const triggerGlobalRefresh = () => {
    sendAction('FORCE_REFRESH', {});
  };

  const sendActionTrigger = (type) => {
    sendAction('ACTION_TRIGGER', { userId: user?.id, type });
  };

  const sendWhiteboardToggle = (isOpen) => {
    sendAction('WHITEBOARD_TOGGLE', { isOpen });
  };

  const sendWhiteboardSync = (data) => {
    sendAction('WHITEBOARD_SYNC', { data });
  };

  return {
    sendCodeChange,
    sendCursorMove,
    sendChatMessage,
    sendTestCasesSync,
    sendExecutionStatus,
    sendExecutionResult,
    triggerGlobalRefresh,
    sendActionTrigger,
    sendWhiteboardToggle,
    sendWhiteboardSync,
    fetchRoomMembers
  };
};
