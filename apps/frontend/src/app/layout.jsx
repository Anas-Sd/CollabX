import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import ToastContainer from '../components/ui/ToastContainer';
import IntroSplash from '../components/ui/IntroSplash';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// ─── Change this to your production domain ───────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://collabx.live';
// ─────────────────────────────────────────────────────────────────────────────

// ─── Set to false when Railway is back online ────────────────────────────────
const MAINTENANCE_MODE = true;
// ─────────────────────────────────────────────────────────────────────────────

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'CollabX',

  title: {
    default: 'CollabX — Real Time Collaborative IDE',
    template: '%s | CollabX',
  },

  description:
    'CollabX by Syed Anas — A real-time collaborative IDE designed for students and developers. Experience seamless pair programming and remote interviews with instant multi-language code execution, built-in voice chat, and an interactive whiteboard—all in one shared workspace.',

  keywords: [
    // Primary — high-volume collaborative IDE terms
    'collaborative IDE',
    'real-time code collaboration',
    'collaborative code editor',
    'pair programming platform',
    'online collaborative IDE',
    'multiplayer code editor',
    // Secondary — use-case terms
    'code together online',
    'collaborative coding platform',
    'remote pair programming',
    'team coding platform',
    'code collaboration tool',
    'shared code editor',
    'collaborative development environment',
    'online pair programming',
    'technical interview platform',
    'remote code interview',
    'coding interview tool',
    // Long-tail
    'real time collaborative coding',
    'code with friends online',
    'browser based IDE collaboration',
    'collaborative Java Python C++ editor',
    'CollabX',
    'live coding platform',
    'online coding workspace',
    'collaborative coding interview',
    'real-time code sharing',
  ],

  authors: [
    { name: 'CollabX', url: SITE_URL },
    { name: 'Syed Anas', url: 'https://github.com/Anas-Sd' },
    {name : 'Syed Anas', url: 'https://www.linkedin.com/in/-syedanas'}
  ],
  creator: 'Syed Anas',
  publisher: 'Syed Anas',

  // ── Robots directives ──────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Open Graph (Facebook, LinkedIn, WhatsApp, Slack, Discord) ─────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'CollabX',
    title: 'CollabX — Real-Time Collaborative IDE',
    description:
      'Code together in real-time. CollabX gives your team a shared IDE with voice chat, collaborative whiteboard, instant code execution, and role-based access — all in the browser.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CollabX — Real-Time Collaborative IDE',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X Cards ─────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@CollabX',
    creator: '@CollabX',
    title: 'CollabX — Real-Time Collaborative IDE',
    description:
      'Code together in real-time. Shared editor, voice chat, whiteboard & instant code execution in one workspace.',
    images: ['/og-image.png'],
  },

  // ── Canonical URL ──────────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },

  // ── Search engine verification ───────────────────────────────────────────
  // Google: verified via DNS TXT record in Hostinger ✅
  // Bing: verified via import from Google Search Console ✅
  // No HTML meta tag verification codes needed

  category: 'technology',

  // ── Favicon / App Icons ────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/collabx_logo.png', type: 'image/svg+xml' },      // browser tab (crisp SVG X)
      { url: '/collabx_logo.png', sizes: '512x512', type: 'image/png' }, // Google SERP
      { url: '/collabx_logo.png', sizes: '32x32', type: 'image/png' },   // legacy browsers
    ],
    shortcut: '/collabx_logo.png',
    apple: '/collabx_logo.png',
  },

  // ── App metadata ───────────────────────────────────────────────────────────
  applicationName: 'CollabX',
  referrer: 'origin-when-cross-origin',
};

export const viewport = {
  themeColor: '#F5A623',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

// ── JSON-LD Structured Data (server-rendered — read by ALL search engines) ──
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'CollabX',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/collabx_icon.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        'https://github.com/Anas-Sd/CollabX',
        'https://www.linkedin.com/in/-syedanas',
        'https://www.instagram.com/collabx.live',
        'https://x.com/collabx_live'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'office.collabx@gmail.com',
        contactType: 'customer support',
        availableLanguage: 'English',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'CollabX',
      description:
        'CollabX by Syed Anas — A real-time collaborative IDE designed for students and developers. Experience seamless pair programming and remote interviews with instant multi-language code execution, built-in voice chat, and an interactive whiteboard—all in one shared workspace.',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/login`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#app`,
      name: 'CollabX',
      alternateName: ['CollabX IDE', 'CollabX Collaborative Coding Platform'],
      url: SITE_URL,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'Integrated Development Environment',
      operatingSystem: 'Web Browser (Chrome, Firefox, Edge, Safari)',
      browserRequirements: 'Requires JavaScript',
      description:
        'CollabX by Syed Anas — A real-time collaborative IDE designed for students and developers. Experience seamless pair programming and remote interviews with instant multi-language code execution, built-in voice chat, and an interactive whiteboard—all in one shared workspace.',
      screenshot: `${SITE_URL}/og-image.png`,
      featureList: [
        'Real-time collaborative code editing with sub-100ms sync',
        'Multi-language code execution: Python, Java, C++, JavaScript, SQL',
        'Built-in WebRTC voice communication via Agora',
        'Collaborative whiteboard for architecture diagrams',
        'Role-based access: Host, Editor, Viewer',
        'Session persistence — rejoin exactly where you left off',
        'Historical workspace records',
        'Pro plan with extended sessions and expanded limits',
      ],
      offers: [
        {
          '@type': 'Offer',
          name: 'Free Plan',
          price: '0',
          priceCurrency: 'INR',
          description: 'Free collaborative workspace with core features',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'Pro Plan',
          price: '99',
          priceCurrency: 'INR',
          description:
            'Full-featured workspace with extended sessions, 20+ users, and premium effects',
          availability: 'https://schema.org/InStock',
          billingIncrement: 'P1M',
        },
      ],
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Bing: verified via GSC import — no meta tag needed */}

        {/* ── DNS prefetch for third-party origins ── */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />

        {/* ── Server-rendered JSON-LD Structured Data ─────────────────────── */}
        {/* This runs BEFORE JavaScript — guaranteed read by all search bots  */}
        <script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased text-white min-h-screen flex flex-col`}>
        {/* Google Analytics Tracking */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Mobile Blocker Overlay — data-nosnippet tells Google NOT to use this text for search results */}
        <div data-nosnippet="true" className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0A0A0F] p-8 text-center md:hidden">
          <div className="w-20 h-20 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
              <line x1="3" y1="3" x2="21" y2="21"></line>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Desktop Only</h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-sm leading-relaxed">
            CollabX is a professional collaborative IDE designed exclusively for larger screens. 
            Mobile devices are not supported.
          </p>
          <div className="w-16 h-1 bg-border rounded-full mb-8"></div>
          <p className="text-xs text-muted-foreground/50 font-mono tracking-widest uppercase">
            Please switch to a computer or turn on desktop mode in your mobile
          </p>
        </div>

        <div className="hidden md:flex flex-col min-h-screen">
          {MAINTENANCE_MODE ? (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 999999,
              background: 'linear-gradient(135deg, #0A0A0F 0%, #0f0f1a 50%, #0A0A0F 100%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '24px', padding: '40px', textAlign: 'center'
            }}>
              {/* Animated glow orb */}
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(251,191,36,0.05) 70%)',
                border: '1px solid rgba(251,191,36,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 60px rgba(251,191,36,0.2)',
                animation: 'pulse 2s infinite'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FBbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>

              {/* Brand */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px' }}>CollabX</span>
              </div>

              {/* Status badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: '999px', padding: '6px 16px'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FBbf24', animation: 'pulse 1.5s infinite' }}></div>
                <span style={{ fontSize: '13px', color: '#FBbf24', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Under Maintenance</span>
              </div>

              {/* Message */}
              <div style={{ maxWidth: '420px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#ffffff', marginBottom: '12px', lineHeight: '1.2' }}>
                  We&apos;ll be right back
                </h1>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
                  CollabX is currently undergoing scheduled maintenance. We&apos;re working hard to get everything back online. Thank you for your patience.
                </p>
              </div>

              {/* Divider */}
              <div style={{ width: '60px', height: '2px', background: 'rgba(251,191,36,0.3)', borderRadius: '2px' }}></div>

              {/* Footer note */}
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                collabx.live — expected back shortly
              </p>

              <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
            </div>
          ) : (
            <>
              <IntroSplash />
              <main id="app-content" className="flex-1 flex flex-col">
                {children}
                <ToastContainer />
              </main>
            </>
          )}
        </div>
      </body>
    </html>
  );
}
