import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Refund Policy',
  description: 'CollabX Refund Policy. All payments are strictly non-refundable. Read about subscription cancellations, billing disputes, and service disruption policies.',
  alternates: { canonical: 'https://collabx.live/refund' },
};

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
            <h2 className="text-2xl font-bold text-white tracking-tight">1. Strict No-Refund Policy</h2>
            <p>At CollabX, we provide a generous free tier that allows all users to fully evaluate our platform and its core features before making a financial commitment. Because of this, <strong className="text-white">all payments, subscriptions, and purchases made on CollabX are strictly non-refundable under any circumstances.</strong></p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. Subscription Cancellations</h2>
            <p>You may cancel your PRO subscription at any time to prevent future billing. Once cancelled, you will retain access to your PRO features until the end of your current paid billing cycle. We do not provide prorated refunds or credits for partially used billing periods.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. Service Disruptions</h2>
            <p>While we strive for 99.9% uptime, occasional service disruptions may occur. CollabX does not offer cash refunds or financial compensation for any downtime, outages, or loss of service.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">4. Account Termination</h2>
            <p>If your account is terminated, suspended, or banned due to a violation of our Terms of Service (such as abusive behavior, cryptomining, or malicious execution), you will immediately lose access to your subscription. No refunds or credits will be issued for banned or terminated accounts.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">5. Contact and Billing Support</h2>
            <p>If you believe there has been a fraudulent charge or a billing error, please reach out to our support team immediately at <a href="mailto:office.collabx@gmail.com" className="text-white font-bold hover:underline">office.collabx@gmail.com</a>. We will investigate the transaction, but we reiterate that standard payments remain strictly non-refundable.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
