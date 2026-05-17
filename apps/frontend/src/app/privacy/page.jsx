import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'CollabX Privacy Policy',
  description: 'CollabX Privacy Policy. Learn how we handle your data, ephemeral code execution, and secure peer-to-peer voice communications.',
  alternates: { canonical: 'https://collabx.live/privacy' },
};

export default function PrivacyPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://collabx.live" },
      { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://collabx.live/privacy" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#F5A623] selection:text-black py-24 px-6 md:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Privacy Policy</h1>
        
        <div className="space-y-8 text-white/60 leading-relaxed font-medium">
          <p className="text-white/80">Last Updated: May 2026</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">1. Information We Collect</h2>
            <p>When you register for CollabX, we collect basic profile information such as your name, email address, and authentication credentials. We do not collect or store any unnecessary personal data.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. Ephemeral Data & Code Execution</h2>
            <p>CollabX is designed with privacy-first engineering. The code you write within a collaborative room is completely ephemeral. It exists in memory to facilitate real-time WebSocket syncing and is processed by isolated Judge0 containers strictly for execution. Unless explicitly saved to the database by the host, all code is permanently destroyed when the session ends.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. Voice Communications</h2>
            <p>Our integrated voice channels are powered by Agora's WebRTC infrastructure. Voice data is transmitted peer-to-peer or through secure routing servers. CollabX does not record, store, or monitor any voice communications occurring within your private sessions.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">4. Third-Party Services</h2>
            <p>We use trusted third-party services (such as PostgreSQL for account data, Redis for active session tracking, and Stripe for payment processing). Your data is only shared with these services to the extent necessary to provide the CollabX platform. We do not sell your personal data to advertisers.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">5. Cookies and Local Storage</h2>
            <p>We use essential cookies and browser Local Storage (via Zustand) solely to persist your authentication state, interface preferences (like dark mode), and active room tokens. We do not use tracking cookies or cross-site analytics that compromise your privacy.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
