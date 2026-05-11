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
    
    const timer = setTimeout(() => {
      setShow(false);
      document.body.classList.remove('intro-playing');
    }, 3250);
    
    return () => {
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
