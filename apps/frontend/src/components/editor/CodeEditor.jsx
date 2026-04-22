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
  const isViewer = currentUserParticipant?.role === 'VIEWER';

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
  };

  const handleEditorChange = (value) => {
    if (isViewer) return;
    setCode(value);

    // Immediate sync as requested
    wsHook.sendCodeChange(value, language);
  };

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
          border-left: 2px solid #00D4AA;
          position: absolute;
          z-index: 10;
        }
      `}</style>
    </div>
  );
}
