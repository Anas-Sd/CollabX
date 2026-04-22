import { useEffect, useState, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import api from '../lib/api';

export const useVoice = (roomId, user) => {
  const [isMicMuted, setIsMicMuted] = useState(false);
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);

  useEffect(() => {
    if (!roomId || !user) return;

    let mounted = true;

    const initAgora = async () => {
      try {
        // Fetch Agora token from our backend
        const res = await api.get(`/rooms/${roomId}/agora-token`);
        const token = res.data.token;
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;

        if (!appId || !token) {
          console.warn('Agora credentials missing. Voice chat disabled.');
          return;
        }

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on('user-published', async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play();
          }
        });

        // Use user ID hash or raw string if supported by Agora configuration
        await client.join(appId, roomId, token, user.id);

        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = localAudioTrack;
        await client.publish([localAudioTrack]);

      } catch (err) {
        console.error('Agora Init Error', err);
      }
    };

    initAgora();

    return () => {
      mounted = false;
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.close();
      }
      if (clientRef.current) {
        clientRef.current.leave();
      }
    };
  }, [roomId, user]);

  const toggleMic = () => {
    if (localAudioTrackRef.current) {
      const currentMuted = !isMicMuted;
      localAudioTrackRef.current.setEnabled(!currentMuted);
      setIsMicMuted(currentMuted);
    }
  };

  const forceMute = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(false);
      setIsMicMuted(true);
    }
  };

  const forceUnmute = () => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.setEnabled(true);
      setIsMicMuted(false);
    }
  };

  return { isMicMuted, toggleMic, forceMute, forceUnmute };
};
