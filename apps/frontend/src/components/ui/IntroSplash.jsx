"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { usePathname } from 'next/navigation';

const playfair = Playfair_Display({ subsets: ['latin'], weight: '900', style: 'italic' });

export default function IntroSplash() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMountRef = useRef(true);

  // ── Electrical flicker + slam sound via Web Audio API ───────────────────────
  const playZapSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;

      // ── PHASE 1: Rapid electrical flickers (matches ghost X stutter at 0s) ──
      // Fire 4 quick crackle bursts to simulate the flickering ghost X's
      const flickerTimes = [0, 0.05, 0.12, 0.20];
      flickerTimes.forEach((offset) => {
        // Crackle oscillator burst
        const fOsc = ctx.createOscillator();
        const fGain = ctx.createGain();
        fOsc.type = 'sawtooth';
        fOsc.frequency.setValueAtTime(1800 - offset * 1000, now + offset);
        fOsc.frequency.exponentialRampToValueAtTime(300, now + offset + 0.04);
        fGain.gain.setValueAtTime(0.22, now + offset);
        fGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.04);
        fOsc.connect(fGain);
        fGain.connect(ctx.destination);
        fOsc.start(now + offset);
        fOsc.stop(now + offset + 0.04);

        // Paired noise pop for each flicker
        const popSize = ctx.sampleRate * 0.03;
        const popBuf = ctx.createBuffer(1, popSize, ctx.sampleRate);
        const popData = popBuf.getChannelData(0);
        for (let i = 0; i < popSize; i++) popData[i] = (Math.random() * 2 - 1);
        const popSrc = ctx.createBufferSource();
        popSrc.buffer = popBuf;
        const popGain = ctx.createGain();
        const popFilter = ctx.createBiquadFilter();
        popFilter.type = 'highpass';
        popFilter.frequency.value = 2000;
        popGain.gain.setValueAtTime(0.15, now + offset);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.03);
        popSrc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(ctx.destination);
        popSrc.start(now + offset);
        popSrc.stop(now + offset + 0.03);
      });

      // ── PHASE 2: Hard SLAM (matches final golden X slamming in at 0.1s later) ──
      const slamAt = 0.28; // 0.1s after the last flicker

      // Deep thud — the "weight" of the X hitting
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(200, now + slamAt);
      thudOsc.frequency.exponentialRampToValueAtTime(35, now + slamAt + 0.18);
      thudGain.gain.setValueAtTime(0.7, now + slamAt);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + slamAt + 0.22);
      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start(now + slamAt);
      thudOsc.stop(now + slamAt + 0.22);

      // High crack on impact — the sharp "snap"
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'sawtooth';
      snapOsc.frequency.setValueAtTime(900, now + slamAt);
      snapOsc.frequency.exponentialRampToValueAtTime(60, now + slamAt + 0.08);
      snapGain.gain.setValueAtTime(0.4, now + slamAt);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + slamAt + 0.08);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now + slamAt);
      snapOsc.stop(now + slamAt + 0.08);

      // Noise burst on impact — the "bzzt" energy burst
      const noiseSize = Math.floor(ctx.sampleRate * 0.12);
      const noiseBuf = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
      const noiseData = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseSize; i++) noiseData[i] = Math.random() * 2 - 1;
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = noiseBuf;
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 2500;
      noiseFilter.Q.value = 0.8;
      noiseGain.gain.setValueAtTime(0.3, now + slamAt);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + slamAt + 0.12);
      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSrc.start(now + slamAt);
      noiseSrc.stop(now + slamAt + 0.12);

      setTimeout(() => ctx.close(), 1000);
    } catch (e) {
      // Silently fail if browser blocks audio
    }
  };

  useEffect(() => {
    setIsClient(true);
    let shouldPlay = false;

    const isFirstVisit = !sessionStorage.getItem('introPlayed');
    const justLoggedOut = sessionStorage.getItem('justLoggedOut') === 'true';
    
    // We only care if it's an actual browser refresh (type === 'reload') 
    // AND this component is literally mounting right now (isMountRef.current)
    const navEntries = performance.getEntriesByType('navigation');
    const isActualReload = navEntries.length > 0 && navEntries[0].type === 'reload' && isMountRef.current;

    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
      shouldPlay = true; // Rule 3: After logout redirect
    } else if (isFirstVisit) {
      sessionStorage.setItem('introPlayed', 'true');
      shouldPlay = true; // Rule 1: First visit ever in session
    } else if (isActualReload && pathname === '/') {
      shouldPlay = true; // Rule 2: Refresh, but ONLY on the '/' page
    }

    isMountRef.current = false;

    if (!shouldPlay) {
      setShow(false);
      return;
    }

    setShow(true);
    document.body.classList.add('intro-playing');

    // Fire zap sound 500ms early to compensate for Web Audio API init overhead
    const zapTimer = setTimeout(() => playZapSound(), 1250);
    
    const timer = setTimeout(() => {
      setShow(false);
      document.body.classList.remove('intro-playing');
    }, 3250);
    
    return () => {
      clearTimeout(zapTimer);
      clearTimeout(timer);
      document.body.classList.remove('intro-playing');
    };
  }, [pathname]);

  // Synchronous read to prevent 1-frame flash of the landing page before useEffect catches it
  let blockUI = false;
  if (isClient && pathname === '/') {
    try {
      if (sessionStorage.getItem('justLoggedOut') === 'true' || !sessionStorage.getItem('introPlayed')) {
        blockUI = true;
      }
    } catch(e) {}
  }

  if (!isClient) {
    // SSR fallback to prevent flashing. If we are on landing page, block UI until client decides.
    return pathname === '/' ? <div className="fixed inset-0 z-[999999] bg-[#050505]" /> : null;
  }

  if (!show && !blockUI) return null;

  const letterVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {(show || blockUI) && (
        <motion.div
          key="intro-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.8, ease: "easeInOut" } }}
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-[#050505] overflow-hidden pointer-events-none"
        >
          <motion.div 
            animate={{ x: [0, -10, 10, -6, 6, -2, 2, 0], y: [0, 5, -5, 3, -3, 1, -1, 0] }}
            transition={{ duration: 0.35, delay: 1.6, ease: "easeInOut" }}
            className="relative flex items-center tracking-tighter"
          >
            {/* Collab text */}
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.15, delayChildren: 0.4 }}
              className="flex text-white font-sans text-4xl md:text-6xl font-black"
            >
              {['C', 'o ', 'l', 'l', 'a', 'b'].map((char, index) => (
                <motion.span key={index} variants={letterVariants} className="inline-block" transition={{ duration: 0.8, ease: "easeOut" }}>
                  {char}
                </motion.span>
              ))}
            </motion.div>

            {/* X hitting effect */}
            <div className="relative flex items-center justify-center -ml-1 md:-ml-2 w-12 h-16 md:w-16 md:h-20">
              
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 1.5 }}
                animate={{ opacity: [0, 1, 0], x: [-20, 10, 0], scale: [1.5, 1, 1] }}
                transition={{ duration: 0.3, delay: 1.5, ease: "linear" }}
                className="absolute text-[#FAD961] font-sans font-bold text-6xl md:text-8xl mix-blend-screen"
              >
                X
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, scale: 1.5 }}
                animate={{ opacity: [0, 1, 0], x: [20, -10, 0], scale: [1.5, 1, 1] }}
                transition={{ duration: 0.3, delay: 1.5, ease: "linear" }}
                className="absolute text-white font-sans font-bold text-6xl md:text-8xl mix-blend-screen"
              >
                X
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: 1.6, ease: "easeOut" }}
                className="absolute text-transparent bg-clip-text bg-gradient-to-br from-[#FFE066] via-[#F5A623] to-[#F76B1C] font-sans font-bold text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(245,166,35,0.6)] z-10"
              >
                X
              </motion.div>

              <motion.div
                 initial={{ opacity: 0, scale: 0 }}
                 animate={{ opacity: [0, 0.8, 0], scale: [0, 1.5, 2] }}
                 transition={{ duration: 0.5, delay: 1.6, ease: "easeOut" }}
                 className="absolute inset-0 m-auto w-full h-full bg-[#F5A623] rounded-full blur-[30px] z-0 pointer-events-none"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
