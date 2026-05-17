import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'CollabX Security Overview',
  description: 'Learn about CollabX\'s security practices, including ephemeral isolated containers, WebRTC encryption, and Role-Based Access Control (RBAC).',
  alternates: { canonical: 'https://collabx.live/security' },
};

export default function SecurityPage() {
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://collabx.live" },
      { "@type": "ListItem", "position": 2, "name": "Security Overview", "item": "https://collabx.live/security" }
    ]
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#F5A623] selection:text-black py-24 px-6 md:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Security Overview</h1>
        <div className="space-y-6 text-white/60 leading-relaxed font-medium">
          <p>At CollabX, security is built into our core architecture. Every session runs in an isolated, ephemeral container.</p>
          <p>Our WebSockets and HTTP routes are fully secured via standard TLS/SSL encryption. Role-Based Access Control (RBAC) ensures that only authorized hosts can execute code or mute participants.</p>
          <p>More detailed security compliance documents will be published prior to our official launch.</p>
        </div>
      </div>
    </div>
  );
}
