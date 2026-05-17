import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'CollabX Cookie Policy',
  description: 'CollabX Cookie Policy. Details regarding our use of essential cookies and Zustand local storage for maintaining authentication and IDE preferences.',
  alternates: { canonical: 'https://collabx.live/cookies' },
};

export default function CookiesPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://collabx.live" },
      { "@type": "ListItem", "position": 2, "name": "Cookie Policy", "item": "https://collabx.live/cookies" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#F5A623] selection:text-black py-24 px-6 md:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Cookie Policy</h1>
        <div className="space-y-6 text-white/60 leading-relaxed font-medium">
          <p>CollabX uses essential cookies and local storage (Zustand) purely to maintain your authentication state and preferences (such as dark mode and IDE themes).</p>
          <p>We do not use third-party tracking cookies or sell your browsing data.</p>
          <p>A detailed breakdown of all cookies and local storage items will be listed here.</p>
        </div>
      </div>
    </div>
  );
}
