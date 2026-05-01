"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: '900', style: 'italic' });

export default function IntroSplash() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isJustLoggedOut = sessionStorage.getItem('justLoggedOut');
    const isJustLoggedIn = sessionStorage.getItem('justLoggedIn');
    const isFirstVisit = !sessionStorage.getItem('introPlayed');
    const isHomePage = window.location.pathname === '/';

    let willShow = false;
    if (isJustLoggedOut || isJustLoggedIn) {
      sessionStorage.removeItem('justLoggedOut');
      sessionStorage.removeItem('justLoggedIn');
      willShow = false;
    } else if (isHomePage) {
      willShow = true;
    } else if (isFirstVisit) {
      willShow = true;
    }

    sessionStorage.setItem('introPlayed', 'true');

    if (willShow) {
      setShow(true);
      setMounted(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 3250);
      return () => clearTimeout(timer);
    } else {
      setMounted(true);
    }
  }, []);

  if (!mounted) return null;

  const letterVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {show && (
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
              
              {/* Glitch Layer 1 (Bright Gold) */}
              <motion.div
                initial={{ opacity: 0, x: -20, scale: 1.5 }}
                animate={{ opacity: [0, 1, 0], x: [-20, 10, 0], scale: [1.5, 1, 1] }}
                transition={{ duration: 0.3, delay: 1.5, ease: "linear" }}
                className="absolute text-[#FAD961] font-sans font-bold text-6xl md:text-8xl mix-blend-screen"
              >
                X
              </motion.div>

              {/* Glitch Layer 2 (White) */}
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 1.5 }}
                animate={{ opacity: [0, 1, 0], x: [20, -10, 0], scale: [1.5, 1, 1] }}
                transition={{ duration: 0.3, delay: 1.5, ease: "linear" }}
                className="absolute text-white font-sans font-bold text-6xl md:text-8xl mix-blend-screen"
              >
                X
              </motion.div>

              {/* Final Solid Layer (Premium Gold Gradient) */}
              <motion.div
                initial={{ opacity: 0, scale: 4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: 1.6, ease: "easeOut" }}
                className="absolute text-transparent bg-clip-text bg-gradient-to-br from-[#FFE066] via-[#F5A623] to-[#F76B1C] font-sans font-bold text-6xl md:text-8xl drop-shadow-[0_0_20px_rgba(245,166,35,0.6)] z-10"
              >
                X
              </motion.div>

              {/* Impact Flash */}
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
