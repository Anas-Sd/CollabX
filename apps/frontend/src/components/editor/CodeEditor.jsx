'use client';
import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';

// Color palette for remote cursors — one per user, consistent via hash
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

  const currentUserParticipant = useRoomStore((state) => state.participants.find(p => p.id === user?.id));
  const isActive = useRoomStore((state) => state.isActive);
  const isViewer = !isActive || currentUserParticipant?.role === 'VIEWER';

  // Create a real <style> tag in document.head so CSS actually reaches Monaco's DOM
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

  // Rebuild CSS whenever cursors map changes
  useEffect(() => {
    if (!styleElRef.current) return;

    const css = Object.entries(cursors).map(([userId, cursorInfo]) => {
      const color = getUserColor(userId);
      // Escape single quotes in names for CSS content property
      const name = (cursorInfo.userName || 'Unknown').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `
        /* Cursor line for user ${userId} */
        .rcursor-${userId} {
          border-left: 2px solid ${color} !important;
          margin-left: -1px;
          position: relative;
        }
        /* Name badge shown always (not just on hover) */
        .rcursor-label-${userId}::after {
          content: '${name}';
          position: absolute;
          top: -20px;
          left: -1px;
          background-color: ${color};
          color: #000000;
          font-size: 10px;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          padding: 1px 7px;
          border-radius: 4px 4px 4px 0px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 9999;
          line-height: 18px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }
      `;
    }).join('\n');

    styleElRef.current.textContent = css;
  }, [cursors]);

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
      }
    });
    monaco.editor.setTheme('collabx-dark');

    // Broadcast own cursor position on every move
    editor.onDidChangeCursorPosition((e) => {
      if (isViewer) return;
      const { lineNumber, column } = e.position;
      wsHook?.sendCursorMove(lineNumber, column, user?.name || 'Anonymous', getUserColor(user?.id));
    });

    // Track selection for SQL/code execution helpers
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      const model = editor.getModel();
      if (!model) return;
      const selectedText = model.getValueInRange(selection);
      const precedingRange = new monaco.Range(1, 1, selection.startLineNumber, selection.startColumn);
      const precedingText = model.getValueInRange(precedingRange);
      useRoomStore.getState().setSelectedCode(selectedText);
      useRoomStore.getState().setPrecedingCode(precedingText);
    });
  };

  const handleEditorChange = (value) => {
    if (isViewer) return;
    setCode(value);
    wsHook?.sendCodeChange(value, language);
  };

  // Read-only edit notification
  useEffect(() => {
    if (!editorRef.current) return;
    const disposable = editorRef.current.onDidAttemptReadOnlyEdit(() => {
      import('../../store/notificationStore').then(({ useNotificationStore }) => {
        useNotificationStore.getState().addNotification('You do not have permission to edit code', 'error');
      });
    });
    return () => disposable.dispose();
  }, []);

  // Apply Monaco decorations for each remote cursor
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = Object.entries(cursors)
      .filter(([userId]) => String(userId) !== String(user?.id))
      .map(([userId, cursorInfo]) => {
        const line = Math.max(1, cursorInfo.line || 1);
        const col = Math.max(1, cursorInfo.column || 1);
        return {
          range: new monacoRef.current.Range(line, col, line, col),
          options: {
            // Draws the colored vertical bar
            className: `rcursor-${userId}`,
            // Draws the name badge above via CSS ::after
            afterContentClassName: `rcursor-label-${userId}`,
            stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        };
      });

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
