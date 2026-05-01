"use client";

import Link from 'next/link';
import { useUserStore } from '../store/userStore';
import { useEffect, useState } from 'react';

export default function Home() {
  const { isAuthenticated } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
      <div className="flex flex-col items-center z-10 relative">
        <div className="flex items-center tracking-tighter mb-8">
          <span className="text-6xl font-black mr-2">Collab</span>
          <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFC107] to-[#F5A623] drop-shadow-[0_0_15px_rgba(245,166,35,0.4)] -ml-2">X</span>
        </div>
        <p className="text-xl text-muted-foreground mb-12 max-w-lg text-center">
          The ultimate real-time collaborative coding platform for professional engineering teams.
        </p>
        <div className="flex gap-4">
          {!mounted ? (
            <div className="h-[48px]"></div> // Hydration placeholder
          ) : isAuthenticated ? (
            <Link 
              href="/dashboard" 
              className="px-8 py-3 bg-gradient-to-r from-[#FFC107] to-[#F5A623] text-black font-bold rounded-md hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-8 py-3 bg-gradient-to-r from-[#FFC107] to-[#F5A623] text-black font-bold rounded-md hover:opacity-90 transition-opacity"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-8 py-3 bg-white/10 text-white font-bold rounded-md hover:bg-white/20 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F5A623]/10 rounded-full blur-[100px] pointer-events-none z-0" />
    </div>
  );
}
