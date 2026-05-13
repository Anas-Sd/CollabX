'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRoomStore } from '../../store/roomStore';
import { useUserStore } from '../../store/userStore';
import '@excalidraw/excalidraw/index.css';

// Excalidraw must be dynamically imported with ssr: false
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

export default function Whiteboard({ wsHook }) {
  const { whiteboardData, isActive, participants } = useRoomStore();
  const { user } = useUserStore();
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  
  const lastReceivedDataRef = useRef(whiteboardData);
  const syncTimeoutRef = useRef(null);

  const [initialData] = useState(() => {
    if (whiteboardData) {
      try {
        const parsed = JSON.parse(whiteboardData);
        return { elements: parsed.elements };
      } catch (e) {
        console.error("Failed to parse initial whiteboard data", e);
      }
    }
    return null;
  });

  const currentUserParticipant = participants.find(p => p.id === user?.id);
  const isViewer = currentUserParticipant?.role === 'VIEWER';
  
  // Can only edit if room is active and user is not a viewer
  const viewModeEnabled = !isActive || isViewer;

  useEffect(() => {
    if (excalidrawAPI && whiteboardData && whiteboardData !== lastReceivedDataRef.current) {
      try {
        console.log("Receiving whiteboard sync", whiteboardData.substring(0, 50));
        const parsedData = JSON.parse(whiteboardData);
        if (parsedData.elements) {
          lastReceivedDataRef.current = whiteboardData;
          excalidrawAPI.updateScene({ elements: parsedData.elements });
        }
      } catch (err) {
        console.error("Failed to parse incoming whiteboard data", err);
      }
    }
  }, [whiteboardData, excalidrawAPI]);

  const handleChange = (elements, appState, files) => {
    if (viewModeEnabled) return;
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (elements && elements.length > 0) {
        const dataStr = JSON.stringify({ elements });
        if (dataStr !== lastReceivedDataRef.current) {
          console.log("Sending whiteboard sync", dataStr.substring(0, 50));
          lastReceivedDataRef.current = dataStr;
          useRoomStore.getState().setWhiteboardData(dataStr);
          if (wsHook && wsHook.sendWhiteboardSync) {
            wsHook.sendWhiteboardSync(dataStr);
          }
        }
      }
    }, 500);
  };

  return (
    <div className="absolute inset-0 bg-[#0A0A0F]" style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialData}
        onChange={handleChange}
        viewModeEnabled={viewModeEnabled}
        theme="dark"
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: false,
            clearCanvas: !viewModeEnabled,
            loadScene: false,
            saveToActiveFile: false,
          }
        }}
      />
    </div>
  );
}
