import { useEffect, useState, useRef } from 'react';
import api from '../lib/api';

export const useVoice = (roomId, user, isActive = true) => {
  const [isMicMuted, setIsMicMuted] = useState(true);
  const clientRef = useRef(null);
  const localAudioTrackRef = useRef(null);

  useEffect(() => {
    if (!roomId || !user || !isActive) return;

    let mounted = true;

    const initAgora = async () => {
      try {
        // Hit the secure Next.js Backend node relay instead of Java to utilize the isolated NPM crypto hashing
        const tokenResponse = await fetch('/api/agora/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, userId: user.id })
        });

        const resData = await tokenResponse.json();
        const token = resData.token;
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();

        console.log('Agora Init Check:', { actualAppId: appId, tokenLength: token?.length });
        if (appId !== '38e24f8afa2042e19f63e62bd63d9a63') {
          alert('Next.js is STILL caching your old App ID! It is currently passing: ' + appId + '. Please delete the .next folder and run npm run dev again.');
        }

        if (!appId || !token) {
          console.warn('Agora credentials missing. Voice chat disabled.');
          return;
        }

        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        
        // Disable internal Agora console logs (4 = NONE)
        AgoraRTC.setLogLevel(4);
        // Prevent Agora from sending telemetry to statscollector endpoints (stops Adblocker blocked errors)
        AgoraRTC.disableLogUpload();

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on('user-published', async (remoteUser, mediaType) => {
          await client.subscribe(remoteUser, mediaType);
          if (mediaType === 'audio') {
            remoteUser.audioTrack?.play();
          }
        });

        if (!mounted) return;

        // Use string user ID because we built the token using buildTokenWithUserAccount
        await client.join(appId, roomId, token, user.id);

        if (!mounted) {
          await client.leave();
          return;
        }

        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await localAudioTrack.setMuted(true); // Default to muted
        localAudioTrackRef.current = localAudioTrack;

        if (mounted) {
          await client.publish([localAudioTrack]);
        } else {
          localAudioTrack.close();
          await client.leave();
        }

      } catch (err) {
        if (mounted) console.error('Agora Init Error', err);
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

  const toggleMic = async () => {
    if (localAudioTrackRef.current) {
      const newMutedState = !isMicMuted;
      await localAudioTrackRef.current.setMuted(newMutedState);
      setIsMicMuted(newMutedState);
    }
  };

  const forceMute = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setMuted(true);
      setIsMicMuted(true);
    }
  };

  const forceUnmute = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setMuted(false);
      setIsMicMuted(false);
    }
  };

  return { isMicMuted, toggleMic, forceMute, forceUnmute };
};
