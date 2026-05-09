import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#F5A623] selection:text-black py-24 px-6 md:px-12">
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
