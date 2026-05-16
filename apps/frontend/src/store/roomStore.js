import { create } from 'zustand';

export const useRoomStore = create((set, get) => ({
  // State
  roomId: null,
  roomName: 'Workspace',
  isActive: true,
  expiresAt: null,
  code: '',
  language: 'java',
  languageCache: {},
  testCases: [],
  output: null,
  activeOutputTab: 'TEST_CASES',
  showOutputPanel: true,
  isWhiteboardOpen: false,
  whiteboardData: null,
  participants: [],
  chatMessages: [],
  logs: [],
  unreadChatCount: 0,
  cursors: {},
  isExecuting: false,
  executingUser: null,
  executionProgress: null,
  sessionEndedReason: null,
  roleChangeAlert: null,
  hostTransferAlert: null,

  // UI setters
  setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),
  setShowOutputPanel: (show) => set({ showOutputPanel: show }),
  setSessionEndedReason: (reason) => set({ sessionEndedReason: reason }),
  setRoleChangeAlert: (alert) => set({ roleChangeAlert: alert }),
  setHostTransferAlert: (alert) => set({ hostTransferAlert: alert }),
  setIsWhiteboardOpen: (isOpen) => set({ isWhiteboardOpen: isOpen }),
  setWhiteboardData: (data) => set({ whiteboardData: data }),

  // Room info
  setRoomInfo: (id, name, expiresAt = null, isActive = true) => set({ roomId: id, roomName: name, expiresAt, isActive }),
  setExpiresAt: (expiresAt) => set({ expiresAt }),

  // Code & language
  setCode: (code) => set((state) => ({
    code,
    languageCache: { ...state.languageCache, [state.language]: code }
  })),
  selectedCode: '',
  setSelectedCode: (code) => set({ selectedCode: code }),
  precedingCode: '',
  setPrecedingCode: (code) => set({ precedingCode: code }),
  setLanguage: (language) => set({ language }),
  setLanguageCache: (cache) => set({ languageCache: cache }),

  // Participants
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) => set((state) => ({
    participants: [...state.participants.filter(p => p.id !== participant.id), participant]
  })),
  removeParticipant: (userId) => set((state) => ({
    participants: state.participants.filter(p => p.id !== userId)
  })),

  updateParticipantRole: (userId, role) => set((state) => ({
    participants: state.participants.map(p => p.id === userId ? { ...p, role } : p)
  })),

  updateParticipantMute: (userId, isMuted) => set((state) => ({
    participants: state.participants.map(p => p.id === userId ? { ...p, isMuted } : p)
  })),

  // Chat & logs
  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  
  setLogs: (logs) => set({ logs }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  
  incrementUnreadChat: () => set((state) => {
    const newCount = state.unreadChatCount + 1;
    if (state.roomId) localStorage.setItem(`unread_${state.roomId}`, newCount);
    return { unreadChatCount: newCount };
  }),
  resetUnreadChat: () => set((state) => {
    if (state.roomId) localStorage.removeItem(`unread_${state.roomId}`);
    return { unreadChatCount: 0 };
  }),
  setUnreadChatCount: (count) => set({ unreadChatCount: count }),

  // Cursors
  setCursors: (cursors) => set({ cursors }),
  updateCursor: (userId, pos) => set((state) => ({
    cursors: { ...state.cursors, [userId]: pos }
  })),
  removeCursor: (userId) => set((state) => {
    const newCursors = { ...state.cursors };
    delete newCursors[userId];
    return { cursors: newCursors };
  }),

  // Test cases & execution
  setTestCases: (testCases) => set({ testCases }),
  addTestCase: (tc) => set((state) => ({ testCases: [...state.testCases, tc] })),

  setOutput: (output) => set({ output }),
  setIsExecuting: (isExecuting, executingUser = null) => set({ isExecuting, executingUser }),
  setExecutionProgress: (progress) => set({ executionProgress: progress }),

  // Reset
  resetRoom: () => set({
    roomId: null,
    roomName: 'Workspace',
    expiresAt: null,
    code: '',
    language: 'java',
    languageCache: {},
    testCases: [],
    output: null,
    activeOutputTab: 'TEST_CASES',
    showOutputPanel: true,
    participants: [],
    chatMessages: [],
    logs: [],
    unreadChatCount: 0,
    cursors: {},
    isExecuting: false,
    executingUser: null,
    executionProgress: null,
    sessionEndedReason: null,
    roleChangeAlert: null,
    hostTransferAlert: null,
    isWhiteboardOpen: false,
    whiteboardData: null,
  }),
}));
