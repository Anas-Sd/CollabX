'use client';
import { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';

export default function CodeEditor({ wsHook }) {
  const { code, setCode, language, cursors } = useRoomStore();
  const { user } = useUserStore();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const cursorDecorationsRef = useRef([]);

  const currentUserParticipant = useRoomStore((state) => state.participants.find(p => p.id === user?.id));
  const isActive = useRoomStore((state) => state.isActive);
  const isViewer = !isActive || currentUserParticipant?.role === 'VIEWER';

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
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

    // Handle cursor moves
    editor.onDidChangeCursorPosition((e) => {
      if (isViewer) return; // Viewers shouldn't broadcast cursor unless desired, but usually they don't edit
      const position = e.position;
      wsHook.sendCursorMove(position.lineNumber, position.column, user?.name || 'Anonymous', '#6C63FF');
    });

    // Handle text selection for SQL execution
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      const selectedText = editor.getModel().getValueInRange(selection);
      
      // Get everything from line 1, col 1 up to the start of the selection
      const precedingRange = new monacoRef.current.Range(1, 1, selection.startLineNumber, selection.startColumn);
      const precedingText = editor.getModel().getValueInRange(precedingRange);

      useRoomStore.getState().setSelectedCode(selectedText);
      useRoomStore.getState().setPrecedingCode(precedingText);
    });
  };

  const handleEditorChange = (value) => {
    if (isViewer) return;
    
    setCode(value);

    // Immediate sync as requested
    wsHook.sendCodeChange(value, language);
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    
    // Add event listener for attempted edits in read-only mode
    const disposable = editorRef.current.onDidAttemptReadOnlyEdit(() => {
      import('../../store/notificationStore').then(({ useNotificationStore }) => {
        useNotificationStore.getState().addNotification('You do not have permission to edit code', 'error');
      });
    });

    return () => disposable.dispose();
  }, []);

  // Render remote cursors
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const decorations = [];

    Object.entries(cursors).forEach(([userId, cursorInfo]) => {
      if (userId === user?.id?.toString()) return; // Don't render own cursor

      decorations.push({
        range: new monacoRef.current.Range(cursorInfo.line, cursorInfo.column, cursorInfo.line, cursorInfo.column),
        options: {
          className: 'remote-cursor',
          hoverMessage: { value: cursorInfo.userName },
          beforeContentClassName: 'remote-cursor-label',
        }
      });
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
      <style jsx global>{`
        .remote-cursor {
          border-left: 2px solid #F5A623;
          position: absolute;
          z-index: 10;
          padding-right: 8px; /* Creates an invisible hit area for easier hovering */
          cursor: pointer;
        }
        
        /* Dynamic Cursor Tooltips */
        ${Object.entries(cursors).map(([userId, cursorInfo]) => `
          .remote-cursor-${userId}::before {
             content: '${cursorInfo.userName}';
             position: absolute;
             top: -22px;
             left: -2px;
             background: ${cursorInfo.color || '#F5A623'};
             color: black;
             font-size: 10px;
             font-weight: bold;
             font-family: sans-serif;
             padding: 2px 6px;
             border-radius: 4px;
             border-bottom-left-radius: 0;
             white-space: nowrap;
             opacity: 0;
             transition: opacity 0.2s ease-in-out;
             pointer-events: none;
             box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }
          .remote-cursor-${userId}:hover::before {
             opacity: 1;
          }
        `).join('\n')}
      `}</style>
    </div>
  );
}
