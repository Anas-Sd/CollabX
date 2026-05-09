import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#F5A623] selection:text-black py-24 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Terms and Conditions</h1>
        
        <div className="space-y-8 text-white/60 leading-relaxed font-medium">
          <p className="text-white/80">Last Updated: May 2026</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">1. Acceptance of Terms</h2>
            <p>By accessing or using the CollabX platform, you agree to be bound by these Terms and Conditions. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">2. Acceptable Use Policy</h2>
            <p>Our code execution environments (powered by Judge0) are provided strictly for educational, collaborative, and professional development purposes. You explicitly agree NOT to use the platform for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cryptocurrency mining of any form.</li>
              <li>Executing malicious scripts, malware, or attempting to breach container isolation.</li>
              <li>Network scanning, DDoS attacks, or spamming external servers.</li>
              <li>Hosting or executing code that violates international copyright laws.</li>
            </ul>
            <p>Any violation of the acceptable use policy will result in immediate termination of your account and a permanent IP ban.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">3. User Accounts and Security</h2>
            <p>You are fully responsible for maintaining the security of your account and password. CollabX cannot and will not be liable for any loss or damage from your failure to comply with this security obligation. You must immediately notify CollabX of any unauthorized uses of your account or any other breaches of security.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">4. Intellectual Property</h2>
            <p>Any code you write on CollabX belongs entirely to you. We claim no ownership over your intellectual property. However, by using our real-time collaboration features, you grant us the temporary right to transmit, store, and display your code to the other participants in your active session.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">5. Limitation of Liability</h2>
            <p>CollabX is provided "as is". We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties. In no event shall CollabX be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our platform.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
