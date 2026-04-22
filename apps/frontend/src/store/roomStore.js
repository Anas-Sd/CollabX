import { create } from 'zustand';

export const useRoomStore = create((set, get) => ({
  roomId: null,
  roomName: 'Workspace',
  code: '',
  language: 'java',
  testCases: [],
  output: null,
  activeOutputTab: 'TEST_CASES',
  participants: [],
  chatMessages: [],
  unreadChatCount: 0,
  cursors: {},
  isExecuting: false,

  setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),

  setRoomInfo: (id, name) => set({ roomId: id, roomName: name }),

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),

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

  addChatMessage: (msg) => set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  incrementUnreadChat: () => set((state) => ({ unreadChatCount: state.unreadChatCount + 1 })),
  resetUnreadChat: () => set({ unreadChatCount: 0 }),

  setCursors: (cursors) => set({ cursors }),
  updateCursor: (userId, pos) => set((state) => ({
    cursors: { ...state.cursors, [userId]: pos }
  })),
  removeCursor: (userId) => set((state) => {
    const newCursors = { ...state.cursors };
    delete newCursors[userId];
    return { cursors: newCursors };
  }),

  setTestCases: (testCases) => set({ testCases }),
  addTestCase: (tc) => set((state) => ({ testCases: [...state.testCases, tc] })),

  setOutput: (output) => set({ output }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),

  resetRoom: () => set({
    roomId: null,
    roomName: 'Workspace',
    code: '',
    language: 'java',
    testCases: [],
    output: null,
    activeOutputTab: 'TEST_CASES',
    participants: [],
    chatMessages: [],
    unreadChatCount: 0,
    cursors: {},
    isExecuting: false,
  }),
}));
