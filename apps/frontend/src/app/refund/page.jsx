import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#F5A623] selection:text-black py-24 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Refund Policy</h1>
        
        <div className="space-y-8 text-white/60 leading-relaxed font-medium">
          <p className="text-white/80">Last Updated: May 2026</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">1. General Refund Terms</h2>
            <p>At CollabX, we strive to ensure you are completely satisfied with our platform. Because we offer a generous free tier for developers to test our core features, we expect users to evaluate the platform before upgrading to a paid subscription.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. Subscription Refunds</h2>
            <p>For monthly subscriptions, we offer a 7-day money-back guarantee on your first charge. If you are not satisfied within the first 7 days of upgrading, you may request a full refund. Beyond the 7-day window, monthly subscriptions are non-refundable, but you may cancel at any time to prevent future billing.</p>
            <p>For annual subscriptions, you may request a prorated refund within the first 30 days of your purchase. After 30 days, annual subscriptions are strictly non-refundable.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. Service Downtime and SLA Credits</h2>
            <p>CollabX guarantees a 99.9% uptime for our execution containers and WebSocket sync servers. If we fail to meet this SLA in any given month, Pro and Enterprise users are eligible for service credits applied to their next billing cycle. Cash refunds are not provided for downtime.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">4. Exceptions and Abuse</h2>
            <p>Refunds will not be granted if your account was terminated due to a violation of our Acceptable Use Policy or Terms of Service (e.g., using the platform for cryptomining, DDoS attacks, or malware execution). We actively monitor for abuse and reserve the right to deny refunds to fraudulent accounts.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">5. Requesting a Refund</h2>
            <p>To request a refund, please contact our billing support team via the Contact Us page. Ensure you include your account email, the transaction ID, and a brief explanation of why you are requesting the refund. Requests are typically processed within 3-5 business days.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
