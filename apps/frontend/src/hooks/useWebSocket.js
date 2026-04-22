import { useEffect, useRef, useCallback } from 'react';
import { useRoomStore } from '../store/roomStore';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';
import api from '../lib/api';

export const useWebSocket = (roomId) => {
  const ws = useRef(null);
  const { user } = useUserStore();
  const roomStore = useRoomStore();

  const connect = useCallback(() => {
    if (!user || !roomId) return;

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
          if (body.code !== undefined && body.code !== roomStore.code) {
            roomStore.setCode(body.code);
          }
          if (body.language && body.language !== roomStore.language) {
            roomStore.setLanguage(body.language);
          }
        }
        else if (destination === 'chat') {
          roomStore.addChatMessage(body);
          roomStore.incrementUnreadChat();
        }
        else if (destination === 'cursor') {
          roomStore.updateCursor(body.userId, { line: body.line, column: body.column, userName: body.userName, color: body.color });
        }
        else if (destination === 'testcases.sync') {
          roomStore.setTestCases(body);
        }
        else if (destination === 'execution.status') {
          roomStore.setIsExecuting(body.status === 'RUNNING');
          if (body.status === 'RUNNING') {
            roomStore.setActiveOutputTab('OUTPUT');
          }
          if (body.output) {
            roomStore.setOutput(body.output);
          }
        }
        else if (destination === 'execution.sync') {
          roomStore.setOutput(body);
          roomStore.setIsExecuting(false);
          roomStore.setActiveOutputTab('OUTPUT');
        }
        else if (destination === 'waitlist.status') {
          if (body === 'ACCEPTED') {
            useNotificationStore.getState().addNotification('Your join request was approved!', 'success');
            setTimeout(() => window.location.reload(), 1000);
          } else {
            useNotificationStore.getState().addNotification('Your request to join the workspace was rejected by the host.', 'error');
            setTimeout(() => { window.location.href = '/dashboard?alert=rejected'; }, 1000);
          }
        }
        else if (destination === 'waitlist') {
          fetchRoomMembers();
        }
        else if (destination === 'roles') {
          fetchRoomMembers();
          if (body.targetUserId === user?.id) {
            useNotificationStore.getState().addNotification(`Your role has been changed to ${body.role}`, 'info');
          }
        }
        else if (destination === 'kick') {
          if (body === user?.id) {
            useNotificationStore.getState().addNotification("You have been kicked from the workspace.", 'error');
            setTimeout(() => { window.location.href = '/dashboard?alert=kicked'; }, 1500);
          } else {
            fetchRoomMembers();
          }
        }
        else if (destination === 'host_transfer') {
          fetchRoomMembers();
          if (body === user?.id) {
            useNotificationStore.getState().addNotification("You have been granted HOST authority.", 'success');
          }
        }
        else if (destination === 'members.join') {
          fetchRoomMembers();
          useNotificationStore.getState().addNotification("A new member joined the workspace.", 'info');
        }
        else if (destination === 'members.leave') {
          fetchRoomMembers();
          useNotificationStore.getState().addNotification("A member left the workspace.", 'warning');
        }
        else if (destination === 'end' && body === 'ROOM_ENDED_BY_HOST') {
          useNotificationStore.getState().addNotification("The host has ended this workspace.", 'error');
          setTimeout(() => { window.location.href = '/dashboard'; }, 1000);
        }
        else if (destination === 'time.extended') {
          useRoomStore.getState().setExpiresAt(body);
          useNotificationStore.getState().addNotification("Session time was extended by the host!", 'success');
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
  }, [roomId, user]);

  const fetchRoomMembers = async () => {
    try {
      const res = await api.get(`/rooms/${roomId}`);
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

  const sendExecutionStatus = (status, output = null) => {
    sendAction('EXECUTION_STATUS_SYNC', { status, output });
  };

  const sendExecutionResult = (result) => {
    sendAction('EXECUTION_SYNC', result);
  };

  return {
    sendCodeChange,
    sendCursorMove,
    sendChatMessage,
    sendTestCasesSync,
    sendExecutionStatus,
    sendExecutionResult,
    fetchRoomMembers
  };
};
