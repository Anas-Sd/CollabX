"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView, useSpring, animate } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import {
  Code2, Users, Zap, Shield, PlayCircle, Mic, Terminal, Globe, ArrowRight,
  Database, Activity, Server, Cpu, CheckCircle2, Mail, Code, Pencil, MessageSquare,
  Book,
  Monitor,
  ScreenShare,
  Banknote,
  Currency,
  CurrencyIcon,
  LucideClipboard,
  LucideClipboardPaste,
  LucideClipboardEdit,
  LucideMapPinCheckInside,
  Crown,
  Clock,
  Timer,
  Sparkles,
  Loader2,
  LogOut,
  LucideFish,
  LucideSettings,
  LucideContainer,
  LucideFishOff,
  LucideFishSymbol,
  LucideFishingHook
} from 'lucide-react';
import Whiteboard from '../components/room/Whiteboard';
import api from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';
import { useRouter } from 'next/navigation';
import FeedbackButton from '../components/ui/FeedbackButton';

const FadeIn = ({ children, delay = 0, direction = "up", className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-15%" });
  const directions = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { x: 100, y: 0 },
    right: { x: -100, y: 0 }
  };
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Word-by-word blur reveal
const ScrollReveal = ({ text, className = "", delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-10%" });
  return (
    <span ref={ref} className={className}>
      {text.split(" ").map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={isInView
            ? { opacity: 1, y: 0, filter: "blur(0px)" }
            : { opacity: 0, y: 20, filter: "blur(6px)" }}
          transition={{ duration: 0.5, delay: delay + i * 0.07, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="inline-block mr-[0.3em]"
        >{word}</motion.span>
      ))}
    </span>
  );
};

// Animated counter
const Counter = ({ from = 0, to, prefix = "", suffix = "", className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [val, setVal] = useState(from);
  useEffect(() => {
    if (!isInView) return;
    const controls = animate(from, to, {
      duration: 1.6,
      ease: [0.21, 0.47, 0.32, 0.98],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [isInView]);
  return <span ref={ref} className={className}>{prefix}{val}{suffix}</span>;
};

export default function Home() {
  const { user, setUser, isAuthenticated, logout } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const isPro = user?.subscriptionType === 'PRO';
  let daysLeft = 0;
  if (isPro && user?.subscriptionExpiresAt) {
    const expiresStr = user.subscriptionExpiresAt;
    const safeExpiresStr = (!expiresStr.endsWith('Z')) ? expiresStr + 'Z' : expiresStr;
    const expiresAt = new Date(safeExpiresStr);
    const now = new Date();
    const diffTime = expiresAt - now;
    daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const handleUpgrade = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setLoadingPayment(true);
    try {
      const res = await new Promise((resolve) => {
        if (window.Razorpay) { resolve(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!res) {
        useNotificationStore.getState().addNotification('Failed to load Razorpay SDK', 'error');
        return;
      }

      const orderResponse = await api.post('/payments/create-order', { amount: 49900, currency: 'INR' });
      const orderData = typeof orderResponse.data === 'string' ? JSON.parse(orderResponse.data) : orderResponse.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'CollabX Pro',
        description: 'Upgrade to CollabX Pro Subscription',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              useNotificationStore.getState().addNotification('Payment Successful! Welcome to CollabX PRO.', 'success');
              if (user) {
                setUser({ ...user, subscriptionType: 'PRO' });
              }
              router.push('/dashboard');
            } else {
              useNotificationStore.getState().addNotification('Payment verification failed.', 'error');
            }
          } catch (err) {
            useNotificationStore.getState().addNotification('Payment verification error.', 'error');
          }
        },
        prefill: { name: user?.name || '', email: user?.email || '' },
        theme: { color: '#8B5CF6' }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response) {
        useNotificationStore.getState().addNotification(response?.error?.description || 'Payment failed.', 'error');
      });
    } catch (err) {
      console.error('Payment Initiation Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Could not initiate payment sequence.';
      useNotificationStore.getState().addNotification(errorMessage, 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  // ----------------------------------------------------------------------
  // SCROLL ANIMATION: HERO
  // ----------------------------------------------------------------------
  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // ----------------------------------------------------------------------
  // SCROLL ANIMATION: HORIZONTAL FEATURES
  // ----------------------------------------------------------------------
  const featuresRef = useRef(null);
  const { scrollYProgress: featuresProgress } = useScroll({
    target: featuresRef,
    offset: ["start start", "end start"]
  });

  const xTransform = useTransform(featuresProgress, [0, 0.5, 1], ["0%", "-40%", "-85%"]);
  const featuresOpacity = useTransform(featuresProgress, [0, 0.8, 1], [1, 1, 0]);

  // ----------------------------------------------------------------------
  // SCROLL ANIMATION: HOW IT WORKS
  // ----------------------------------------------------------------------
  const workflowRef = useRef(null);
  const { scrollYProgress: workflowProgress } = useScroll({
    target: workflowRef,
    offset: ["start end", "center center"]
  });

  const workflowLeftX = useTransform(workflowProgress, [0, 1], ["-200px", "0px"]);
  const workflowRightX = useTransform(workflowProgress, [0, 1], ["200px", "0px"]);
  const workflowOpacity = useTransform(workflowProgress, [0, 0.8], [0, 1]);
  // Dedicated line scale — runs 0→1 across the full workflow scroll range
  const workflowLineScale = useTransform(workflowProgress, [0, 1], [0, 1]);

  const textOpacity = useTransform(heroProgress, [0, 0.4], [1, 0]);
  const textY = useTransform(heroProgress, [0, 0.4], [0, -100]);

  const mockupRotateX = useTransform(heroProgress, [0, 0.5], [25, 0]);
  const mockupScale = useTransform(heroProgress, [0, 0.8], [0.85, 1.05]);
  const mockupY = useTransform(heroProgress, [0, 0.8], [150, -50]);
  const mockupOpacity = useTransform(heroProgress, [0, 0.1, 0.8, 1], [0.5, 1, 1, 0]);

  // Hero extra parallax layers
  const heroOrb1Y = useTransform(heroProgress, [0, 1], ["0%", "30%"]);
  const heroOrb2Y = useTransform(heroProgress, [0, 1], ["0%", "-20%"]);
  const heroGlowScale = useTransform(heroProgress, [0, 1], [1, 1.6]);

  // Global scroll progress bar
  const { scrollYProgress: pageProgress } = useScroll();
  const scaleX = useSpring(pageProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // Metrics section
  const metricsRef = useRef(null);

  // Pricing section
  const pricingRef = useRef(null);
  const { scrollYProgress: pricingProgress } = useScroll({
    target: pricingRef,
    offset: ["start end", "center center"]
  });
  const pricingScale = useTransform(pricingProgress, [0, 0.6], [0.88, 1]);
  const pricingOpacity = useTransform(pricingProgress, [0, 0.4], [0, 1]);
  const pricingY = useTransform(pricingProgress, [0, 0.6], [60, 0]);

  // CTA section
  const ctaRef = useRef(null);
  const { scrollYProgress: ctaProgress } = useScroll({
    target: ctaRef,
    offset: ["start end", "center center"]
  });
  const ctaY = useTransform(ctaProgress, [0, 1], [80, 0]);
  const ctaOpacity = useTransform(ctaProgress, [0, 0.6], [0, 1]);

  return (
    <div className="bg-[#020202] text-white selection:bg-[#F5A623]/30 font-sans">

      {/* ── Landing-page JSON-LD: FAQ + rich snippet data ─────────────────── */}
      {/* Googlebot executes JavaScript — this WILL be indexed                */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'What is CollabX?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'CollabX is a real-time collaborative IDE that lets developers code together in a shared workspace with voice communication, a collaborative whiteboard, and instant multi-language code execution — all in the browser.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Is CollabX free to use?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. CollabX has a free plan with core collaborative features. A Pro plan at ₹499/month unlocks extended session durations, up to 20 participants, niche languages, and premium visual effects.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Which programming languages does CollabX support?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'CollabX supports Python, Java, C++, JavaScript (Node.js), and SQL through Judge0 API. More languages are available on the Pro plan.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Can I use CollabX for technical interviews?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. CollabX is ideal for remote technical interviews. Share a workspace code, assign the candidate as Editor and yourself as Host, then code, run test cases, and communicate via built-in voice — no external tools needed.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'What makes CollabX different from other online IDEs?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'CollabX combines real-time code collaboration (sub-100ms sync via WebSockets), built-in voice communication (WebRTC via Agora), a collaborative whiteboard, role-based access control, and session persistence — all in a single browser-based platform with no installation required.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How many people can collaborate at once in CollabX?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'The free plan supports up to 5 collaborators per workspace. The Pro plan expands this to 20+ participants for larger team sessions.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
      `}} />

      {/* ---------------- NAVIGATION ---------------- */}
      <nav className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 lg:px-12 bg-[#020202]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center tracking-tighter">
          <span className="text-xl font-black mr-0.5">Collab</span>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFC107] to-[#F5A623]">X</span>
        </div>

        <div className="flex items-center gap-4">
          {!mounted ? (
            <div className="h-[36px] w-[90px] bg-white/5 animate-pulse rounded-lg"></div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-white text-black font-bold text-xs rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center gap-2"
              >
                Dashboard <ArrowRight className="w-3 h-3" />
              </Link>
              <div className="group relative">
                <FeedbackButton
                  context="Landing Page Footer"
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-[#F5A623] hover:border-[#F5A623]/30 transition-all"
                />
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#111115] border border-white/10 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">Give Feedback</span>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                  useNotificationStore.getState().addNotification('Logged out successfully', 'success');
                }}
                className="p-2.5 text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg cursor-pointer transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden md:flex px-4 py-2 text-white/70 font-bold text-xs hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="px-5 py-2 bg-[#F5A623] text-black font-bold text-xs rounded-full hover:shadow-[0_0_15px_rgba(245,166,35,0.3)] transition-all">
                Start Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ---------------- 1. HERO SECTION ---------------- */}
      <section ref={heroRef} className="relative h-[200vh]">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden [perspective:1000px]">

          {/* Hero parallax depth orbs */}
          <motion.div
            style={{ y: heroOrb1Y, scale: heroGlowScale }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#F5A623]/10 rounded-full blur-[120px] pointer-events-none"
          />
          <motion.div
            style={{ y: heroOrb2Y }}
            className="absolute top-[20%] left-[15%] w-[280px] h-[280px] bg-purple-500/5 rounded-full blur-[90px] pointer-events-none"
          />
          <motion.div
            style={{ y: heroOrb1Y }}
            className="absolute bottom-[20%] right-[12%] w-[220px] h-[220px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"
          />

          <motion.div style={{ opacity: textOpacity, y: textY }} className="absolute top-[25vh] text-center z-20 px-4 w-full">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4">
              Code <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-600">Together.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto font-medium tracking-tight">
              A hyper-synchronized IDE. Built for speed and collaboration.
            </p>
          </motion.div>

          <motion.div
            style={{
              rotateX: mockupRotateX,
              scale: mockupScale,
              y: mockupY,
              opacity: mockupOpacity
            }}
            className="absolute top-[45vh] w-[90vw] max-w-5xl z-30 origin-top will-change-transform"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0A0A0F] shadow-2xl overflow-hidden">
              <div className="h-10 border-b border-white/5 flex items-center px-4 justify-between bg-[#050508]">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-md text-[10px] font-mono text-white/40">
                  <Globe className="w-3 h-3" /> room-x89
                </div>
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded-full bg-[#F5A623] flex items-center justify-center text-[9px] font-black text-black">A</div>
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-black text-white">R</div>
                </div>
              </div>
              <div className="flex h-[45vh] md:h-[55vh]">
                <div className="w-14 border-r border-white/5 bg-[#020202] hidden sm:flex flex-col items-center py-5 gap-5 text-white/20">
                  <Terminal className="w-4 h-4 text-white/40" />
                  <Database className="w-4 h-4" />
                  <Code2 className="w-4 h-4 text-[#F5A623]" />
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex-1 p-6 font-mono text-xs md:text-sm leading-relaxed overflow-hidden relative bg-[#0A0A0F]">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F5A623]/5 blur-[100px]"></div>
                  <p className="text-pink-500 mb-2"><span className="text-purple-500">import</span> java.util.Scanner;</p>
                  <p className="text-blue-400 mb-2 mt-4"><span className="text-purple-500">public class</span> <span className="text-yellow-200">CollabXEngine</span> {'{'}</p>
                  <div className="pl-6 border-l border-white/5">
                    <p className="text-blue-400 mb-2"><span className="text-purple-500">public static void</span> <span className="text-yellow-200">main</span>(String[] args) {'{'}</p>
                    <div className="pl-6 border-l border-white/5 relative">
                      <p className="text-white/70 mb-2">System.<span className="text-blue-400">out</span>.println(<span className="text-green-400">"Connecting WebSockets..."</span>);</p>
                      <p className="text-white/70 mb-6"><span className="text-purple-500">boolean</span> connected = <span className="text-orange-400">true</span>;</p>

                      <div className="flex items-center mb-2">
                        <p className="text-white/70"><span className="text-purple-500">if</span> (connected) {'{'}</p>
                      </div>
                      <div className="pl-6 border-l border-white/5 relative mb-2">
                        <div className="flex items-center">
                          <p className="text-white/70">session.sync(<span className="text-green-400">"cursor_position"</span>);</p>
                          {/* <span className="inline-block w-0.5 h-3.5 bg-[#F5A623] ml-1 animate-pulse"></span> */}
                          {/* <span className="ml-1 px-1.5 py-0.5 bg-[#F5A623] text-black text-[8px] font-bold rounded">Anas</span> */}
                        </div>
                        <p className="text-white/70 mt-2">engine.startExecution();</p>
                      </div>
                      <p className="text-blue-400">{'}'}</p>
                    </div>
                    <p className="text-blue-400">{'}'}</p>
                  </div>
                  <p className="text-blue-400">{'}'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- 1.5 METRICS SECTION ---------------- */}
      <section ref={metricsRef} className="py-24 bg-[#020202] border-y border-white/5 relative z-40">
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              <ScrollReveal text="Built for scale." /> <span className="text-white/60"><ScrollReveal text="Engineered for speed." delay={0.3} /></span>
            </h2>
            <p className="text-white/50 text-sm md:text-base max-w-xl mx-auto">CollabX handles the heavy lifting so you can focus on writing code with your team.</p>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

            {/* Metric 1 */}
            <FadeIn delay={0.1} className="col-span-2 lg:col-span-2 bg-[#050508] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[40px] rounded-full group-hover:bg-green-500/20 transition-all"></div>
              <div className="text-4xl font-black text-[#6DB33F] mb-2"><Counter from={0} to={99} prefix="<" suffix="ms" /></div>
              <div className="text-sm font-bold text-white/90 mb-1">Global Sync Latency</div>
              <p className="text-[10px] text-white/40 leading-relaxed">Real-time WebSocket propagation across regions.</p>
            </FadeIn>

            {/* Metric 2 */}
            <FadeIn delay={0.2} className="col-span-2 lg:col-span-2 bg-[#050508] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#F5A623]/10 blur-[40px] rounded-full group-hover:bg-[#F5A623]/20 transition-all"></div>
              <div className="text-4xl font-black text-white mb-2"><Counter from={0} to={20} /><span className="text-2xl text-[#F5A623]">+</span></div>
              <div className="text-sm font-bold text-white/90 mb-1">Users per Room</div>
              <p className="text-[10px] text-white/40 leading-relaxed">Concurrent editors with distinct cursors.</p>
            </FadeIn>

            {/* Metric 3 */}
            <FadeIn delay={0.3} className="col-span-2 lg:col-span-2 bg-[#050508] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
              <div className="text-4xl font-black text-blue-400 mb-2"><Counter from={0} to={200} /><span className="text-white text-2xl">+</span></div>
              <div className="text-sm font-bold text-white/90 mb-1">Concurrent Sockets</div>
              <p className="text-[10px] text-white/40 leading-relaxed">Sustained active connections per server instance.</p>
            </FadeIn>

            {/* Metric 4 */}
            <FadeIn delay={0.4} className="col-span-2 lg:col-span-3 bg-[#050508] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors flex justify-between items-center">
              <div>
                <div className="text-4xl font-black text-white mb-2"><Counter from={0} to={5} /><span className="text-[#F5A623] text-2xl">+</span></div>
                <div className="text-sm font-bold text-white/90 mb-1">Languages Supported</div>
                <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px]">Java, Python, C++, Node.js, SQL, and more via Judge0.</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white group-hover:scale-110 transition-all"><Code2 className="w-8 h-8" /></div>
            </FadeIn>

            {/* Metric 5 */}
            <FadeIn delay={0.5} className="col-span-2 lg:col-span-3 bg-[#050508] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors flex justify-between items-center">
              <div>
                <div className="text-4xl font-black text-purple-400 mb-2">0<span className="text-white text-2xl">s</span></div>
                <div className="text-sm font-bold text-white/90 mb-1">Setup Time</div>
                <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px]">Zero configuration. Generate a code and start instantly.</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-400/40 group-hover:text-purple-400 group-hover:scale-110 transition-all"><Zap className="w-8 h-8" /></div>
            </FadeIn>

          </div>
        </div>
      </section>
      {/* ---------------- 2. FEATURES SECTION (HORIZONTAL SCROLL) ---------------- */}
      <section ref={featuresRef} id="features" className="relative h-[350vh] bg-[#020202] z-40">
        <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">

          <motion.div
            style={{ opacity: featuresOpacity }}
            className="absolute top-[20vh] left-6 md:left-24 z-10 w-full pr-6"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
              <ScrollReveal text="No Compromises." />
            </h2>
            <p className="text-white/50 text-sm md:text-base font-medium tracking-tight">
              <ScrollReveal text="Keep scrolling to explore the architecture." delay={0.2} />
            </p>
          </motion.div>

          <motion.div style={{ x: xTransform }} className="flex gap-8 px-[10vw] mt-26 items-center will-change-transform">

            {/* Card 4: Role-Based Sessions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: false, margin: "0px -80px 0px -80px" }}
              className="w-[85vw] md:w-[400px] h-[320px] shrink-0 bg-[#0A0A0F] border border-white/5 rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[60px] rounded-full group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-purple-400"><Shield className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90">Role-Based Sessions.</h3>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">Assign Host, Editor, or Viewer roles dynamically. Take control of execution privileges and mute specific participants.</p>
            </motion.div>

            {/* Card 1: Real-Time Collaboration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: false, margin: "0px -80px 0px -80px" }}
              className="w-[85vw] md:w-[400px] h-[320px] shrink-0 bg-[#0A0A0F] border border-white/5 rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-blue-400"><Zap className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90">Real-Time Collaboration.</h3>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">Sub-100ms cursor tracking and code syncing via Spring WebSockets. Experience true multiplayer editing.</p>
            </motion.div>

            {/* Card 3: Multi-Language Execution */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: false, margin: "0px -80px 0px -80px" }}
              className="w-[85vw] md:w-[400px] h-[320px] shrink-0 bg-[#0A0A0F] border border-white/5 rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 blur-[60px] rounded-full group-hover:bg-green-500/10 transition-colors pointer-events-none"></div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-green-400"><Terminal className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90">Multi-Language Execution.</h3>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">Compile and run Python, Java, C++, JS, and SQL instantly inside isolated secure containers via Judge0 API.</p>
            </motion.div>

            {/* Card 5: Refresh-Safe Recovery */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: false, margin: "0px -80px 0px -80px" }}
              className="w-[85vw] md:w-[400px] h-[320px] shrink-0 bg-[#0A0A0F] border border-white/5 rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#F5A623]/5 blur-[60px] rounded-full group-hover:bg-[#F5A623]/10 transition-colors pointer-events-none"></div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-[#F5A623]"><Database className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90">Refresh-Safe Recovery.</h3>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">Automatic state persistence via database ensures that if you drop connection or refresh, you immediately rejoin exactly where you left off.</p>
            </motion.div>

            {/* Card 7: Collaborative Whiteboard */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: false, margin: "0px -80px 0px -80px" }}
              className="w-[85vw] md:w-[400px] h-[320px] shrink-0 bg-[#0A0A0F] border border-white/5 rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/5 blur-[60px] rounded-full group-hover:bg-teal-500/10 transition-colors pointer-events-none"></div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-teal-400"><Pencil className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90">Collaborative Whiteboard.</h3>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">Sketch architecture diagrams, algorithm logic, and notes in real-time. Built right into the editor for seamless brainstorming.</p>
            </motion.div>

            {/* Card 2: Voice Communication */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: false, margin: "0px -80px 0px -80px" }}
              className="w-[85vw] md:w-[400px] h-[320px] shrink-0 bg-[#0A0A0F] border border-white/5 rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[60px] rounded-full group-hover:bg-cyan-500/10 transition-colors pointer-events-none"></div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-cyan-400"><Mic className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90">Voice Communication.</h3>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">Talk directly inside the IDE using WebRTC voice channels powered by Agora. Leave external meeting apps behind.</p>
            </motion.div>

            {/* Card 6: Pro Features */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] }}
              viewport={{ once: false, margin: "0px -80px 0px -80px" }}
              className="w-[85vw] md:w-[400px] h-[320px] shrink-0 bg-[#0A0A0F] border border-white/5 rounded-[24px] p-8 flex flex-col justify-center relative overflow-hidden group hover:border-white/10 transition-colors"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/5 blur-[60px] rounded-full group-hover:bg-pink-500/10 transition-colors pointer-events-none"></div>
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 text-pink-400"><Code2 className="w-6 h-6" /></div>
              <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90">Pro Features.</h3>
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">Unlock extended multi-hour sessions, participants limit, niche languages, Enhanced Background &amp; Glowing effects</p>
            </motion.div>


            <div className="w-[10vw] shrink-0"></div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- 4. HOW IT WORKS ---------------- */}
      <section ref={workflowRef} id="how-it-works" className="py-24 px-6 bg-[#050508] border-t border-white/5 relative z-40 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div style={{ x: workflowLeftX, opacity: workflowOpacity }}>
              <h2 className="text-3xl md:text-4xl font-black mb-4">Workflow Simplified.</h2>
              <p className="text-white/50 text-sm md:text-base mb-10 max-w-md">We removed all the friction. From creating an account to collaborating in a live session takes less than 30 seconds.</p>

              <div className="space-y-6 relative">

                {[{
                  n: 1, title: 'Create a Workspace',
                  desc: 'Log into your dashboard and launch a new workspace in one click. An isolated environment is provisioned instantly.'
                }, {
                  n: 2, title: 'Share the Access Code',
                  desc: 'Send the unique 8-character code to your peers. They can join immediately and connect to the voice channel.'
                }, {
                  n: 3, title: 'Code, Execute, Discuss',
                  desc: 'Write code collaboratively, run it against test cases, draw on the whiteboard, and review together.'
                }].map(({ n, title, desc }, i) => (
                  <motion.div
                    key={n}
                    className="flex gap-5"
                    style={{ opacity: workflowOpacity, x: workflowLeftX }}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-[#F5A623] shrink-0 relative z-10">{n}</div>
                    <div>
                      <h4 className="text-base font-bold mb-1 text-white/90">{title}</h4>
                      <p className="text-white/50 text-xs md:text-sm leading-relaxed max-w-sm">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div style={{ x: workflowRightX, opacity: workflowOpacity }} className="relative hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#F5A623]/10 to-transparent blur-[100px] rounded-full"></div>
              <div className="bg-[#0A0A0F] border border-white/10 rounded-3xl p-6 relative z-10 shadow-xl">
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white text-xs">S</div>
                      <span className="font-semibold text-white/90 text-sm">Sarah created room A1B2C3D4</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">Just now</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center ml-6 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F5A623] flex items-center justify-center font-bold text-black text-xs">J</div>
                      <span className="font-semibold text-[#F5A623] text-sm">John joined as Editor</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">10s ago</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center ml-12 shadow-inner">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white"><PlayCircle className="w-4 h-4" /></div>
                      <span className="font-semibold text-green-400 text-sm">Execution completed (0.12s)</span>
                    </div>
                    <span className="text-[10px] text-white/40 font-mono">5s ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---------------- TECH STACK MARQUEE ---------------- */}
      <section className="py-10 bg-[#0A0A0F] relative z-40 overflow-hidden group">
        <div className="absolute left-0 top-0 w-32 h-full bg-gradient-to-r from-[#0A0A0F] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-[#0A0A0F] to-transparent z-10 pointer-events-none"></div>

        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused] text-[11px] font-bold tracking-widest uppercase items-center">
          {[1, 2].map(i => (
            <div key={i} className="flex gap-24 px-12 items-center">
              <span className="flex items-center gap-2 text-white/20 hover:text-white transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Globe className="w-4 h-4" /> Next.js
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-[#6DB33F] transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Server className="w-4 h-4" /> Spring Boot
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-[#F5A623] transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Zap className="w-4 h-4" /> WebSockets
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-[#336791] transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Database className="w-4 h-4" /> PostgreSQL
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-green-600 transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Banknote className="w-4 h-4" /> Razorpay
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-blue-400 transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Terminal className="w-4 h-4" /> Judge0 API
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-cyan-400 transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Mic className="w-4 h-4" /> Agora RTC
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-white transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <Book className="w-4 h-4" /> excalidraw
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-sky-400 transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <LucideClipboardEdit className="w-4 h-4" /> Monaco Editor
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-red-500 transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <LucideMapPinCheckInside className="w-4 h-4" /> LWW Algorithm
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-blue-500 transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <LucideContainer className="w-4 h-4" /> Docker
              </span>
              <span className="flex items-center gap-2 text-white/20 hover:text-yellow-500 transition-colors duration-300 cursor-pointer whitespace-nowrap">
                <LucideSettings className="w-4 h-4" /> CI/CD
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- 5. PRICING ---------------- */}
      <section ref={pricingRef} id="pricing" className="py-24 bg-[#020202] relative z-40">
        <motion.div style={{ scale: pricingScale, opacity: pricingOpacity, y: pricingY }} className="max-w-5xl mx-auto px-6">
          <FadeIn className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Simple Pricing.</h2>
            <p className="text-white/50 text-sm md:text-base">Start for free. Upgrade when your team grows.</p>
          </FadeIn>

          <div className="flex justify-center mt-12 w-full">
            <FadeIn delay={0.1} className="w-full">
              {!mounted ? (
                <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-3xl border border-white/5 bg-[#0A0A0F] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center min-h-[400px] p-8 md:p-12 text-center animate-pulse">
                </div>
              ) : isPro ? (
                <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-3xl border border-[#F5A623]/30 bg-black shadow-[0_0_50px_rgba(245,166,35,0.15)] flex flex-col items-center justify-center min-h-[400px] p-8 md:p-12 text-center group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#F5A623]/20 via-[#0A0A0F] to-black opacity-60 transition-opacity duration-700 group-hover:opacity-100" />
                  <div className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-[#F5A623]/10 blur-[120px] rounded-full pointer-events-none" />
                  <div className="absolute -bottom-64 -left-64 w-[500px] h-[500px] bg-[#FFC107]/10 blur-[120px] rounded-full pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 mb-8">
                      <div className="w-2 h-2 rounded-full bg-[#F5A623] shadow-[0_0_10px_rgba(245,166,35,0.8)] animate-pulse" />
                      <span className="text-[10px] font-black text-[#F5A623] uppercase tracking-[0.2em]">Pro Status Active</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">
                      Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#FFC107]">{user?.name?.split(' ')[0] || 'Developer'}</span>.
                    </h2>
                    <p className="text-sm md:text-base text-white/50 mb-10 leading-relaxed max-w-lg mx-auto">
                      Your workspace is fully unlocked. You have <strong className="text-white">{daysLeft} days</strong> of unlimited execution, expanded participant limits, and premium features remaining.
                    </p>

                    <button
                      onClick={() => router.push('/dashboard')}
                      className="group cursor-pointer relative flex items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFC107] px-8 py-5 text-sm md:text-base font-black text-black transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(245,166,35,0.4)]"
                    >
                      <span>LAUNCH WORKSPACE</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer pointer-events-none" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-3xl border border-[#F5A623]/30 bg-[#0A0A0F] shadow-[0_0_50px_rgba(245,166,35,0.15)] flex flex-col md:flex-row min-h-[400px]">
                  {/* Glow Effects */}
                  <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-[#F5A623]/20 blur-[100px] pointer-events-none z-0"></div>
                  <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-[#FFC107]/10 blur-[100px] pointer-events-none z-0"></div>

                  {/* Left Side: Features */}
                  <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center flex-1 bg-gradient-to-br from-black/60 to-transparent">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5A623]/20 to-[#F5A623]/5 border border-[#F5A623]/30 shadow-[0_0_30px_rgba(245,166,35,0.3)]">
                      <Crown className="h-8 w-8 text-[#F5A623]" />
                    </div>

                    <h2 className="mb-2 text-4xl font-black tracking-tight text-white">
                      CollabX <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5A623] to-[#FFC107]">PRO</span>
                    </h2>
                    <p className="mb-8 text-white/50 text-lg">
                      Unlock the ultimate collaborative coding experience with advanced features and zero limits.
                    </p>

                    <div className="w-full space-y-5">
                      {[
                        { name: "Custom Session Durations", icon: Clock },
                        { name: "Expanded Participant Limits", icon: Users },
                        { name: "Real-time Time Extensions", icon: Timer },
                        { name: "Expanded Historic Retention", icon: Database },
                        { name: "Premium Glowing Effects", icon: Sparkles }
                      ].map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                          <div key={i} className="flex items-center gap-4">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F5A623] text-black shadow-[0_0_10px_rgba(245,166,35,0.5)]">
                              <Icon size={14} strokeWidth={3} />
                            </div>
                            <span className="text-base font-medium text-white/90">{feature.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Soft Gradient Divider */}
                  <div className="hidden md:block w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                  <div className="md:hidden h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {/* Right Side: Payment */}
                  <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center items-center w-full md:w-[350px] bg-black/40">
                    <div className="w-full text-center mb-8">
                      <p className="text-sm font-bold text-[#F5A623] mb-2 tracking-widest uppercase">30-Day Pass</p>
                      <div className="flex items-end justify-center gap-1 mb-2">
                        <span className="text-5xl font-black text-white">₹499</span>
                        <span className="text-lg text-white/50 mb-1">/mo</span>
                      </div>
                      <p className="text-sm text-white/50">Access for 30 days </p>
                    </div>

                    <button
                      onClick={handleUpgrade}
                      disabled={loadingPayment}
                      className="group cursor-pointer relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#F5A623] to-[#FFC107] px-4 py-4 text-sm md:text-base font-bold text-black transition-all hover:opacity-90 hover:shadow-[0_0_30px_rgba(245,166,35,0.4)] mb-6 disabled:opacity-50"
                    >
                      {loadingPayment ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Zap className="h-5 w-5" />
                          <span>PROCEED TO PAYMENT</span>
                        </>
                      )}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer pointer-events-none" />
                    </button>

                    <div className="flex flex-col items-center gap-2 text-xs text-white/30 text-center">
                      <p>Secured by Razorpay • Instant Activation</p>
                      <p>You can cancel anytime.</p>
                    </div>
                  </div>
                </div>
              )}
            </FadeIn>
          </div>
        </motion.div>
      </section>

      {/* ---------------- 6. CTA SECTION ---------------- */}
      <section ref={ctaRef} className="py-24 px-6 bg-[#020202] relative overflow-hidden flex items-center justify-center text-center z-40 border-white/5">
        <motion.div
          style={{ scale: heroGlowScale }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[300px] bg-[#F5A623]/5 blur-[100px] rounded-full pointer-events-none"
        />
        <motion.div style={{ y: ctaY, opacity: ctaOpacity }} className="relative z-10 max-w-xl">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            <ScrollReveal text="Ready to redefine teamwork?" />
          </h2>
          <motion.p
            className="text-white/40 mb-8 text-sm md:text-base"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            viewport={{ once: false }}
          >
            Join thousands of developers building the future.
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Link
              href={mounted && isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-extrabold rounded-xl text-xs md:text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-shadow"
            >
              Start your workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>



      {/* ---------------- 7. FOOTER ---------------- */}
      <footer className="py-12 bg-[#050508] border-t border-white/5 relative z-40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center tracking-tighter mb-4">
                <span className="text-xl font-black mr-1 text-white">Collab</span>
                <span className="text-2xl font-black text-[#F5A623]">X</span>
              </div>
              <p className="text-white/40 max-w-sm mb-6 text-xs leading-relaxed">
                The next-generation collaborative IDE. Built for high-performance engineering teams, remote interviews, and real-time pair programming.
              </p>
              <div className="flex gap-3">
                <a href="https://github.com/Anas-Sd/CollabX" target="_blank" rel="noopener noreferrer" className="group relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-[#F5A623] hover:border-[#F5A623]/30 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#111115] border border-white/10 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">GitHub</span>
                </a>
                <a href="mailto:office.collabx@gmail.com" className="group relative w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-[#F5A623] hover:border-[#F5A623]/30 transition-all">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#111115] border border-white/10 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">Email Us</span>
                </a>
                <div className="group relative">
                  <FeedbackButton
                    context="Landing Page Footer"
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-[#F5A623] hover:border-[#F5A623]/30 transition-all"
                  />
                  <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-[#111115] border border-white/10 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">Give Feedback</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white/90 mb-5 uppercase tracking-widest text-[10px]">Product</h4>
              <ul className="space-y-3 text-xs font-medium text-white/40">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white/90 mb-5 uppercase tracking-widest text-[10px]">Legal</h4>
              <ul className="space-y-3 text-xs font-medium text-white/40">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms and Condition</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-white transition-colors">Refund Policy</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[10px] font-medium text-white/30 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} CollabX. All rights reserved.
            </div>
            {/* <div className="text-[10px] font-medium text-white/30 flex items-center gap-1.5 uppercase tracking-widest">
              Built with <Code className="w-3 h-3 text-[#F5A623] mx-0.5"/> by Anas-Sd
            </div> */}
          </div>
        </div>
      </footer>

    </div>
  );
}
