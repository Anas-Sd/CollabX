'use client';
import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';

const CURSOR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#F5A623', '#DDA0DD', '#98FB98', '#F08080'];

function getUserColor(userId) {
  const hash = String(userId).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

export default function CodeEditor({ wsHook }) {
  const { code, setCode, language, cursors } = useRoomStore();
  const { user } = useUserStore();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const cursorDecorationsRef = useRef([]);
  const styleElRef = useRef(null);
  const idleTimersRef = useRef({});

  // ── Refs to prevent stale closures inside Monaco event handlers ──
  const wsHookRef = useRef(wsHook);
  const userRef = useRef(user);
  const isViewerRef = useRef(false);

  const currentUserParticipant = useRoomStore(
    (state) => state.participants.find((p) => p.id === user?.id)
  );
  const isActive = useRoomStore((state) => state.isActive);
  const isViewer = !isActive || currentUserParticipant?.role === 'VIEWER';

  // Keep refs in sync with latest values every render
  useEffect(() => { wsHookRef.current = wsHook; }, [wsHook]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { isViewerRef.current = isViewer; }, [isViewer]);

  // Inject a real <style> element into document.head (JSX style tags don't reach Monaco DOM)
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'collabx-remote-cursors';
    document.head.appendChild(style);
    styleElRef.current = style;
    return () => {
      if (styleElRef.current && document.head.contains(styleElRef.current)) {
        document.head.removeChild(styleElRef.current);
      }
    };
  }, []);

  // Rebuild CSS whenever cursors change (includes idle flag)
  useEffect(() => {
    if (!styleElRef.current) return;
    const css = Object.entries(cursors)
      .filter(([userId]) => String(userId) !== String(user?.id))
      .map(([userId, info]) => {
        const color = getUserColor(userId);
        const name = (info.userName || 'Unknown').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `
          .rcursor-${userId} {
            border-left: 2px solid ${color} !important;
            margin-left: -1px;
            position: relative;
          }
          .rcursor-label-${userId}::after {
            content: '${name}';
            position: absolute;
            top: -20px;
            left: -1px;
            background-color: ${color};
            color: #000;
            font-size: 10px;
            font-weight: 700;
            font-family: 'Inter', sans-serif;
            padding: 1px 7px;
            border-radius: 4px 4px 4px 0;
            white-space: nowrap;
            pointer-events: none;
            z-index: 9999;
            line-height: 18px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            opacity: ${info.isIdle ? 0 : 1};
            transition: opacity 0.4s ease;
          }
        `;
      }).join('\n');
    styleElRef.current.textContent = css;
  }, [cursors, user]);

  // 3-second idle detection: hide label after inactivity, show on next move
  useEffect(() => {
    Object.entries(cursors).forEach(([userId, info]) => {
      if (String(userId) === String(user?.id)) return;
      if (info.isIdle) return; // already idle, don't restart timer

      if (idleTimersRef.current[userId]) clearTimeout(idleTimersRef.current[userId]);

      idleTimersRef.current[userId] = setTimeout(() => {
        const latest = useRoomStore.getState().cursors[userId];
        if (latest && !latest.isIdle) {
          useRoomStore.getState().updateCursor(userId, { ...latest, isIdle: true });
        }
      }, 3000);
    });

    // Clean up timers for users who left
    Object.keys(idleTimersRef.current).forEach((userId) => {
      if (!cursors[userId]) {
        clearTimeout(idleTimersRef.current[userId]);
        delete idleTimersRef.current[userId];
      }
    });
  }, [cursors, user]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.editor.defineTheme('collabx-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0A0A0F',
        'editor.lineHighlightBackground': '#111118',
        'editorLineNumber.foreground': '#6B6B80',
        'editorIndentGuide.background': '#1E1E2E',
      },
    });
    monaco.editor.setTheme('collabx-dark');

    // Use refs — not closure variables — so these always read the latest values
    editor.onDidChangeCursorPosition((e) => {
      if (isViewerRef.current) return;
      const { lineNumber, column } = e.position;
      wsHookRef.current?.sendCursorMove(
        lineNumber,
        column,
        userRef.current?.name || 'Anonymous',
        getUserColor(userRef.current?.id)
      );
    });

    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      if (!model) return;
      const sel = e.selection;
      useRoomStore.getState().setSelectedCode(model.getValueInRange(sel));
      useRoomStore.getState().setPrecedingCode(
        model.getValueInRange(new monaco.Range(1, 1, sel.startLineNumber, sel.startColumn))
      );
    });

    // Override Monaco's native "Cannot edit in read-only editor" text only
    const domNode = editor.getDomNode();
    if (domNode) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            const overlay = node.classList?.contains('monaco-editor-overlaymessage')
              ? node
              : node.querySelector?.('.monaco-editor-overlaymessage');
            if (!overlay) return;
            const textEl = overlay.querySelector('.message');
            if (textEl) {
              const active = useRoomStore.getState().isActive;
              textEl.textContent = active ? 'Viewers cannot edit' : 'Workspace ended \u2014 cannot edit';
            }
          });
        });
      });
      observer.observe(domNode, { childList: true, subtree: true });
    }
  };

  const handleEditorChange = (value) => {
    if (isViewer) return;
    setCode(value);
    wsHook?.sendCodeChange(value, language);
  };


  // Apply Monaco decorations for every remote cursor (skip own)
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = Object.entries(cursors)
      .filter(([userId]) => String(userId) !== String(user?.id))
      .map(([userId, info]) => ({
        range: new monacoRef.current.Range(
          Math.max(1, info.line || 1),
          Math.max(1, info.column || 1),
          Math.max(1, info.line || 1),
          Math.max(1, info.column || 1)
        ),
        options: {
          className: `rcursor-${userId}`,
          afterContentClassName: `rcursor-label-${userId}`,
          stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      }));

    cursorDecorationsRef.current = editorRef.current.deltaDecorations(
      cursorDecorationsRef.current,
      decorations
    );
  }, [cursors, user]);

  return (
    <div className="w-full h-full relative">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="collabx-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly: isViewer,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontSize: 14,
          minimap: { enabled: true },
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
        }}
      />
    </div>
  );
}
