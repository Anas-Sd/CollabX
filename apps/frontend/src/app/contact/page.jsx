import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-[#F5A623] selection:text-black py-24 px-6 md:px-12">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-8">Contact Us</h1>
        
        <div className="space-y-8 text-white/60 leading-relaxed font-medium">
          <p className="text-lg">Whether you are running into technical issues, have questions about billing, or want to discuss enterprise deployment options, our team is ready to assist you.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            
            <div className="bg-[#0A0A0F] p-8 rounded-3xl border border-white/5 flex flex-col items-start gap-4">
              <div className="w-14 h-14 bg-[#F5A623]/10 text-[#F5A623] rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-2">Email Support</h3>
                <p className="text-sm text-white/50 mb-4">For general inquiries, bug reports, and account assistance. We aim to respond within 24 hours.</p>
                <a href="mailto:office.collabx@gmail.com" className="text-[#F5A623] hover:underline font-bold">office.collabx@gmail.com</a>
              </div>
            </div>

            {/* <div className="bg-[#0A0A0F] p-8 rounded-3xl border border-white/5 flex flex-col items-start gap-4">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-2">Enterprise Sales</h3>
                <p className="text-sm text-white/50 mb-4">Looking to deploy CollabX on-premise or need custom SLAs? Talk to our sales team.</p>
                <a href="mailto:enterprise@collabx.example.com" className="text-blue-400 hover:underline font-bold">enterprise@collabx.com</a>
              </div>
            </div> */}

            {/* <div className="bg-[#0A0A0F] p-8 rounded-3xl border border-white/5 flex flex-col items-start gap-4">
              <div className="w-14 h-14 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-2">Headquarters</h3>
                <p className="text-sm text-white/50">CollabX Inc.<br/>100 Innovation Drive<br/>San Francisco, CA 94105<br/>United States</p>
              </div>
            </div> */}

            <div className="bg-[#0A0A0F] p-8 rounded-3xl border border-white/5 flex flex-col items-start gap-4">
              <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white mb-2">Phone</h3>
                <p className="text-sm text-white/50 mb-4">Available Mon-Fri, 9am - 5pm PST for Enterprise support exclusively.</p>
                <p className="text-white/80 font-bold">+91 7674088150</p>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-white/5 mt-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-4">Reporting Vulnerabilities</h2>
            <p>If you are a security researcher and believe you have found a vulnerability in our infrastructure or WebSockets implementation, please do not disclose it publicly. Contact us immediately at <a href="mailto:security.collabx@gmail.com" className="text-white font-bold">security.collabx@gmail.com</a>. We offer bug bounties for responsible disclosure.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
